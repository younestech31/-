import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { organizations } from '@/lib/db/schema';

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

    // In production, require valid stripe client & webhook secret to prevent spoofing
    if (process.env.NODE_ENV === 'production') {
      if (!stripe || !webhookSecret) {
        return NextResponse.json({ error: 'Webhook environment misconfigured in production' }, { status: 400 });
      }
    }

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
      // Direct JSON parse for test/dev webhooks only outside production
      event = JSON.parse(bodyText);
    }

    const db = getDb();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.client_reference_id || session.metadata?.organizationId;
        const customerId = typeof session.customer === 'string' ? session.customer : null;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;

        if (orgId && db) {
          await db
            .update(organizations)
            .set({
              plan: 'paid',
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              updatedAt: new Date(),
            })
            .where(eq(organizations.id, orgId));
          console.log(`[Stripe Webhook] Upgraded organization ${orgId} to paid plan in DB.`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.organizationId;
        const status = subscription.status;
        const plan = status === 'active' ? 'paid' : 'free';
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;

        if (db) {
          if (orgId) {
            await db
              .update(organizations)
              .set({ plan, updatedAt: new Date() })
              .where(eq(organizations.id, orgId));
          } else if (customerId) {
            await db
              .update(organizations)
              .set({ plan, updatedAt: new Date() })
              .where(eq(organizations.stripeCustomerId, customerId));
          }
          console.log(`[Stripe Webhook] Updated subscription for org ${orgId || customerId}: status=${status}, plan=${plan}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.organizationId;
        const subId = subscription.id;

        if (db) {
          if (orgId) {
            await db
              .update(organizations)
              .set({ plan: 'free', updatedAt: new Date() })
              .where(eq(organizations.id, orgId));
          } else if (subId) {
            await db
              .update(organizations)
              .set({ plan: 'free', updatedAt: new Date() })
              .where(eq(organizations.stripeSubscriptionId, subId));
          }
          console.log(`[Stripe Webhook] Subscription canceled for org ${orgId || subId}. Downgraded to free.`);
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
