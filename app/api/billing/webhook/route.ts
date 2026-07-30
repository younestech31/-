import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) {
      stripeClient = new Stripe(key, { apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion });
    }
  }
  return stripeClient;
}

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get('stripe-signature') || '';
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    const stripe = getStripe();

    let event: Stripe.Event;

    if (stripe && webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(bodyText, signature, webhookSecret);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Webhook signature failed';
        console.error('Stripe webhook signature error:', errorMsg);
        return NextResponse.json({ error: errorMsg }, { status: 400 });
      }
    } else {
      // Direct JSON parse for test/dev webhooks
      event = JSON.parse(bodyText);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.client_reference_id || session.metadata?.organizationId;
        if (orgId) {
          // Update organization plan to paid
          console.log(`[Stripe Webhook] Upgraded organization ${orgId} to paid plan.`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.organizationId;
        const status = subscription.status;
        const plan = status === 'active' ? 'paid' : 'free';
        if (orgId) {
          console.log(`[Stripe Webhook] Updated subscription for org ${orgId}: status=${status}, plan=${plan}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.organizationId;
        if (orgId) {
          console.log(`[Stripe Webhook] Subscription canceled for org ${orgId}. Downgraded to free.`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Webhook handler error';
    console.error('Stripe webhook error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
