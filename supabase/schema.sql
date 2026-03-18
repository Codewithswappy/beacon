-- ============================================================
-- Beacon — Posts Table
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (already on by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── posts ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caption     TEXT         CHECK (char_length(caption) <= 500),
  -- Array of Cloudinary media objects: {url, publicId, type, width, height, duration}
  media       JSONB        NOT NULL DEFAULT '[]'::jsonb,
  post_type   TEXT         NOT NULL CHECK (post_type IN ('text', 'image', 'video')),
  likes_count INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─── likes ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.likes (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id    UUID         NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)  -- prevents double-liking
);

-- ─── bookmarks ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id    UUID         NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);

-- ─── follows ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id   UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id  UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)  -- can't follow yourself
);

-- ─── comments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID         NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body       TEXT         NOT NULL CHECK (char_length(body) BETWEEN 1 AND 300),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes for performance
-- ============================================================

-- Feed query: posts by followed users, ordered by time
CREATE INDEX IF NOT EXISTS posts_user_id_created_idx ON public.posts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_created_idx         ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS likes_post_id_idx         ON public.likes (post_id);
CREATE INDEX IF NOT EXISTS likes_user_id_idx         ON public.likes (user_id);
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx     ON public.bookmarks (user_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx  ON public.follows (following_id);
CREATE INDEX IF NOT EXISTS comments_post_id_idx      ON public.comments (post_id, created_at DESC);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security (RLS)  ← THIS IS THE KEY SECURITY LAYER
-- ============================================================

ALTER TABLE public.posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments  ENABLE ROW LEVEL SECURITY;

-- ── posts policies ────────────────────────────────────────────────────────────
-- Anyone can read posts (public feed)
CREATE POLICY "posts_select_public"  ON public.posts FOR SELECT USING (true);
-- Only owner can insert their own posts
CREATE POLICY "posts_insert_own"     ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- Only owner can delete their own posts
CREATE POLICY "posts_delete_own"     ON public.posts FOR DELETE
  USING (auth.uid() = user_id);
-- Only owner can update their own posts
CREATE POLICY "posts_update_own"     ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

-- ── likes policies ────────────────────────────────────────────────────────────
CREATE POLICY "likes_select_public"  ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_own"     ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own"     ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- ── bookmarks policies ────────────────────────────────────────────────────────
-- Bookmarks are PRIVATE — only the owner can see/manage theirs
CREATE POLICY "bookmarks_select_own" ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert_own" ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_delete_own" ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ── follows policies ──────────────────────────────────────────────────────────
CREATE POLICY "follows_select_public" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own"    ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own"    ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ── comments policies ─────────────────────────────────────────────────────────
CREATE POLICY "comments_select_public" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own"    ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own"    ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Auto-increment likes_count via DB trigger (atomic, no race)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_like_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION handle_like_change();
