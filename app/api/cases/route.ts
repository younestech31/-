import { NextRequest, NextResponse } from 'next/server';
import { verifyPaidSubscription } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { savedCases, organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';

const MAX_REQUEST_BYTES = 4 * 1024 * 1024;

const saveCaseSchema = z.object({
  id: z.string().min(1).max(128),
  caseNameEncrypted: z.string().max(16 * 1024),
  caseDateEncrypted: z.string().max(4 * 1024),
  notaryIdEncrypted: z.string().max(16 * 1024),
  isCloudSynced: z.boolean().default(true),
  encryptedPayload: z.string().min(1).max(3_800_000),
}).strict();

export async function GET(_req: NextRequest) {
  try {
    const { isPaid, session } = await verifyPaidSubscription();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isPaid) {
      return NextResponse.json({ error: 'Cloud Sync requires a paid subscription plan.' }, { status: 403 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const orgRows = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, session.organizationId));

    let cloudSyncSalt = orgRows.length > 0 ? orgRows[0].cloudSyncSalt : null;
    if (!cloudSyncSalt) {
      cloudSyncSalt = crypto.randomBytes(16).toString('hex');
      if (orgRows.length > 0) {
        await db
          .update(organizations)
          .set({ cloudSyncSalt })
          .where(eq(organizations.id, session.organizationId));
      }
    }

    const cases = await db
      .select()
      .from(savedCases)
      .where(eq(savedCases.organizationId, session.organizationId));

    return NextResponse.json({ cases, cloudSyncSalt });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { isPaid, session } = await verifyPaidSubscription();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isPaid) {
      return NextResponse.json({ error: 'Cloud Sync requires a paid subscription plan.' }, { status: 403 });
    }

    const contentLength = Number(req.headers.get('content-length') || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: 'Cloud case payload is too large' }, { status: 413 });
    }

    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: 'Cloud case payload is too large' }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }
    const parsed = saveCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const { id, caseNameEncrypted, caseDateEncrypted, notaryIdEncrypted, isCloudSynced, encryptedPayload } = parsed.data;

    const savedRows = await db
      .insert(savedCases)
      .values({
        id,
        organizationId: session.organizationId,
        userId: session.userId,
        caseNameEncrypted,
        caseDateEncrypted,
        notaryIdEncrypted,
        isCloudSynced,
        encryptedPayload,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: savedCases.id,
        set: {
          caseNameEncrypted,
          caseDateEncrypted,
          notaryIdEncrypted,
          isCloudSynced,
          encryptedPayload,
          updatedAt: new Date(),
        },
        // A globally colliding case ID must never update another organization's row.
        setWhere: eq(savedCases.organizationId, session.organizationId),
      })
      .returning({ id: savedCases.id });

    if (savedRows.length === 0) {
      return NextResponse.json(
        { error: 'Case ID is already owned by another organization.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
