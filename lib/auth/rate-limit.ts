/**
 * Simple in-memory sliding window rate-limiter for auth routes.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const loginAttemptMap = new Map<string, RateLimitRecord>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export function checkRateLimit(key: string): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = loginAttemptMap.get(key);

  if (!record || now > record.resetTime) {
    loginAttemptMap.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return { success: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { success: false, remaining: 0 };
  }

  record.count += 1;
  return { success: true, remaining: MAX_ATTEMPTS - record.count };
}

export function resetRateLimit(key: string): void {
  loginAttemptMap.delete(key);
}
