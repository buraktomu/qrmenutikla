import { headers } from 'next/headers';

type RateLimitRecord = {
  timestamps: number[];
};

// Global registry that persists across Next.js HMR reloads
const globalForRateLimit = globalThis as unknown as {
  rateLimitRegistry: Map<string, RateLimitRecord> | undefined;
};

if (!globalForRateLimit.rateLimitRegistry) {
  globalForRateLimit.rateLimitRegistry = new Map<string, RateLimitRecord>();
}

const registry = globalForRateLimit.rateLimitRegistry;

// Cleanup expired entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of registry.entries()) {
    // Keep only timestamps from the last 15 minutes
    const validTimestamps = record.timestamps.filter(
      (time) => now - time < 15 * 60 * 1000
    );
    if (validTimestamps.length === 0) {
      registry.delete(key);
    } else {
      record.timestamps = validTimestamps;
    }
  }
}, 5 * 60 * 1000).unref?.(); // Run every 5 minutes in background

/**
 * Checks if a client IP has exceeded the allowed request limit for a given key.
 * @param key Unique identifier for the endpoint (e.g. "login", "ai-generate")
 * @param limit Maximum allowed requests in the time window
 * @param windowMs Time window in milliseconds
 * @returns Object indicating if rate limit is exceeded and the remaining allowance
 */
export async function rateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  // Extract client IP address securely
  const headerList = await headers();
  const ip =
    headerList.get('x-forwarded-for')?.split(',')[0].trim() ||
    headerList.get('x-real-ip') ||
    '127.0.0.1';

  const registryKey = `${key}:${ip}`;
  const now = Date.now();
  
  let record = registry.get(registryKey);
  if (!record) {
    record = { timestamps: [] };
    registry.set(registryKey, record);
  }

  // Filter timestamps outside of the current window
  record.timestamps = record.timestamps.filter((time) => now - time < windowMs);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0];
    const resetTime = oldestTimestamp + windowMs;
    return {
      success: false,
      limit,
      remaining: 0,
      reset: resetTime,
    };
  }

  // Record this request
  record.timestamps.push(now);
  
  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    reset: now + windowMs,
  };
}
