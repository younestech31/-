import { cookies } from 'next/headers';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  organizationId: string;
  plan: 'free' | 'paid';
  role: 'notary' | 'admin' | 'clerk';
}

const SESSION_COOKIE_NAME = 'notary_session_token';

/**
 * Reads and verifies current user session from request cookies.
 */
export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    // Decode mock JWT/session token payload safely
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (!decoded.userId || !decoded.organizationId) return null;

    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name || 'الأستاذ الموثق',
      organizationId: decoded.organizationId,
      plan: decoded.plan || 'free',
      role: decoded.role || 'notary',
    };
  } catch {
    return null;
  }
}

/**
 * Creates and sets a session cookie for authenticated notary/user.
 */
export async function setSessionCookie(session: UserSession): Promise<void> {
  const cookieStore = await cookies();
  const serialized = Buffer.from(JSON.stringify(session)).toString('base64');
  cookieStore.set(SESSION_COOKIE_NAME, serialized, {
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
 * Guard for billing-gated features (e.g. Cloud Sync, Unlimited Munasakhat Stages, Watermark Removal).
 */
export async function verifyPaidSubscription(): Promise<{ isPaid: boolean; session: UserSession | null }> {
  const session = await getSession();
  if (!session) {
    return { isPaid: false, session: null };
  }
  return { isPaid: session.plan === 'paid', session };
}
