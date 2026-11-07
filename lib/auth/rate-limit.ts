import { getDb } from '@/lib/db/client';
import { rateLimits } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const loginAttemptMap = new Map<string, RateLimitRecord>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

/**
 * Durable, atomic rate limiter backed by PostgreSQL.
 * A single UPSERT increments the counter, avoiding the previous read-then-write
 * race where concurrent authentication requests could overwrite each other's count.
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number = MAX_ATTEMPTS,
  windowMs: number = WINDOW_MS
): Promise<{ success: boolean; remaining: number }> {
  const now = Date.now();
  const nowDate = new Date(now);
  const nextResetTime = new Date(now + windowMs);
  const db = getDb();

  if (db) {
    try {
      const rows = await db
        .insert(rateLimits)
        .values({ key, count: 1, resetTime: nextResetTime })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: {
            count: sql`CASE
              WHEN ${rateLimits.resetTime} <= ${nowDate} THEN 1
              ELSE ${rateLimits.count} + 1
            END`,
            resetTime: sql`CASE
              WHEN ${rateLimits.resetTime} <= ${nowDate} THEN ${nextResetTime}
              ELSE ${rateLimits.resetTime}
            END`,
          },
        })
        .returning({ count: rateLimits.count });

      const count = rows[0]?.count;
      if (typeof count !== 'number') {
        throw new Error('Rate-limit upsert did not return the updated counter');
      }

      return {
        success: count <= maxAttempts,
        remaining: Math.max(0, maxAttempts - count),
      };
    } catch (err) {
      console.warn('DB rate limit error, using in-memory fallback:', err);
    }
  }

  // Best-effort fallback for development / database outages.
  // Production authentication still requires the database for credential validation.
  const record = loginAttemptMap.get(key);
  if (!record || now >= record.resetTime) {
    loginAttemptMap.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: Math.max(0, maxAttempts - 1) };
  }

  if (record.count >= maxAttempts) {
    return { success: false, remaining: 0 };
  }

  record.count += 1;
  return {
    success: true,
    remaining: Math.max(0, maxAttempts - record.count),
  };
}

export async function resetRateLimit(key: string): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      await db.delete(rateLimits).where(sql`${rateLimits.key} = ${key}`);
    } catch {
      // The in-memory counter is cleared below even when the database is unavailable.
    }
  }
  loginAttemptMap.delete(key);
}
