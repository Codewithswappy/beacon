// ─── Primitive types ──────────────────────────────────────────────────────────

export type MediaType = "image" | "video";

/**
 * Normalised media object stored in the `posts.media` JSONB column
 * and returned by the client upload helper.
 */
export type UploadedMedia = {
  url: string;         // Cloudinary secure_url
  publicId: string;    // Used to generate delivery URLs and delete the asset
  type: MediaType;
  width?: number;
  height?: number;
  duration?: number;   // Seconds — video only
};

// ─── Signature endpoint types ─────────────────────────────────────────────────

/**
 * Response from POST /api/cloudinary/sign-upload.
 * Contains everything the client needs to POST directly to Cloudinary.
 */
export type SignaturePayload = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  /** Locked folder path: beacon/posts/{userId}/{postId} */
  folder: string;
  /**
   * The post ID embedded in the folder path.
   * Pass this back in POST /api/posts so the server knows which folder holds
   * the uploaded media — enables easy cleanup if the post is deleted.
   */
  postId: string;
};

// ─── Raw Cloudinary API response ──────────────────────────────────────────────

/**
 * Minimal shape of Cloudinary's upload response.
 * Full spec: https://cloudinary.com/documentation/image_upload_api_reference#upload_response
 */
export type CloudinaryRawResponse = {
  secure_url: string;
  public_id: string;
  resource_type: "image" | "video" | "raw";
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  error?: { message: string };
};

// ─── Client upload options ────────────────────────────────────────────────────

export type UploadFileOptions = {
  /** Receives 0–100 during the upload. Requires XHR (auto-used when provided). */
  onProgress?: (percent: number) => void;
  /** Pass an AbortController signal to cancel the upload mid-flight. */
  signal?: AbortSignal;
};

// ─── Limits (single source of truth for both server and client) ───────────────

export const MEDIA_LIMITS = {
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ] as const,
  ALLOWED_VIDEO_TYPES: [
    "video/mp4",
    "video/quicktime",
    "video/webm",
  ] as const,

  MAX_IMAGE_BYTES: 5 * 1024 * 1024,    // 5 MB
  MAX_VIDEO_BYTES: 50 * 1024 * 1024,   // 50 MB

  MAX_IMAGES_PER_POST: 4,
  MAX_VIDEOS_PER_POST: 1,

  // Enforced at Cloudinary delivery time via URL transforms
  IMAGE_MAX_DIMENSION: 4096,
  VIDEO_MAX_DURATION_SECONDS: 60,
  VIDEO_MAX_WIDTH: 1920,
  VIDEO_MAX_HEIGHT: 1080,
} as const;

// ─── Cloudinary delivery URL helpers ─────────────────────────────────────────
// Moved to lib/cloudinary-urls.ts — import from there.
// Re-exported here for backwards compatibility during migration.
export {
  imageUrl,
  videoUrl,
  lqipUrl,
  videoThumbnailUrl,
  videoLqipUrl,
  imageSrcSet,
} from "@/lib/cloudinary-urls";
