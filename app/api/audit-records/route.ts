import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { auditRecords } from '@/lib/db/schema';
import { z } from 'zod';

const auditRecordSchema = z.object({
  combinedHash: z.string().length(64), // SHA-256 hex string
  auditId: z.string(),
  registryVersion: z.string(),
  timestamp: z.string(),
  buildId: z.string(),
  summary: z.record(z.string(), z.unknown()),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = auditRecordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid audit record payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { combinedHash, auditId, registryVersion, timestamp, buildId, summary } = parsed.data;

    // Strict privacy verification: ensure no identifying heir names or serialized input exist
    const summaryStr = JSON.stringify(summary);
    if (summaryStr.includes('serializedInput') || summaryStr.includes('heirNames')) {
      return NextResponse.json(
        { error: 'Payload contains prohibited identifying fields' },
        { status: 400 }
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection unavailable' }, { status: 503 });
    }

    await db
      .insert(auditRecords)
      .values({
        combinedHash,
        auditId,
        registryVersion,
        timestamp,
        buildId,
        summary,
      })
      .onConflictDoUpdate({
        target: auditRecords.combinedHash,
        set: {
          auditId,
          registryVersion,
          timestamp,
          buildId,
          summary,
        },
      });

    return NextResponse.json({ success: true, combinedHash });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
