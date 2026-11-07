import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadWebhook(database: unknown) {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('STRIPE_SECRET_KEY', '');
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', '');
  vi.doMock('@/lib/db/client', () => ({ getDb: () => database }));

  const { POST } = await import('@/app/api/billing/webhook/route');
  const { NextRequest } = await import('next/server');

  return (event: unknown) => POST(new NextRequest('http://localhost/api/billing/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(event),
  }));
}

afterEach(() => {
  vi.doUnmock('@/lib/db/client');
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.restoreAllMocks();
});

describe('Stripe webhook persistence and payment-state guards', () => {
  it('returns 503 when the database is unavailable so Stripe can retry', async () => {
    const post = await loadWebhook(null);
    const response = await post({ type: 'unhandled.test.event', data: { object: {} } });

    expect(response.status).toBe(503);
  });

  it('does not upgrade an organization before checkout payment is settled', async () => {
    const set = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) });
    const update = vi.fn().mockReturnValue({ set });
    const database = { update };
    const post = await loadWebhook(database);
    const response = await post({
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: 'org-1',
          customer: 'cus_1',
          subscription: 'sub_1',
          payment_status: 'unpaid',
        },
      },
    });

    expect(response.status).toBe(200);
    expect(update).not.toHaveBeenCalled();
  });

  it('persists a settled checkout payment', async () => {
    const where = vi.fn().mockResolvedValue([]);
    const set = vi.fn().mockReturnValue({ where });
    const update = vi.fn().mockReturnValue({ set });
    const database = { update };
    const post = await loadWebhook(database);
    const response = await post({
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: 'org-1',
          customer: 'cus_1',
          subscription: 'sub_1',
          payment_status: 'paid',
        },
      },
    });

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(expect.objectContaining({
      plan: 'paid',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_1',
    }));
  });
});
