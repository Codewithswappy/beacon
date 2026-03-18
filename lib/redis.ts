import "server-only";
import { Redis } from "@upstash/redis";

// Singleton Redis client — reused across all server-side calls
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ─── Cache key builders (centralised to avoid typos) ─────────────────────────
export const CacheKeys = {
  /** Home feed for a user, paginated by page number (Legacy) */
  feed: (userId: string, page: number) => `feed:${userId}:${page}`,

  /** Full JSON string cache of a user's feed for fast SSR */
  userFeed: (userId: string) => `user_feed:${userId}`,

  /** Timeline list containing strictly post IDs for Fan-Out architecture */
  timeline: (userId: string) => `timeline:${userId}`,

  /** Public profile for a username */
  profile: (username: string) => `profile:${username}`,

  /** Post detail */
  post: (postId: string) => `post:${postId}`,

  /** User's own posts list */
  userPosts: (userId: string, page: number) => `user_posts:${userId}:${page}`,
} as const;

// ─── TTLs (seconds) ───────────────────────────────────────────────────────────
export const TTL = {
  FEED: 60,        // 1 minute  — fresh enough for social feed
  PROFILE: 300,    // 5 minutes — profile changes rarely
  POST: 120,       // 2 minutes — individual post detail
  USER_POSTS: 60,  // 1 minute
} as const;

// ─── Typed cache helpers ──────────────────────────────────────────────────────

/**
 * Get a cached JSON value. Returns null on miss.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key);
  } catch {
    // Never break the app over a Redis miss
    return null;
  }
}

/**
 * Set a JSON value with a TTL.
 */
export async function cacheSet(key: string, value: unknown, ttl: number) {
  try {
    await redis.set(key, value, { ex: ttl });
  } catch {
    // Silently skip caching if Redis is down
  }
}

/**
 * Invalidate (delete) a set of cache keys.
 * Call this after a mutation (new post, profile update, etc.)
 */
export async function cacheInvalidate(...keys: string[]) {
  if (keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch {
    // Non-critical
  }
}
