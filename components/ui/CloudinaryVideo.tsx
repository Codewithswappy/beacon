"use client";

/**
 * components/ui/CloudinaryVideo.tsx
 *
 * Video player with:
 *  1. Auto poster — video thumbnail extracted at 2s via Cloudinary (so_2)
 *  2. LQIP blur placeholder shown while the poster itself loads
 *  3. Lazy loading — video src only set when the element enters the viewport
 *  4. Controls and playback optimized for feed cards
 *
 * Usage:
 *   <CloudinaryVideo
 *     cloudName="my-cloud"
 *     publicId="beacon/posts/abc/1234"
 *     context="card"
 *     className="object-cover"
 *   />
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  videoUrl,
  videoThumbnailUrl,
  videoLqipUrl,
  type ImageContext,
} from "@/lib/cloudinary-urls";
import { DuoIcon } from "@/components/ui/DuoIcon";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  cloudName: string;
  publicId: string;
  /** Display context — determines poster image size. Default: "card" */
  context?: ImageContext;
  /**
   * Locks the intrinsic aspect ratio of the video container.
   * Prevents layout shift (CLS) while the poster loads.
   * @example "16/9" | "4/3" | "1/1"
   */
  aspectRatio?: string;
  className?: string;
  wrapperClassName?: string;
  /** Show native controls. Default: false (use custom play button). */
  controls?: boolean;
  /** Auto-play when visible. Default: false. */
  autoPlayInView?: boolean;
  /** Loop the video. Default: false. */
  loop?: boolean;
  duration?: number;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CloudinaryVideo({
  cloudName,
  publicId,
  context = "card",
  aspectRatio,
  className = "",
  wrapperClassName = "",
  controls = false,
  autoPlayInView = false,
  loop = false,
  duration,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [posterLoaded, setPosterLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | undefined>(undefined);

  const posterSrc = videoThumbnailUrl(cloudName, publicId, context);
  const lqipSrc = videoLqipUrl(cloudName, publicId);
  const src = videoUrl(cloudName, publicId);

  // ── Lazy-load video src via IntersectionObserver ──────────────────────────
  // The video src is only set once the card enters the viewport.
  // This prevents fetching video data for off-screen cards.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVideoSrc(src);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // start loading 200px before card enters view
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  // ── Auto-play in viewport ─────────────────────────────────────────────────
  useEffect(() => {
    if (!autoPlayInView || !videoSrc) return;

    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
          setIsPlaying(true);
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [autoPlayInView, videoSrc]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handlePosterLoad = useCallback(() => setPosterLoaded(true), []);
  const handleVideoEnd = useCallback(() => setIsPlaying(false), []);

  // ── Format duration label (e.g. 0:42) ─────────────────────────────────────
  const durationLabel = duration
    ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, "0")}`
    : null;

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden ${wrapperClassName}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* ── Layer 1: LQIP (always visible under poster) ───────────────────── */}
      <img
        src={lqipSrc}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: "blur(20px)", transform: "scale(1.05)" }}
      />

      {/* ── Layer 2: Poster image (video thumbnail at 2s) ─────────────────── */}
      <img
        src={posterSrc}
        alt=""
        aria-hidden
        onLoad={handlePosterLoad}
        className={[
          "absolute inset-0 h-full w-full object-cover",
          "transition-opacity duration-500",
          posterLoaded ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />

      {/* ── Layer 3: Actual video (lazy-loaded, sits above poster when playing) */}
      <video
        ref={videoRef}
        src={videoSrc}             // undefined until in-viewport
        poster={posterSrc}         // native poster fallback
        loop={loop}
        muted={autoPlayInView}     // autoplay requires muted in browsers
        playsInline
        controls={controls}
        onEnded={handleVideoEnd}
        className={[
          "absolute inset-0 h-full w-full object-cover",
          "transition-opacity duration-300",
          isPlaying ? "opacity-100" : "opacity-0",
          className,
        ].join(" ")}
      />

      {/* ── Custom play button (shown when not using native controls) ─────── */}
      {!controls && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause video" : "Play video"}
          className={[
            "absolute inset-0 flex items-center justify-center",
            "transition-opacity duration-200",
            isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100",
          ].join(" ")}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform duration-200 hover:scale-110">
            <DuoIcon
              name={isPlaying ? "pause" : "play"}
              size={24}
              className="text-white"
            />
          </div>
        </button>
      )}

      {/* ── Duration badge (bottom-right) ──────────────────────────────────── */}
      {durationLabel && !isPlaying && (
        <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white backdrop-blur-sm">
          {durationLabel}
        </span>
      )}

      {/* ── Video badge indicator (top-left) ──────────────────────────────── */}
      {!isPlaying && (
        <span className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Video
        </span>
      )}
    </div>
  );
}
