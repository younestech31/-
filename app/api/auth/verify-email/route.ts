import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailVerificationToken } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
  }

  const payload = await verifyEmailVerificationToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
  }

  const db = getDb();
  if (!db) {
    return NextResponse.redirect(new URL('/login?error=db_unset', req.url));
  }

  try {
    const verifiedUsers = await db
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(and(eq(users.id, payload.userId), eq(users.email, payload.email)))
      .returning({ id: users.id });

    if (verifiedUsers.length === 0) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
    }

    return NextResponse.redirect(new URL('/login?info=email_verified', req.url));
  } catch (err) {
    console.error('Failed to verify email:', err);
    return NextResponse.redirect(new URL('/login?error=verification_failed', req.url));
  }
}
