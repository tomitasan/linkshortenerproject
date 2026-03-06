import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '@/lib/env';

/**
 * Database instance with validated connection string
 * Environment variables are validated on module initialization
 */
const db = drizzle(env.DATABASE_URL);

export { db };
