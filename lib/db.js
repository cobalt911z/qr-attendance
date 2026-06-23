import { neon } from '@neondatabase/serverless';

/**
 * Creates a Neon SQL client.
 * Checks POSTGRES_URL (auto-injected by Vercel Storage) first,
 * then falls back to DATABASE_URL (manual / local setup).
 */
export function getDb() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'Database connection string is not set. ' +
      'Please add POSTGRES_URL or DATABASE_URL to your environment variables.'
    );
  }
  return neon(connectionString);
}
