import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { auditRecords } from '@/lib/db/schema';
import { desc, asc } from 'drizzle-orm';
import { z } from 'zod';

const auditRecordSchema = z.object({
  combinedHash: z.string().length(64), // SHA-256 hex string
  previousRecordHash: z.string().optional(),
  auditId: z.string(),
  registryVersion: z.string(),
  timestamp: z.string(),
  buildId: z.string(),
  summary: z.record(z.string(), z.unknown()),
});

export async function GET(_req: NextRequest) {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection unavailable' }, { status: 503 });
    }

    const records = await db
      .select()
      .from(auditRecords)
      .orderBy(asc(auditRecords.createdAt));

    let chainValid = true;
    let brokenAtRecord: string | null = null;

    for (let i = 1; i < records.length; i++) {
      const prevCombined = records[i - 1].combinedHash;
      const currentPrev = records[i].previousRecordHash;
      if (currentPrev && currentPrev !== 'GENESIS' && currentPrev !== prevCombined) {
        chainValid = false;
        brokenAtRecord = records[i].combinedHash;
        break;
      }
    }

    return NextResponse.json({
      chainValid,
      totalRecords: records.length,
      brokenAtRecord,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

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

    const { combinedHash, previousRecordHash, auditId, registryVersion, timestamp, buildId, summary } = parsed.data;

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

    let finalPrevHash = previousRecordHash;
    if (!finalPrevHash) {
      const latest = await db.select().from(auditRecords).orderBy(desc(auditRecords.createdAt)).limit(1);
      finalPrevHash = latest.length > 0 ? latest[0].combinedHash : 'GENESIS';
    }

    await db
      .insert(auditRecords)
      .values({
        combinedHash,
        previousRecordHash: finalPrevHash,
        auditId,
        registryVersion,
        timestamp,
        buildId,
        summary,
      })
      .onConflictDoUpdate({
        target: auditRecords.combinedHash,
        set: {
          previousRecordHash: finalPrevHash,
          auditId,
          registryVersion,
          timestamp,
          buildId,
          summary,
        },
      });

    return NextResponse.json({ success: true, combinedHash, previousRecordHash: finalPrevHash });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
