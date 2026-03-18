import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

/**
 * All rate limiters in one place.
 * Adjust windows/requests as the platform grows.
 *
 * Algorithm: sliding window — fairer than fixed window, cheaper than token bucket.
 */

// ── Post creation: max 5 posts per 10 minutes per user ──────────────────────
export const postLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  prefix: "rl:post",
  analytics: true,
});

// ── Media upload: max 10 files per 5 minutes per user ───────────────────────
export const uploadLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "5 m"),
  prefix: "rl:upload",
  analytics: true,
});

// ── Like / bookmark actions: max 60 per minute per user ─────────────────────
export const actionLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "rl:action",
  analytics: true,
});

// ── Auth endpoints (login, signup): max 10 per 15 minutes per IP ─────────────
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "15 m"),
  prefix: "rl:auth",
  analytics: true,
});

// ── General API: max 120 requests per minute per user/IP ─────────────────────
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(120, "1 m"),
  prefix: "rl:api",
  analytics: true,
});

// ─── Shared helper ────────────────────────────────────────────────────────────
import { NextResponse } from "next/server";

/**
 * Check a rate limiter. Returns a 429 Response if limit exceeded, null otherwise.
 * Usage: `const limited = await checkLimit(postLimiter, userId); if (limited) return limited;`
 */
export async function checkLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<NextResponse | null> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    return NextResponse.json(
      {
        error: "Too many requests. Please slow down.",
        limit,
        remaining: 0,
        resetAt: new Date(reset).toISOString(),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(reset),
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }

  return null;
}
