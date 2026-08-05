import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/entitlements/route';
import * as sessionModule from '@/lib/auth/session';

describe('Entitlements and Monetization Fallback (C1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('API route defaults to isPaid: false when subscription is not paid', async () => {
    vi.spyOn(sessionModule, 'verifyPaidSubscription').mockResolvedValue({
      isPaid: false,
      session: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(data.isPaid).toBe(false);
    expect(data.plan).toBe('free');
  });

  it('API route defaults to isPaid: false when verification throws an error', async () => {
    vi.spyOn(sessionModule, 'verifyPaidSubscription').mockRejectedValue(new Error('Session error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.isPaid).toBe(false);
    expect(data.plan).toBe('free');
  });

  it('Client fetch helper resolves isPaid: false on error or non-paid response', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = fetchMock;

    async function getClientEntitlements() {
      try {
        const res = await fetch('/api/entitlements');
        if (res.ok) {
          const data = await res.json();
          return { isPaid: Boolean(data.isPaid), plan: data.plan || 'free' };
        }
      } catch {
        // Fallback
      }
      return { isPaid: false, plan: 'free' };
    }

    const result = await getClientEntitlements();
    expect(result.isPaid).toBe(false);
    expect(result.plan).toBe('free');
  });
});
