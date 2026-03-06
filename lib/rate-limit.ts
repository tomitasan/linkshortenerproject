import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiter configuration for link creation
 *
 * Uses Upstash Redis for distributed rate limiting in production.
 * This ensures rate limits work correctly across multiple serverless instances.
 *
 * Rate limit: 10 requests per hour per user
 *
 * Environment variables required:
 * - UPSTASH_REDIS_REST_URL: Your Upstash Redis REST URL
 * - UPSTASH_REDIS_REST_TOKEN: Your Upstash Redis REST token
 *
 * To get these credentials:
 * 1. Sign up at https://upstash.com
 * 2. Create a Redis database
 * 3. Copy the REST URL and token from the database details
 */

// Initialize Redis client for rate limiting
// If credentials are not provided, this will throw an error at runtime
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * Rate limiter for link creation
 * - Allows 10 requests per hour per user (identified by Clerk userId)
 * - Uses sliding window algorithm for accurate rate limiting
 * - Analytics enabled for monitoring (optional)
 */
export const linkCreationRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests per hour
  analytics: true, // Enable analytics in Upstash dashboard
  prefix: 'ratelimit:link_creation', // Prefix for Redis keys
});

/**
 * Checks if a user has exceeded their rate limit for link creation
 * @param userId - The Clerk user ID
 * @returns Object with success status and remaining requests
 */
export async function checkLinkCreationRateLimit(userId: string) {
  try {
    const { success, limit, reset, remaining } =
      await linkCreationRateLimiter.limit(userId);

    return {
      success,
      limit,
      reset,
      remaining,
    };
  } catch (error) {
    // If rate limiting fails (e.g., Redis is down), log the error
    // and allow the request to proceed to prevent blocking legitimate users
    console.error('Rate limit check failed:', error);

    // Return success to fail open (allow request if rate limiting service is down)
    return {
      success: true,
      limit: 10,
      reset: Date.now() + 3600000, // 1 hour from now
      remaining: 10,
    };
  }
}
