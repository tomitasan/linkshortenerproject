# Rate Limiting Setup Guide

This document explains the rate limiting implementation for the link creation endpoint and how to configure it.

## Overview

Rate limiting has been implemented to prevent abuse and spam on the link creation endpoint. The system allows each authenticated user to create **10 links per hour**.

## Implementation Details

### Technology Stack

- **@upstash/ratelimit**: Production-ready rate limiting library
- **@upstash/redis**: Serverless Redis client for distributed rate limiting
- **Algorithm**: Sliding window (provides accurate rate limiting)

### Files Modified/Created

- `lib/rate-limit.ts` - Rate limiter configuration and initialization
- `app/dashboard/actions.ts` - Updated `createLinkAction` with rate limit checks
- `.env.example` - Added required environment variables

## Setup Instructions

### 1. Create Upstash Redis Database

1. Sign up for a free account at [https://upstash.com](https://upstash.com)
2. Create a new Redis database:
   - Click "Create Database"
   - Choose a name (e.g., "linkshortener-ratelimit")
   - Select a region close to your deployment
   - Choose the "Free" tier for development
3. Copy your credentials from the database details page:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**

### 2. Configure Environment Variables

Add the following to your `.env.local` file (do NOT commit this file):

```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
```

### 3. Verify Installation

The required packages are already installed:

- `@upstash/ratelimit`
- `@upstash/redis`

## How It Works

### Rate Limit Flow

1. User attempts to create a link
2. System checks authentication (Clerk `userId`)
3. **Rate limit check** is performed using the `userId` as the identifier
4. If under limit: Request proceeds normally
5. If over limit: User receives error message with reset time

### Rate Limit Configuration

```typescript
Ratelimit.slidingWindow(10, '1 h');
```

- **10 requests** allowed
- **1 hour** time window
- **Sliding window**: More accurate than fixed windows

### Error Handling

The implementation includes graceful degradation:

- If Upstash Redis is unavailable, the system logs the error and allows the request
- This "fail open" approach prevents legitimate users from being blocked due to infrastructure issues

## Customizing Rate Limits

To change the rate limit, edit `lib/rate-limit.ts`:

```typescript
export const linkCreationRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'), // 20 requests per hour
  // ... other config
});
```

### Available Algorithms

```typescript
// Sliding window - recommended for accuracy
Ratelimit.slidingWindow(10, '1 h');

// Fixed window - simpler but less accurate at boundaries
Ratelimit.fixedWindow(10, '1 h');

// Token bucket - allows bursts
Ratelimit.tokenBucket(10, '1 h', 10);
```

## Monitoring

### Upstash Dashboard

Rate limit analytics are enabled. View metrics in your Upstash dashboard:

- Request counts per user
- Rate limit violations
- Peak usage times

### Application Logs

Rate limit violations are logged in the application console, showing:

- User ID
- Timestamp
- Remaining requests
- Reset time

## Testing Rate Limits

### Manual Testing

1. Sign in to the application
2. Attempt to create 11 links within an hour
3. The 11th attempt should fail with a rate limit error

### Automated Testing

Create a test that simulates rapid link creation:

```typescript
// Example test (pseudo-code)
for (let i = 0; i < 11; i++) {
  const result = await createLinkAction({ url: `https://example.com/${i}` });
  if (i < 10) {
    expect(result.success).toBe(true);
  } else {
    expect(result.error).toContain('Rate limit exceeded');
  }
}
```

## Production Considerations

### Scaling

- Upstash Redis is serverless and automatically scales
- No connection pooling required
- Works across multiple serverless function instances

### Cost

- Free tier includes 10,000 requests per day
- Paid tiers available for higher volumes
- See [Upstash Pricing](https://upstash.com/pricing)

### Security

- Rate limiting is per-user (authenticated with Clerk)
- Cannot be bypassed by changing IP addresses
- Protects against distributed attacks from compromised accounts

## Alternative Implementations

If you don't want to use Upstash, consider these alternatives:

### 1. In-Memory Rate Limiting (Development Only)

Simple but resets on server restart and doesn't work across instances.

### 2. Redis-Based (Self-Hosted)

Use a self-hosted Redis instance with the same rate limiting logic.

### 3. Edge Rate Limiting

Use Vercel Edge Config or Cloudflare Workers for edge-based rate limiting.

## Troubleshooting

### Rate Limiting Not Working

- Verify environment variables are set correctly
- Check Upstash dashboard for connection errors
- Review application logs for rate limiter errors

### Users Being Blocked Incorrectly

- Check if Redis is down (fail open should prevent this)
- Verify `userId` is being passed correctly
- Consider increasing rate limits for legitimate high-volume users

### Redis Connection Errors

- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are correct
- Check Upstash database status
- Review network/firewall settings

## Support

For issues with:

- **Upstash**: [https://docs.upstash.com](https://docs.upstash.com)
- **Rate Limiting Library**: [https://github.com/upstash/ratelimit](https://github.com/upstash/ratelimit)

## Summary

✅ Rate limiting is now active on link creation  
✅ Prevents spam and abuse  
✅ Production-ready and scalable  
✅ User-friendly error messages  
✅ Graceful failure handling

Remember to configure your Upstash credentials before deploying to production!
