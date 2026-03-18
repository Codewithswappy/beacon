import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkLimit, postLimiter } from "@/lib/rate-limit";
import { cacheInvalidate, CacheKeys, redis } from "@/lib/redis";
import { CreatePostSchema } from "@/lib/validations/post";
import { deletePostMedia } from "@/lib/cloudinary";
import type { UploadedMedia } from "@/lib/types/media";

export const runtime = "nodejs";

/**
 * POST /api/posts
 * Create a new post.
 *
 * Security layers:
 *  1. Auth check
 *  2. Rate limit — 5 posts / 10 min
 *  3. Zod validation — text length, media count, type mixing
 *  4. Ownership check — user can only post as themselves
 *  5. Cache invalidation — busts user feed after posting
 *
 * Body (JSON):
 * {
 *   caption?: string,        (max 500 chars)
 *   media?: UploadedMedia[]  (max 4 items, already uploaded to Cloudinary)
 * }
 */
export async function POST(request: NextRequest) {
  // ── 1. Auth ───────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── 2. Rate limit ─────────────────────────────────────────────────────────────
  const limited = await checkLimit(postLimiter, user.id);
  if (limited) return limited;

  // ── 3. Parse & validate body ──────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = CreatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 422 }
    );
  }

  const { caption, media } = parsed.data;

  // ── 4. Determine post type ────────────────────────────────────────────────────
  const postType =
    media && media.length > 0
      ? media[0].type === "video"
        ? "video"
        : "image"
      : "text";

  // ── 5. Insert into Supabase ───────────────────────────────────────────────────
  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      caption: caption ?? null,
      media: media ?? [],
      post_type: postType,
    })
    .select("id, created_at")
    .single();

  if (error) {
    console.error("[posts] insert error:", error.message);
    return NextResponse.json(
      { error: "Failed to create post. Please try again." },
      { status: 500 }
    );
  }

  // ── 6. Fan-Out-on-Write to Followers' Timelines ─────────────────────────────
  
  // Get all followers
  const { data: followers } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", user.id);

  // The author also needs their own post in their timeline
  const timelineTargets = [user.id, ...(followers?.map((f) => f.follower_id) || [])];

  const pipeline = redis.pipeline();
  for (const targetId of timelineTargets) {
    // Push the newest post ID to the top of the follower's timeline list
    pipeline.lpush(CacheKeys.timeline(targetId), post.id);
    // Cap timeline at 500 items max to prevent unbounded memory growth
    pipeline.ltrim(CacheKeys.timeline(targetId), 0, 500);
    // Bust the JSON cached rendered feed so the next request rebuilds it
    pipeline.del(CacheKeys.userFeed(targetId));
  }
  
  await pipeline.exec().catch((err) => console.error("Redis fanout failed:", err));
  
  await cacheInvalidate(CacheKeys.userPosts(user.id, 1));

  return NextResponse.json({ post }, { status: 201 });
}

/**
 * DELETE /api/posts?postId=<uuid>
 * Delete a post + its Cloudinary media.
 *
 * Security: verifies ownership in the DB before deleting.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const postId = request.nextUrl.searchParams.get("postId");
  if (!postId || !/^[0-9a-f-]{36}$/.test(postId)) {
    return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });
  }

  // Fetch post — ownership check is baked in with the user_id filter
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("id, user_id, media")
    .eq("id", postId)
    .eq("user_id", user.id)   // ← ownership enforced at DB level
    .single();

  if (fetchError || !post) {
    return NextResponse.json(
      { error: "Post not found or you do not own it." },
      { status: 404 }
    );
  }

  // Delete Cloudinary assets first
  const mediaItems = (post.media ?? []) as Pick<UploadedMedia, "publicId" | "type">[];
  await Promise.allSettled(
    mediaItems.map((m) => deletePostMedia(m.publicId, m.type))
  );

  // Delete from DB
  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete post." }, { status: 500 });
  }

  // Bust caches
  await cacheInvalidate(
    CacheKeys.post(postId),
    CacheKeys.userPosts(user.id, 1),
    CacheKeys.feed(user.id, 1)
  );

  return NextResponse.json({ success: true }, { status: 200 });
}
