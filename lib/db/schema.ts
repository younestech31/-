import { pgTable, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

/**
 * Organizations Table (Firm Seats / Tenants)
 */
export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  plan: text('plan').notNull().default('free'), // 'free' | 'paid'
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  maxFirmSeats: integer('max_firm_seats').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Users Table
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name').notNull(),
  role: text('role').notNull().default('notary'), // 'notary' | 'admin' | 'clerk'
  organizationId: text('organization_id').references(() => organizations.id),
  emailVerified: boolean('email_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Subscriptions Table
 */
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id).notNull(),
  plan: text('plan').notNull(), // 'free' | 'pro_notary' | 'firm_unlimited'
  status: text('status').notNull(), // 'active' | 'canceled' | 'past_due'
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Saved Cases Table
 * SECURITY & ZERO-TRUST RULE: Must store ONLY encrypted case metadata
 * (case name, date, notary ID). NEVER raw heir or estate figures server-side
 * unless the user explicitly opts into cloud sync.
 */
export const savedCases = pgTable('saved_cases', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  caseNameEncrypted: text('case_name_encrypted').notNull(),
  caseDateEncrypted: text('case_date_encrypted').notNull(),
  notaryIdEncrypted: text('notary_id_encrypted').notNull(),
  isCloudSynced: boolean('is_cloud_synced').notNull().default(false),
  encryptedPayload: text('encrypted_payload'), // Present ONLY if user explicitly opts into cloud sync
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Audit Records Table (Forensic Ledger)
 * NON-IDENTIFYING SERVER-SIDE AUDIT LEDGER
 * Stores ONLY combinedHash (primary key), auditId, registryVersion, timestamp, buildId, and summary object.
 * NEVER stores raw heir names, personal identification, or serialized input.
 */
export const auditRecords = pgTable('audit_records', {
  combinedHash: text('combined_hash').primaryKey(),
  auditId: text('audit_id').notNull(),
  registryVersion: text('registry_version').notNull(),
  timestamp: text('timestamp').notNull(),
  buildId: text('build_id').notNull(),
  summary: jsonb('summary').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Rate Limits Table (Durable Store for Auth Rate Limiting)
 */
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(1),
  resetTime: timestamp('reset_time').notNull(),
});

