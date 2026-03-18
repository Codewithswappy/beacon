"use client";

import { useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { FeedCard, FeedCardSkeleton } from "@/components/posts/FeedCard";
import { feedStore } from "@/lib/stores/feedStore";

type VirtualFeedProps = {
  initialPosts: Array<any>;
};

export function VirtualFeed({ initialPosts }: VirtualFeedProps) {
  // ── 1. External Store Subscription ─────────────────────────────────────────
  // useSyncExternalStore completely eliminates local useState for the massive
  // posts array. This means global feed fetches don't trigger cascading renders
  // across every existing un-memoized component in the React tree.
  const posts = useSyncExternalStore(feedStore.subscribe, feedStore.getSnapshot);
  const hasNextPage = useSyncExternalStore(feedStore.subscribe, feedStore.getHasNextPage);
  const isFetchingNextPage = useSyncExternalStore(feedStore.subscribe, feedStore.getIsFetchingNextPage);

  // Initialize the singleton store on mount with Server initial slice
  useEffect(() => {
    feedStore.initialize(initialPosts);
  }, [initialPosts]);

  // Parent container for virtualization
  const parentRef = useRef<HTMLDivElement>(null);

  // ── 2. Initialize TanStack Virtualizer ──────────────────────────────────────
  const virtualizer = useWindowVirtualizer({
    // Add 3 to the count when fetching next page to render Skeleton placeholders
    count: hasNextPage ? posts.length + 3 : posts.length,
    estimateSize: () => 450,
    overscan: 5, // ~20 items total in DOM
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

  const items = virtualizer.getVirtualItems();

  // ── 3. Simulate Infinite Scroll Fetch (With Scroll-Jump Prevention) ──────────
  const fetchNextPosts = useCallback(async () => {
    if (feedStore.getIsFetchingNextPage() || !feedStore.getHasNextPage()) return;
    feedStore.setIsFetchingNextPage(true);

    // Simulate network delay for fetching next paginated chunk
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Fallback: If store isn't populated, use the initial prop logic
    const basePosts = feedStore.getSnapshot().length ? feedStore.getSnapshot() : initialPosts;

    const newPostsChunk = basePosts.slice(0, 4).map((p) => ({
      ...p,
      id: `${p.id}-${Date.now()}-${Math.random()}`, 
    }));

    // Twitter / Pinterest scroll restoration trick
    const scrollContainer = document.documentElement;
    const previousHeight = scrollContainer.scrollHeight;

    // Append new chunk exclusively leveraging the store
    feedStore.appendPosts(newPostsChunk);
    
    // Stop mock infinite scrolling after fetching ~50 arbitrarily to cap memory
    if (feedStore.getSnapshot().length > 50) {
      feedStore.setHasNextPage(false);
    }

    // Scroll correction to obliterate jump artifacts
    requestAnimationFrame(() => {
      const newHeight = scrollContainer.scrollHeight;
      const jumpDelta = newHeight - previousHeight;
      if (jumpDelta < 0) {
         window.scrollBy({ top: jumpDelta, behavior: "instant" as any });
      }
    });

    feedStore.setIsFetchingNextPage(false);
  }, [initialPosts]);

  // Infinite Scroll Trigger
  useEffect(() => {
    const [lastItem] = [...items].reverse();
    if (!lastItem) return;

    if (
      lastItem.index >= posts.length - 2 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPosts();
    }
  }, [hasNextPage, fetchNextPosts, items, isFetchingNextPage, posts.length]);

  return (
    <div ref={parentRef}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {items.map((virtualRow) => {
          const isLoaderRow = virtualRow.index > posts.length - 1;
          const post = posts[virtualRow.index];

          return (
            <div
              key={isLoaderRow ? `skeleton-${virtualRow.index}` : post.id}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: "3rem",
              }}
            >
              {isLoaderRow ? (
                <FeedCardSkeleton />
              ) : (
                <FeedCard
                  post={post}
                  priority={virtualRow.index === 0} 
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
