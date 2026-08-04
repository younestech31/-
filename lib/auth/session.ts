import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { organizations } from '@/lib/db/schema';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  organizationId: string;
  plan: 'free' | 'paid';
  role: 'notary' | 'admin' | 'clerk';
}

const SESSION_COOKIE_NAME = 'notary_session_token';

const DEFAULT_DEV_SESSION_SECRET = 'default-dev-session-secret-at-least-32-chars-long-notaire-lattab-2026';

function getJwtSecretKey(): Uint8Array {
  const secretEnv = process.env.SESSION_SECRET || DEFAULT_DEV_SESSION_SECRET;
  const effectiveSecret = secretEnv.length >= 32 ? secretEnv : DEFAULT_DEV_SESSION_SECRET;
  return new TextEncoder().encode(effectiveSecret);
}

/**
 * Reads and verifies current user session from request cookies using signed JWT (HS256).
 */
export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      algorithms: ['HS256'],
    });

    if (!payload.userId || !payload.organizationId) return null;

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: (payload.name as string) || 'الأستاذ الموثق',
      organizationId: payload.organizationId as string,
      plan: (payload.plan as 'free' | 'paid') || 'free',
      role: (payload.role as 'notary' | 'admin' | 'clerk') || 'notary',
    };
  } catch {
    return null;
  }
}

/**
 * Creates and sets a signed JWT session cookie for authenticated notary/user.
 */
export async function setSessionCookie(session: UserSession): Promise<void> {
  const cookieStore = await cookies();
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getJwtSecretKey());

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Clears current session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Creates a signed JWT token for email verification expiring in 24 hours.
 */
export async function createEmailVerificationToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email, type: 'email_verify' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtSecretKey());
}

/**
 * Verifies signed email verification token.
 */
export async function verifyEmailVerificationToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      algorithms: ['HS256'],
    });
    if (payload.type !== 'email_verify' || !payload.userId || !payload.email) {
      return null;
    }
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

/**
 * Guard for billing-gated features (e.g. Cloud Sync, Unlimited Munasakhat Stages, Watermark Removal).
 * Re-checks DB plan status to prevent stale cookie or client forgery.
 */
export async function verifyPaidSubscription(): Promise<{ isPaid: boolean; session: UserSession | null }> {
  const session = await getSession();
  if (!session) {
    return { isPaid: false, session: null };
  }

  // Re-verify against database if available
  const db = getDb();
  if (db && session.organizationId) {
    try {
      const orgs = await db.select().from(organizations).where(eq(organizations.id, session.organizationId)).limit(1);
      if (orgs.length > 0) {
        const dbPlan = (orgs[0].plan === 'paid' ? 'paid' : 'free') as 'free' | 'paid';
        const isPaid = dbPlan === 'paid';
        return { isPaid, session: { ...session, plan: dbPlan } };
      }
    } catch (err) {
      console.error('[verifyPaidSubscription] DB re-check failed:', err);
    }
  }

  return { isPaid: session.plan === 'paid', session };
}
