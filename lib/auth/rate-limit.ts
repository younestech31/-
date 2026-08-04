import { getDb } from '@/lib/db/client';
import { rateLimits } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const loginAttemptMap = new Map<string, RateLimitRecord>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

/**
 * Durable rate-limiter with PostgreSQL persistence and in-memory fallback.
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number = MAX_ATTEMPTS,
  windowMs: number = WINDOW_MS
): Promise<{ success: boolean; remaining: number }> {
  const now = Date.now();
  const db = getDb();

  if (db) {
    try {
      const existing = await db.select().from(rateLimits).where(eq(rateLimits.key, key)).limit(1);

      if (existing.length === 0 || existing[0].resetTime.getTime() < now) {
        const resetTime = new Date(now + windowMs);
        await db
          .insert(rateLimits)
          .values({ key, count: 1, resetTime })
          .onConflictDoUpdate({
            target: rateLimits.key,
            set: { count: 1, resetTime },
          });
        return { success: true, remaining: maxAttempts - 1 };
      }

      const record = existing[0];
      if (record.count >= maxAttempts) {
        return { success: false, remaining: 0 };
      }

      const newCount = record.count + 1;
      await db
        .update(rateLimits)
        .set({ count: newCount })
        .where(eq(rateLimits.key, key));

      return { success: true, remaining: maxAttempts - newCount };
    } catch (err) {
      console.warn('DB rate limit error, using in-memory fallback:', err);
    }
  }

  // Fallback in-memory map
  const record = loginAttemptMap.get(key);
  if (!record || now > record.resetTime) {
    loginAttemptMap.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    return { success: false, remaining: 0 };
  }

  record.count += 1;
  return { success: true, remaining: maxAttempts - record.count };
}

export async function resetRateLimit(key: string): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      await db.delete(rateLimits).where(eq(rateLimits.key, key));
    } catch {}
  }
  loginAttemptMap.delete(key);
}
