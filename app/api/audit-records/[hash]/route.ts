import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { auditRecords } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;
    if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) {
      return NextResponse.json({ error: 'Invalid document hash format' }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection unavailable' }, { status: 503 });
    }

    const records = await db
      .select()
      .from(auditRecords)
      .where(eq(auditRecords.combinedHash, hash.toLowerCase()))
      .limit(1);

    if (!records || records.length === 0) {
      return NextResponse.json({ error: 'Audit record not found' }, { status: 404 });
    }

    const rec = records[0];
    return NextResponse.json({
      record: {
        combinedHash: rec.combinedHash,
        previousRecordHash: rec.previousRecordHash,
        auditId: rec.auditId,
        registryVersion: rec.registryVersion,
        timestamp: rec.timestamp,
        buildId: rec.buildId,
        summary: rec.summary,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
