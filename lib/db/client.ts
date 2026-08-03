import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Returns a single shared Drizzle client for serverless PostgreSQL querying.
 * Returns null if DATABASE_URL environment variable is unset.
 */
export function getDb() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!dbInstance) {
    const sql = neon(process.env.DATABASE_URL);
    dbInstance = drizzle({ client: sql, schema });
  }
  return dbInstance;
}
