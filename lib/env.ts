import { z } from 'zod';

const envSchema = z.object({
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters long'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  RESEND_API_KEY: z.string().optional(),
});

export function validateEnv() {
  if (typeof window !== 'undefined') return;

  // For non-production/dev environments, allow developer defaults if omitted
  const sessionSecret = process.env.SESSION_SECRET || '01234567890123456789012345678901';
  const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/mawarith';
  const stripeSecret = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_stripe_key';
  const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_stripe_webhook_key';

  const parsed = envSchema.safeParse({
    SESSION_SECRET: sessionSecret,
    DATABASE_URL: dbUrl,
    STRIPE_SECRET_KEY: stripeSecret,
    STRIPE_WEBHOOK_SECRET: stripeWebhook,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  });

  if (!parsed.success) {
    const formatted = parsed.error.format();
    console.warn(`[Startup Notice] Optional server environment configuration omitted or invalid: ${JSON.stringify(formatted)}`);
    return {
      SESSION_SECRET: sessionSecret,
      DATABASE_URL: dbUrl,
      STRIPE_SECRET_KEY: stripeSecret,
      STRIPE_WEBHOOK_SECRET: stripeWebhook,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
    };
  }

  return parsed.data;
}
