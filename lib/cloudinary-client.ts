/**
 * lib/cloudinary-client.ts
 *
 * Client-side upload helper for direct signed uploads.
 *
 * Upload flow:
 *  1. validateFile()  — reject bad types/sizes before spending any network budget
 *  2. fetchSignature()— POST /api/cloudinary/sign-upload → short-lived signed token
 *  3. uploadFile()    — POST directly to Cloudinary (file never touches our server)
 *  4. return          — { url, publicId, type, width, height, duration }
 *
 * This module has NO server imports. It runs only in the browser.
 */

import type {
  UploadedMedia,
  UploadFileOptions,
  CloudinaryRawResponse,
  SignaturePayload,
} from "@/lib/types/media";
import { MEDIA_LIMITS } from "@/lib/types/media";

/**
 * UploadedMedia extended with the postId from the upload signature.
 * Pass postId back to POST /api/posts so the DB record matches the Cloudinary folder.
 */
export type UploadedMediaWithPostId = UploadedMedia & { postId: string };

// ─── Local validation ─────────────────────────────────────────────────────────

/**
 * Validates a file against MIME type and size limits.
 * Runs entirely in the browser — no network call.
 *
 * @returns "image" | "video" — the detected media type.
 * @throws Error with a human-readable message if validation fails.
 */
export function validateFile(file: File): "image" | "video" {
  const allowedImages = MEDIA_LIMITS.ALLOWED_IMAGE_TYPES as readonly string[];
  const allowedVideos = MEDIA_LIMITS.ALLOWED_VIDEO_TYPES as readonly string[];

  const isImage = allowedImages.includes(file.type);
  const isVideo = allowedVideos.includes(file.type);

  if (!isImage && !isVideo) {
    throw new Error(
      `Unsupported file type "${file.type}". ` +
      `Allowed: JPEG, PNG, WebP, GIF (images) · MP4, MOV, WebM (videos).`
    );
  }

  if (isImage && file.size > MEDIA_LIMITS.MAX_IMAGE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(`Image is too large (${mb} MB). Maximum is 5 MB.`);
  }

  if (isVideo && file.size > MEDIA_LIMITS.MAX_VIDEO_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(`Video is too large (${mb} MB). Maximum is 50 MB.`);
  }

  return isImage ? "image" : "video";
}

// ─── Signature request ────────────────────────────────────────────────────────

/**
 * Fetch a signed upload token from our server.
 * Returns signature + the server-generated postId.
 */
async function fetchSignature(): Promise<SignaturePayload> {
  const res = await fetch("/api/cloudinary/sign-upload", {
    method: "POST",
    // Prevent the browser from sending a stale signature from HTTP cache
    cache: "no-store",
  });

  if (!res.ok) {
    const body: { error?: string } = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Could not get upload signature (HTTP ${res.status}).`);
  }

  return res.json() as Promise<SignaturePayload>;
}

// ─── Core upload function ─────────────────────────────────────────────────────

/**
 * Upload a single file directly to Cloudinary.
 *
 * @param file     The File object from an <input type="file"> or drag-drop.
 * @param options  Optional progress callback and AbortSignal.
 * @returns        Parsed UploadedMedia ready to store in the DB.
 * @throws         Human-readable Error on any failure.
 *
 * @example
 * const media = await uploadFile(file, {
 *   onProgress: (pct) => setProgress(pct),
 *   signal: abortController.signal,
 * });
 * // → { url, publicId, type, width, height, duration }
 */
export async function uploadFile(
  file: File,
  options: UploadFileOptions = {},
  /** Pre-fetched signature. Pass when uploading multiple files in the same post. */
  existingSignature?: SignaturePayload
): Promise<UploadedMediaWithPostId> {
  const { onProgress, signal } = options;

  // ── Step 1: Validate locally before spending any network budget ────────────
  const mediaType = validateFile(file);

  // ── Step 2: Get a short-lived signed token from our server ────────────────
  // Reuse an existing signature when uploading multiple files for the same post.
  // This saves N-1 round-trips to the server and keeps all files in the same folder.
  const { signature, timestamp, apiKey, cloudName, folder, postId } =
    existingSignature ?? (await fetchSignature());

  // ── Step 3: Build the multipart body ──────────────────────────────────────
  //
  // IMPORTANT: The values appended here must exactly match the params that
  // were signed on the server. Cloudinary verifies the signature by re-computing
  // it from the received params. Any mismatch → 401 from Cloudinary.
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);
  body.append("folder", folder);
  body.append("allowed_formats", "jpg,jpeg,png,webp,gif,mp4,webm,mov");
  body.append("moderation", "webpurify");

  // ── Step 4: Upload directly to Cloudinary ─────────────────────────────────
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  const raw: CloudinaryRawResponse = onProgress
    ? await uploadWithXHR(uploadUrl, body, onProgress, signal)
    : await uploadWithFetch(uploadUrl, body, signal);

  // ── Step 5: Normalise and return ──────────────────────────────────────────
  return {
    url: raw.secure_url,
    publicId: raw.public_id,
    type: raw.resource_type === "video" ? "video" : "image",
    width: raw.width,
    height: raw.height,
    duration: raw.duration,
    // postId ties the Cloudinary folder to the Supabase post record
    postId,
  };
}

// ─── Batch upload helper ──────────────────────────────────────────────────────

/**
 * Upload multiple files, respecting per-post limits.
 * Files are uploaded in parallel for speed.
 *
 * @throws if the file list violates per-post limits (4 images, 1 video).
 */
export async function uploadFiles(
  files: File[],
  options: UploadFileOptions = {}
): Promise<UploadedMediaWithPostId[]> {
  // Count types before spending network budget
  const images = files.filter((f) =>
    (MEDIA_LIMITS.ALLOWED_IMAGE_TYPES as readonly string[]).includes(f.type)
  );
  const videos = files.filter((f) =>
    (MEDIA_LIMITS.ALLOWED_VIDEO_TYPES as readonly string[]).includes(f.type)
  );

  if (images.length > MEDIA_LIMITS.MAX_IMAGES_PER_POST) {
    throw new Error(`A post can have at most ${MEDIA_LIMITS.MAX_IMAGES_PER_POST} images.`);
  }
  if (videos.length > MEDIA_LIMITS.MAX_VIDEOS_PER_POST) {
    throw new Error(`A post can have at most ${MEDIA_LIMITS.MAX_VIDEOS_PER_POST} video.`);
  }
  if (images.length > 0 && videos.length > 0) {
    throw new Error("A post cannot mix images and a video.");
  }

  // Fetch ONE signature for all files in this batch.
  // All files go into the same beacon/posts/{userId}/{postId}/ folder.
  // This saves N-1 round-trips and keeps the entire post's media co-located.
  const sharedSignature = await fetchSignature();

  return Promise.all(
    files.map((file) => uploadFile(file, options, sharedSignature))
  );
}

// ─── Transport implementations ────────────────────────────────────────────────

/** fetch()-based upload. Simple, no progress. */
async function uploadWithFetch(
  url: string,
  body: FormData,
  signal?: AbortSignal
): Promise<CloudinaryRawResponse> {
  const res = await fetch(url, { method: "POST", body, signal });
  const data = (await res.json()) as CloudinaryRawResponse;

  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? `Cloudinary upload failed (HTTP ${res.status}).`);
  }

  return data;
}

/**
 * XHR-based upload — provides real upload progress via onProgress(0–100).
 * Automatically used when the caller passes `onProgress`.
 */
function uploadWithXHR(
  url: string,
  body: FormData,
  onProgress: (percent: number) => void,
  signal?: AbortSignal
): Promise<CloudinaryRawResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Progress events fire as bytes are sent to Cloudinary's servers
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      let data: CloudinaryRawResponse;
      try {
        data = JSON.parse(xhr.responseText) as CloudinaryRawResponse;
      } catch {
        reject(new Error("Received an invalid response from Cloudinary."));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300 && !data.error) {
        resolve(data);
      } else {
        reject(new Error(data.error?.message ?? `Upload failed (HTTP ${xhr.status}).`));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Network error — check your connection and try again."))
    );
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled.")));

    // Wire up AbortSignal → XHR abort
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });

    xhr.open("POST", url);
    xhr.send(body);
  });
}
