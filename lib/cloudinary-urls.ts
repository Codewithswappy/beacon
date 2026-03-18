/**
 * lib/cloudinary-urls.ts
 *
 * Single source of truth for all Cloudinary delivery URL generation.
 *
 * Core principle: Upload ONE asset. Generate all sizes dynamically via URL.
 * This avoids storing multiple copies — Cloudinary CDN caches each variant.
 *
 * All URLs include:
 *  - q_auto   → Cloudinary picks the best quality/filesize tradeoff
 *  - f_auto   → Serves WebP/AVIF to modern browsers, JPEG to older ones
 *  - c_limit  → Only downscale, never upscale
 *  - dpr_auto → Serves 2× on Retina / iPhone, 3× on high-DPI Android
 *              (skipped on LQIP — pointless for a 40px blur blob)
 */

const BASE = "https://res.cloudinary.com";

// ─── Context-specific image sizes ─────────────────────────────────────────────

/** Widths (px) for named display contexts used by imageUrl(). */
export const IMAGE_WIDTHS = {
  /** Feed card — also the cap for the srcSet ladder */
  card: 800,
  /** Small previews, avatars */
  thumbnail: 400,
  /** Full page / lightbox */
  full: 1600,
  /** LQIP blur placeholder — tiny on purpose */
  lqip: 40,
} as const;

// ─── Image URLs ───────────────────────────────────────────────────────────────

type ImageContext = keyof Omit<typeof IMAGE_WIDTHS, "lqip">;

export type { ImageContext };


/**
 * Build an optimised image delivery URL.
 *
 * Transformation chain (applied left-to-right by Cloudinary):
 *  - c_limit,w_{n}  → downscale to context width, never upscale
 *  - q_auto:good    → Visually lossless compression tailored for sharp UI screenshots
 *  - f_auto         → WebP/AVIF for modern browsers, JPEG for older ones
 *  - dpr_auto       → 2× on Retina/iPhone, 3× on high-DPI Android
 *  - fl_progressive → Progressive JPEG scan order for JPEG recipients
 *                     (no-op when f_auto serves WebP/AVIF — zero cost)
 *  - e_sharpen:50   → Light sharpening filter to preserve crisp edges in code/UI shots
 *  - fl_strip_profile → strips EXIF/GPS metadata before delivery
 *
 * Progressive loading behaviour:
 *  ① LQIP blur placeholder (40px, ~200 bytes) renders immediately.
 *  ② Progressive JPEG streams in low-res first, sharpens as bytes arrive.
 *  ③ Crossfade completes — full quality image visible.
 *  This three-step sequence makes infinite-scroll feeds feel instant.
 *
 * @example
 * imageUrl("my-cloud", "beacon/posts/abc/1234", "card")
 * // → …/image/upload/c_limit,w_800,q_auto:good,f_auto,dpr_auto,fl_progressive,e_sharpen:50,fl_strip_profile/beacon/…
 */
export function imageUrl(
  cloudName: string,
  publicId: string,
  context: ImageContext = "card"
): string {
  const w = IMAGE_WIDTHS[context];
  return imageUrlW(cloudName, publicId, w);
}

/**
 * Private helper — build a delivery URL for an exact pixel width.
 * Used by imageSrcSet() to generate the fine-grained width ladder.
 * All transformations from imageUrl() are applied identically.
 */
function imageUrlW(cloudName: string, publicId: string, w: number): string {
  return `${BASE}/${cloudName}/image/upload/c_limit,w_${w},q_auto:good,f_auto,dpr_auto,fl_progressive,e_sharpen:50,fl_strip_profile/${publicId}`;
}

/**
 * Build the Low-Quality Image Placeholder (LQIP) URL.
 *
 * This tiny (40px), heavily blurred image is inlined/loaded first,
 * shown as a placeholder while the real image loads.
 * Technique used by Stripe, Linear, Vercel.
 *
 *  - e_blur:1000 → strong blur effect
 *  - w_40        → tiny — loads in ~200 bytes
 *  - q_10        → lowest quality, minimal bytes
 */
export function lqipUrl(cloudName: string, publicId: string): string {
  return `${BASE}/${cloudName}/image/upload/e_blur:1000,w_${IMAGE_WIDTHS.lqip},q_10/${publicId}`;
}

// ─── Video URLs ───────────────────────────────────────────────────────────────

/**
 * Build an optimised video delivery URL.
 *
 *  - f_auto   → WebM for Chrome, MP4 for Safari (auto format negotiation)
 *  - vc_h264  → H.264 codec, widest device support
 *  - q_auto   → auto quality
 *  - c_limit  → cap at 1080p, never upscale
 *  - eo_60    → end offset at 60 s (truncates videos longer than 1 min)
 */
export function videoUrl(cloudName: string, publicId: string): string {
  return `${BASE}/${cloudName}/video/upload/f_auto,vc_h264,q_auto,c_limit,w_1920,h_1080,eo_60/${publicId}`;
}

/**
 * Build a video thumbnail URL (static JPEG from a frame in the video).
 *
 * Uses `so_2` — captures a frame at the 2-second mark.
 * The 2s offset avoids black frames (common at 0s) and gives a representative shot.
 * The image is delivered as a JPEG regardless of video format.
 *
 * @param context  Same sizing contexts as images ("card", "thumbnail", "full")
 *
 * @example
 * videoThumbnailUrl("my-cloud", "beacon/posts/abc/1234", "card")
 * // → https://res.cloudinary.com/my-cloud/video/upload/so_2,c_limit,w_800,q_auto,f_auto/beacon/posts/abc/1234.jpg
 */
export function videoThumbnailUrl(
  cloudName: string,
  publicId: string,
  context: ImageContext = "card"
): string {
  const w = IMAGE_WIDTHS[context];
  // dpr_auto: poster image also benefits from retina — it's a static JPEG
  return `${BASE}/${cloudName}/video/upload/so_2,c_limit,w_${w},q_auto,f_auto,dpr_auto/${publicId}.jpg`;
}

/**
 * Blurred LQIP from a video thumbnail — for video card placeholders.
 * No dpr_auto here: at 40px wide, serving a 2× version wastes bytes.
 */
export function videoLqipUrl(cloudName: string, publicId: string): string {
  return `${BASE}/${cloudName}/video/upload/so_2,e_blur:1000,w_${IMAGE_WIDTHS.lqip},q_10/${publicId}.jpg`;
}

// ─── srcSet helper ────────────────────────────────────────────────────────────

/**
 * Feed-optimised srcSet — fine-grained width ladder for infinite scroll.
 *
 * Steps: [320, 480, 640, 800, 960] px
 *
 * Why these widths?
 *  - 320 px → narrow mobile (375px viewport, 1 column)
 *  - 480 px → mid mobile / 2-column on small tablet
 *  - 640 px → landscape phone / 2-column on tablet
 *  - 800 px → standard feed card (was the only desktop size before)
 *  - 960 px → large tablet 1-column / desktop 2-column at high DPR
 *
 * The browser compares each width entry against the `sizes` hint to pick
 * the closest match. Fine steps mean it never over-downloads by more than
 * one increment (~160px), reducing bandwidth by ~30–40% in long feeds
 * compared to a coarse 3-step [400, 800, 1600] ladder.
 *
 * dpr_auto is handled by Cloudinary server-side, so a 1× browser gets
 * w_320 and a 2× Retina browser gets the equivalent of w_640 — both
 * optimally sized with no extra srcSet entries required.
 *
 * @example
 * imageSrcSet("my-cloud", "beacon/posts/abc/1234")
 * // → "...w_320... 320w, ...w_480... 480w, ...w_640... 640w, ...w_800... 800w, ...w_960... 960w"
 */
export function imageSrcSet(cloudName: string, publicId: string): string {
  const WIDTHS = [320, 480, 640, 800, 960] as const;
  return WIDTHS
    .map((w) => `${imageUrlW(cloudName, publicId, w)} ${w}w`)
    .join(", ");
}


// ─── Convenience wrappers (reads env var automatically) ───────────────────────
//
// These are the primary call-site API for UI components.
// They hide the cloudName argument by reading NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.
// Works in both client (browser) and server (Next.js) contexts.
//
// Why NEXT_PUBLIC_*?  Client components can't read non-public env vars.
// The cloud_name is not secret — it appears in every CDN URL anyway.
//
// Usage:
//   import { getProjectImage, getBlurPlaceholder } from "@/lib/cloudinary-urls";
//   <img src={getProjectImage(media.publicId)} />

function cn(): string {
  const name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!name) {
    // Fail visibly in dev, silently return empty in prod (no broken build).
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[cloudinary-urls] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set. " +
        "Add it to your .env.local file."
      );
    }
    return "";
  }
  return name;
}

/**
 * Responsive project/post card image URL.
 * Delivers at w_800 — ideal for 3-column grids.
 *
 * @example
 * getProjectImage(media.publicId)
 * // → https://res.cloudinary.com/{cloud}/image/upload/c_limit,w_800,q_auto,f_auto,fl_strip_profile/{publicId}
 */
export function getProjectImage(publicId: string, context: ImageContext = "card"): string {
  return imageUrl(cn(), publicId, context);
}

/**
 * Low-quality blurred placeholder for images.
 * ~200 bytes — load this first, then swap in the full image.
 *
 * @example
 * getBlurPlaceholder(media.publicId)
 * // → https://res.cloudinary.com/{cloud}/image/upload/e_blur:1000,w_40,q_10/{publicId}
 */
export function getBlurPlaceholder(publicId: string): string {
  return lqipUrl(cn(), publicId);
}

/**
 * Static JPEG thumbnail from a video — frame captured at 2 seconds.
 * Use as `<img>` or `<video poster>` on video cards.
 *
 * @example
 * getVideoThumbnail(media.publicId)
 * // → https://res.cloudinary.com/{cloud}/video/upload/so_2,c_limit,w_800,q_auto,f_auto/{publicId}.jpg
 */
export function getVideoThumbnail(publicId: string, context: ImageContext = "card"): string {
  return videoThumbnailUrl(cn(), publicId, context);
}

/**
 * Blurred LQIP sourced from video frame — for video card placeholders.
 *
 * @example
 * getVideoBlurPlaceholder(media.publicId)
 */
export function getVideoBlurPlaceholder(publicId: string): string {
  return videoLqipUrl(cn(), publicId);
}

/**
 * Optimised video delivery URL.
 *
 * @example
 * getVideoUrl(media.publicId)
 */
export function getVideoUrl(publicId: string): string {
  return videoUrl(cn(), publicId);
}

/**
 * Responsive srcSet string — use with img srcSet or Next.js Image loader.
 * Generates 400w, 800w, 1600w variants from the same publicId.
 *
 * @example
 * <img
 *   src={getProjectImage(publicId)}
 *   srcSet={getResponsiveSrcSet(publicId)}
 *   sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
 * />
 */
export function getResponsiveSrcSet(publicId: string): string {
  return imageSrcSet(cn(), publicId);
}
