import { NextRequest, NextResponse } from 'next/server';
import { verifyPaidSubscription } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { savedCases } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const MAX_REQUEST_BYTES = 4 * 1024 * 1024;

const updateCaseSchema = z.object({
  caseNameEncrypted: z.string().max(16 * 1024),
  caseDateEncrypted: z.string().max(4 * 1024),
  notaryIdEncrypted: z.string().max(16 * 1024),
  isCloudSynced: z.boolean().default(true),
  encryptedPayload: z.string().min(1).max(3_800_000),
}).strict();

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || id.length > 128) {
      return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 });
    }
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
    const parsed = updateCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const { caseNameEncrypted, caseDateEncrypted, notaryIdEncrypted, isCloudSynced, encryptedPayload } = parsed.data;

    const updatedRows = await db
      .update(savedCases)
      .set({
        caseNameEncrypted,
        caseDateEncrypted,
        notaryIdEncrypted,
        isCloudSynced,
        encryptedPayload,
        updatedAt: new Date(),
      })
      .where(and(eq(savedCases.id, id), eq(savedCases.organizationId, session.organizationId)))
      .returning({ id: savedCases.id });

    if (updatedRows.length === 0) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || id.length > 128) {
      return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 });
    }
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

    const deletedRows = await db
      .delete(savedCases)
      .where(and(eq(savedCases.id, id), eq(savedCases.organizationId, session.organizationId)))
      .returning({ id: savedCases.id });

    if (deletedRows.length === 0) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
