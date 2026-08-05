import { NextResponse } from 'next/server';
import { verifyPaidSubscription, createExportToken } from '@/lib/auth/session';

export async function GET() {
  try {
    const { isPaid, session } = await verifyPaidSubscription();
    const token = await createExportToken(isPaid, session?.userId, session?.organizationId);

    return NextResponse.json({
      isPaid,
      token,
      plan: session?.plan || 'free',
      organizationId: session?.organizationId || null,
      userId: session?.userId || null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const freeToken = await createExportToken(false, null, null);
    return NextResponse.json(
      { error: msg, isPaid: false, token: freeToken, plan: 'free', organizationId: null, userId: null },
      { status: 500 }
    );
  }
}
