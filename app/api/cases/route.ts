import { NextRequest, NextResponse } from 'next/server';
import { verifyPaidSubscription } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { savedCases } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const saveCaseSchema = z.object({
  id: z.string(),
  caseNameEncrypted: z.string(),
  caseDateEncrypted: z.string(),
  notaryIdEncrypted: z.string(),
  isCloudSynced: z.boolean().default(true),
  encryptedPayload: z.string(),
});

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

    const cases = await db
      .select()
      .from(savedCases)
      .where(eq(savedCases.organizationId, session.organizationId));

    return NextResponse.json({ cases });
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

    const body = await req.json();
    const parsed = saveCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const { id, caseNameEncrypted, caseDateEncrypted, notaryIdEncrypted, isCloudSynced, encryptedPayload } = parsed.data;

    await db
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
      });

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
