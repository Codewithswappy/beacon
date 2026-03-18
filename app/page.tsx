import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VirtualFeed } from "@/components/posts/VirtualFeed";
import { redis, CacheKeys } from "@/lib/redis";

export default async function FeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Check if onboarding is completed
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  // 2. Fetch the Feed (Self-Healing Cache + Timeline Resolution)
  const cacheKey = CacheKeys.userFeed(user.id);
  
  // A. Level 1: Fully serialized HTML/JSON response layer
  const cached = await redis.get<string>(cacheKey);

  let initialPosts: any[] = [];
  
  if (cached) {
    initialPosts = typeof cached === "string" ? JSON.parse(cached) : cached;
  } else {
    // B. Level 2: Fetch the Fan-out strictly-ID Timeline array
    const timelineIds = await redis.lrange(CacheKeys.timeline(user.id), 0, 50);

    if (timelineIds.length > 0) {
      // Rehydrate the actual Post row data from Supabase
      const { data: postsData } = await supabase
        .from("posts")
        .select(`
          id,
          caption,
          media,
          post_type,
          likes_count,
          created_at,
          user:profiles!inner(name, username, avatar_url)
        `)
        .in("id", timelineIds);

      if (postsData && postsData.length > 0) {
        // Enforce the chronological ordering returned by the timeline list
        // since `in` statements don't inherently preserve order.
        const postsMap = new Map(postsData.map(p => [p.id, p]));
        const sortedPosts = timelineIds.map(id => postsMap.get(id)).filter(Boolean);

        initialPosts = sortedPosts.map((post: any) => ({
          ...post,
          user: {
            ...post.user,
            avatarUrl: post.user.avatar_url,
          },
        }));
      }
    } 

    if (initialPosts.length === 0) {
      // C. Fallback Level: Global / recent queries for fresh users with no feeds
      const { data: recentPosts } = await supabase
        .from("posts")
        .select(`
          id,
          caption,
          media,
          post_type,
          likes_count,
          created_at,
          user:profiles!inner(name, username, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (recentPosts) {
         initialPosts = recentPosts.map((post: any) => ({
          ...post,
          user: {
            ...post.user,
            avatarUrl: post.user.avatar_url,
          },
        }));
      }
    }

    // Safely write Level 1 cache. Set to rigidly expire in 60s
    // to naturally self-heal and stay completely up to date.
    if (initialPosts.length > 0) {
      await redis.set(cacheKey, JSON.stringify(initialPosts), { ex: 60 });
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-8">
      <div className="mx-auto max-w-2xl px-4 md:px-0">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">For You</h1>
          <p className="mt-1 text-muted">The best creative work tailored to you.</p>
        </header>

        {/* ── Feed Container (Virtualised) ── */}
        <div className="w-full">
          <VirtualFeed initialPosts={initialPosts} />
        </div>
      </div>
    </div>
  );
}
