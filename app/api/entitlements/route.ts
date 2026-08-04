import { NextResponse } from 'next/server';
import { verifyPaidSubscription } from '@/lib/auth/session';

export async function GET() {
  try {
    const { isPaid, session } = await verifyPaidSubscription();
    return NextResponse.json({
      isPaid,
      plan: session?.plan || 'free',
      organizationId: session?.organizationId || null,
      userId: session?.userId || null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: msg, isPaid: false, plan: 'free', organizationId: null, userId: null },
      { status: 500 }
    );
  }
}
