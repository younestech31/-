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
const FALLBACK_SECRET = 'default_fallback_session_secret_32_characters_minimum';

function validateSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
      throw new Error('SESSION_SECRET environment variable is missing or must be at least 32 characters long.');
    }
    return FALLBACK_SECRET;
  }
  return secret;
}

if (typeof window === 'undefined') {
  validateSessionSecret();
}

function getJwtSecretKey(): Uint8Array {
  const secret = validateSessionSecret();
  return new TextEncoder().encode(secret);
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

    // Only sessions minted after the email-verification gate are accepted.
    // This also invalidates legacy pre-verification JWTs already in circulation.
    if (!payload.userId || !payload.organizationId || payload.emailVerified !== true) return null;

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
export async function setSessionCookie(session: UserSession & { emailVerified: true }): Promise<void> {
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
 * Creates a signed, short-lived (5m) JWT entitlement token for export finalization.
 */
export async function createExportToken(isPaid: boolean, userId?: string | null, orgId?: string | null): Promise<string> {
  const secretKey = getJwtSecretKey();
  return new SignJWT({
    isPaid,
    userId: userId || null,
    orgId: orgId || null,
    action: 'export_finalize',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(secretKey);
}

/**
 * Verifies signed short-lived export token.
 */
export async function verifyExportToken(token: string): Promise<{ isPaid: boolean; userId?: string | null; orgId?: string | null } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      algorithms: ['HS256'],
    });
    if (payload.action !== 'export_finalize') return null;
    return {
      isPaid: Boolean(payload.isPaid),
      userId: (payload.userId as string) || null,
      orgId: (payload.orgId as string) || null,
    };
  } catch {
    return null;
  }
}

/**
 * Guard for billing-gated features (e.g. Cloud Sync, Unlimited Munasakhat Stages, Watermark Removal).
 * Paid access is granted only when the current organization plan is confirmed by the database.
 * A stale JWT claim or database outage must never preserve paid privileges.
 */
export async function verifyPaidSubscription(): Promise<{ isPaid: boolean; session: UserSession | null }> {
  const session = await getSession();
  if (!session) {
    return { isPaid: false, session: null };
  }

  const freeSession: UserSession = { ...session, plan: 'free' };
  if (!session.organizationId) {
    return { isPaid: false, session: freeSession };
  }

  const db = getDb();
  if (!db) {
    return { isPaid: false, session: freeSession };
  }

  try {
    const orgs = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, session.organizationId))
      .limit(1);

    if (orgs.length === 0) {
      return { isPaid: false, session: freeSession };
    }

    const dbPlan = orgs[0].plan === 'paid' ? 'paid' : 'free';
    return {
      isPaid: dbPlan === 'paid',
      session: { ...session, plan: dbPlan },
    };
  } catch (err) {
    console.error('[verifyPaidSubscription] DB re-check failed; denying paid access:', err);
    return { isPaid: false, session: freeSession };
  }
}
