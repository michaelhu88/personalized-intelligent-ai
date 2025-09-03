import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;

export function getDatabase(env?: { DATABASE_URL?: string }) {
  if (db) return db;
  
  const databaseUrl = env?.DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.warn('DATABASE_URL not configured - database operations will be disabled');
    return null;
  }

  try {
    const sql = neon(databaseUrl);
    db = drizzle(sql, { schema });
    return db;
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
    return null;
  }
}

export function isDatabaseEnabled(env?: { DATABASE_URL?: string }): boolean {
  return !!(env?.DATABASE_URL || process.env.DATABASE_URL);
}

export type Database = NonNullable<ReturnType<typeof getDatabase>>;
export { schema };