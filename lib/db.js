import { neon } from '@neondatabase/serverless';

/**
 * Creates a Neon SQL client using the DATABASE_URL environment variable.
 * Compatible with both Vercel Postgres (migrated to Neon) and standalone Neon databases.
 */
export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please add your Neon/Vercel Postgres connection string to .env.local'
    );
  }
  return neon(process.env.DATABASE_URL);
}
