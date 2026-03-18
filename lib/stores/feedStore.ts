/**
 * lib/stores/feedStore.ts
 * 
 * External store for feed state to prevent global React tree re-renders
 * during infinite scrolling.
 * 
 * Note: In a strict SSR environment, we provide an initialHydration state 
 * or use `getServerSnapshot` to prevent hydration mismatches.
 */

type Listener = () => void;

let listeners = new Set<Listener>();
let posts: any[] = [];
let hasNextPage = true;
let isFetchingNextPage = false;
let isInitialized = false;

export const feedStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot() {
    return posts;
  },

  // Hydrate the store safely once per client session
  initialize(initialPosts: any[]) {
    if (!isInitialized) {
      posts = initialPosts;
      isInitialized = true;
    }
  },

  appendPosts(newPosts: any[]) {
    posts = [...posts, ...newPosts];
    listeners.forEach((l) => l());
  },

  getHasNextPage() {
    return hasNextPage;
  },

  setHasNextPage(val: boolean) {
    if (hasNextPage !== val) {
      hasNextPage = val;
      listeners.forEach((l) => l());
    }
  },

  getIsFetchingNextPage() {
    return isFetchingNextPage;
  },

  setIsFetchingNextPage(val: boolean) {
    if (isFetchingNextPage !== val) {
      isFetchingNextPage = val;
      listeners.forEach((l) => l());
    }
  },
};
