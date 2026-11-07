import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.doUnmock('resend');
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('Production email delivery', () => {
  it('fails without logging sensitive email HTML when RESEND_API_KEY is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', '');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    const { sendEmail } = await import('@/lib/email');
    const result = await sendEmail({
      to: 'recipient@example.test',
      subject: 'Verify account',
      html: '<a href="https://example.test/verify?token=secret-token">Verify</a>',
    });

    expect(result).toBe(false);
    expect(error).toHaveBeenCalled();
    expect(error.mock.calls.flat().join(' ')).not.toContain('secret-token');
    expect(info).not.toHaveBeenCalled();
  });

  it('keeps local email simulation available without printing the HTML body', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('RESEND_API_KEY', '');
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    const { sendEmail } = await import('@/lib/email');
    const result = await sendEmail({
      to: 'recipient@example.test',
      subject: 'Verify account',
      html: '<a href="https://example.test/verify?token=secret-token">Verify</a>',
    });

    expect(result).toBe(true);
    expect(info).toHaveBeenCalledTimes(1);
    expect(info.mock.calls.flat().join(' ')).not.toContain('secret-token');
  });

  it('uses NEXT_PUBLIC_SITE_URL when APP_URL is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://mawarith.example.test');
    vi.stubEnv('RESEND_API_KEY', 'test-api-key');

    const send = vi.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null });
    vi.doMock('resend', () => ({
      Resend: vi.fn(() => ({ emails: { send } })),
    }));

    const { sendVerificationEmail } = await import('@/lib/email');
    const result = await sendVerificationEmail('user@example.test', 'one-time-token');

    expect(result).toBe(true);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      html: expect.stringContaining(
        'https://mawarith.example.test/api/auth/verify-email?token=one-time-token'
      ),
    }));
  });

  it('refuses to build production verification links without a configured HTTPS site URL', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
    vi.stubEnv('RESEND_API_KEY', 'test-api-key');

    const send = vi.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null });
    vi.doMock('resend', () => ({
      Resend: vi.fn(() => ({ emails: { send } })),
    }));

    const { sendVerificationEmail } = await import('@/lib/email');
    const result = await sendVerificationEmail('user@example.test', 'one-time-token');

    expect(result).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
});
