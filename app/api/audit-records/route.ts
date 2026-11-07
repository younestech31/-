import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { auditRecords } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/auth/rate-limit';

const MAX_REQUEST_BYTES = 8 * 1024;

const auditSummarySchema = z.object({
  estate: z.number().finite().nonnegative(),
  netEstate: z.number().finite(),
  heirCount: z.number().int().min(0).max(10_000),
  stagesCount: z.number().int().min(0).max(1_000),
}).strict();

const hashSchema = z.string().regex(/^[a-f0-9]{64}$/i);

const auditRecordSchema = z.object({
  combinedHash: hashSchema,
  previousRecordHash: z.union([z.literal('GENESIS'), hashSchema]).optional(),
  auditId: z.string().min(6).max(40).regex(/^AUDIT-[A-Z0-9]+$/),
  registryVersion: z.string().min(1).max(100),
  timestamp: z.string().datetime({ offset: true }),
  buildId: z.string().min(1).max(120),
  summary: auditSummarySchema,
}).strict();

function sameSummary(
  left: z.infer<typeof auditSummarySchema>,
  right: z.infer<typeof auditSummarySchema>
): boolean {
  return left.estate === right.estate
    && left.netEstate === right.netEstate
    && left.heirCount === right.heirCount
    && left.stagesCount === right.stagesCount;
}

function sameRecord(
  existing: typeof auditRecords.$inferSelect,
  candidate: z.infer<typeof auditRecordSchema>,
  previousRecordHash: string
): boolean {
  return existing.previousRecordHash === previousRecordHash
    && existing.auditId === candidate.auditId
    && existing.registryVersion === candidate.registryVersion
    && existing.timestamp === candidate.timestamp
    && existing.buildId === candidate.buildId
    && sameSummary(existing.summary as z.infer<typeof auditSummarySchema>, candidate.summary);
}

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

    // This checks predecessor references only. Hashes are client-submitted and
    // this endpoint does not recompute payload hashes or verify digital signatures.
    const hashes = new Set(records.map(record => record.combinedHash));
    let chainValid = true;
    let brokenAtRecord: string | null = null;

    for (const record of records) {
      const previous = record.previousRecordHash;
      if (!previous || previous === 'GENESIS') continue;
      if (previous === record.combinedHash || !hashes.has(previous)) {
        chainValid = false;
        brokenAtRecord = record.combinedHash;
        break;
      }
    }

    return NextResponse.json({
      predecessorReferencesPresent: chainValid,
      totalRecords: records.length,
      brokenAtRecord,
      verificationScope: 'predecessor-reference-only',
      cryptographicIntegrityVerified: false,
      digitalSignatureVerified: false,
    });
  } catch {
    return NextResponse.json({ error: 'Unable to read audit ledger' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: 'Audit record payload is too large' }, { status: 413 });
    }

    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: 'Audit record payload is too large' }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const parsed = auditRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid audit record payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = req.headers.get('x-real-ip') || forwardedFor?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = await checkRateLimit(`audit-ledger:${clientIp}`, 10, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many audit submissions. Try again shortly.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const candidate = parsed.data;
    const previousRecordHash = candidate.previousRecordHash || 'GENESIS';

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection unavailable' }, { status: 503 });
    }

    // Records are append-only, but the hash is supplied by the client and is
    // not recomputed here. This endpoint is a metadata ledger, not a signature authority.
    // A repeated identical submission is idempotent; conflicting metadata is rejected.
    const existing = await db
      .select()
      .from(auditRecords)
      .where(eq(auditRecords.combinedHash, candidate.combinedHash))
      .limit(1);

    if (existing.length > 0) {
      if (sameRecord(existing[0], candidate, previousRecordHash)) {
        return NextResponse.json({
          success: true,
          duplicate: true,
          combinedHash: candidate.combinedHash,
          previousRecordHash,
        });
      }
      return NextResponse.json({ error: 'An audit record with this hash already exists' }, { status: 409 });
    }

    const inserted = await db
      .insert(auditRecords)
      .values({
        combinedHash: candidate.combinedHash.toLowerCase(),
        previousRecordHash,
        auditId: candidate.auditId,
        registryVersion: candidate.registryVersion,
        timestamp: candidate.timestamp,
        buildId: candidate.buildId,
        summary: candidate.summary,
      })
      .onConflictDoNothing({ target: auditRecords.combinedHash })
      .returning({ combinedHash: auditRecords.combinedHash });

    if (inserted.length === 0) {
      // Handle a concurrent duplicate: read the winner and compare immutably.
      const concurrent = await db
        .select()
        .from(auditRecords)
        .where(eq(auditRecords.combinedHash, candidate.combinedHash.toLowerCase()))
        .limit(1);

      if (concurrent.length > 0 && sameRecord(concurrent[0], candidate, previousRecordHash)) {
        return NextResponse.json({
          success: true,
          duplicate: true,
          combinedHash: candidate.combinedHash.toLowerCase(),
          previousRecordHash,
        });
      }
      return NextResponse.json({ error: 'An audit record with this hash already exists' }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      combinedHash: candidate.combinedHash.toLowerCase(),
      previousRecordHash,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unable to store audit record' }, { status: 500 });
  }
}
