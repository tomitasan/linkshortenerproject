import { z } from 'zod';

/**
 * Environment variable schema with validation rules
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .url('DATABASE_URL must be a valid URL'),

  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required')
    .startsWith(
      'pk_',
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must start with "pk_"',
    ),

  CLERK_SECRET_KEY: z
    .string()
    .min(1, 'CLERK_SECRET_KEY is required')
    .startsWith('sk_', 'CLERK_SECRET_KEY must start with "sk_"'),

  // Optional: Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

/**
 * Type for validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables on startup
 * @throws {Error} If validation fails with detailed error messages
 * @returns {Env} Validated environment variables
 */
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return `  ❌ ${path}: ${issue.message}`;
    });

    throw new Error(
      `\n🔴 Environment variable validation failed:\n${errors.join('\n')}\n\n` +
        `Please ensure all required environment variables are set in your .env.local file:\n` +
        `  - DATABASE_URL (Neon PostgreSQL connection string)\n` +
        `  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (Clerk publishable key)\n` +
        `  - CLERK_SECRET_KEY (Clerk secret key)\n\n` +
        `See AGENTS.md or README.md for more details.\n`,
    );
  }

  return parsed.data;
}

/**
 * Validated environment variables - validated once on module initialization
 */
export const env = validateEnv();
