"use client";

/**
 * components/ui/CloudinaryImage.tsx
 *
 * Drop-in replacement for Next.js <Image> that adds:
 *  1. LQIP blur placeholder — tiny blurred version shown instantly (~200 bytes)
 *  2. Smooth crossfade when the full image loads (prevents jarring pop-in)
 *  3. Cloudinary responsive srcSet with dpr_auto — correct size per viewport + pixel density
 *  4. Aspect ratio lock — prevents Cumulative Layout Shift (CLS)
 *  5. Priority preload — <link rel="preload"> for above-the-fold first image
 *
 * Performance characteristics (Stripe/Linear-style loading):
 *  ① 200B blur placeholder renders immediately
 *  ② Browser fetches correct srcSet variant based on viewport + device DPR
 *  ③ Image crossfades in over 500ms
 *
 * Usage:
 *   // Feed card (3-column grid)
 *   <CloudinaryImage
 *     cloudName="my-cloud"
 *     publicId="beacon/posts/abc/1234"
 *     context="card"
 *     aspectRatio="4/3"
 *     alt="My post"
 *   />
 *
 *   // First item in feed — preload it
 *   <CloudinaryImage ... priority />
 *
 *   // Fill a positioned parent (cover image)
 *   <CloudinaryImage ... fill className="object-cover" />
 */

import { useState, useCallback } from "react";
import Head from "next/head";
import {
  imageUrl,
  lqipUrl,
  imageSrcSet,
  type ImageContext,
} from "@/lib/cloudinary-urls";

// ─── Types ────────────────────────────────────────────────────────────────────

export type { ImageContext };

type Props = {
  cloudName: string;
  publicId: string;
  alt: string;
  /** Display context — determines delivered width. Default: "card" */
  context?: ImageContext;
  /**
   * Locks the intrinsic aspect ratio of the image container.
   * Prevents layout shift (CLS) before the image loads.
   *
   * @example "16/9" | "4/3" | "1/1" | "3/2"
   *
   * Not needed in `fill` mode (parent controls dimensions).
   */
  aspectRatio?: string;
  /** Pass `fill` to make the image fill its positioned parent (like Next/Image) */
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  /** Applied only to the wrapper div */
  wrapperClassName?: string;
  /**
   * Mark the first visible image as high priority.
   *  - Sets loading="eager"
   *  - Injects <link rel="preload"> for the fastest possible LCP
   *  - Use on the first feed card only
   */
  priority?: boolean;
};

// ─── Sizes hint per context ───────────────────────────────────────────────────

function sizesForContext(context: ImageContext): string {
  switch (context) {
    case "thumbnail":
      return "128px";
    case "full":
      return "100vw";
    default: // card
      return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CloudinaryImage({
  cloudName,
  publicId,
  alt,
  context = "card",
  aspectRatio,
  fill = false,
  width,
  height,
  className = "",
  wrapperClassName = "",
  priority = false,
}: Props) {
  const [isLoaded, setIsLoaded] = useState(false);

  const src = imageUrl(cloudName, publicId, context);
  const placeholder = lqipUrl(cloudName, publicId);
  const srcSet = imageSrcSet(cloudName, publicId);
  const sizes = sizesForContext(context);

  const handleLoad = useCallback(() => setIsLoaded(true), []);

  // Shared styles for the full image fade-in
  const fullImgClass = [
    "h-full w-full object-cover",
    "transition-opacity duration-500 ease-in-out",
    isLoaded ? "opacity-100" : "opacity-0",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Wrapper style — aspect ratio lock prevents CLS
  const wrapperStyle: React.CSSProperties = {
    ...(aspectRatio && !fill ? { aspectRatio } : {}),
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return (
    <>
      {/*
       * Priority preload hint — only injected for above-the-fold images.
       * Tells the browser to fetch this image immediately, during HTML parsing,
       * before the render-blocking CSS/JS has finished.
       * This is the primary driver of a fast LCP score.
       *
       * We preload the card-width variant (w_800) with dpr_auto baked in.
       * Browsers that support imagesrcset will pick the correct DPR variant.
       */}
      {priority && (
        <Head>
          <link
            rel="preload"
            as="image"
            href={src}
            // @ts-expect-error — imagesrcset/imagesizes are valid but not in all TS DOM types
            imagesrcset={srcSet}
            imagesizes={sizes}
          />
        </Head>
      )}

      <div
        className={`relative overflow-hidden ${wrapperClassName}`}
        style={wrapperStyle}
      >
        {/* ── Layer 1: LQIP (renders instantly, no network wait) ─────────────
         * Scale 1.05 hides the hard edge caused by blur bleeding at borders.
         * aria-hidden: purely decorative, screen readers skip it.
         */}
        <img
          src={placeholder}
          alt=""
          aria-hidden
          className={`${fill ? "absolute inset-0 " : ""}h-full w-full object-cover`}
          style={{ filter: "blur(20px)", transform: "scale(1.05)" }}
        />

        {/* ── Layer 2: Full image (fades in over the LQIP) ──────────────────
         * loading="eager" + priority flag: browser fetches immediately.
         * loading="lazy": browser skips until 200px from viewport edge.
         * decoding="async": decode off the main thread, no jank.
         */}
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={handleLoad}
          className={`${fill ? "absolute inset-0 " : ""}${fullImgClass}`}
        />
      </div>
    </>
  );
}
