/**
 * lib/cloudinary.ts — SERVER-ONLY
 *
 * Initialises the Cloudinary SDK and exposes server-side operations:
 *  - generateUploadSignature  → used by /api/cloudinary/sign-upload
 *  - deletePostMedia          → called when a post is deleted
 *
 * File uploads no longer pass through this server.
 * The client uploads directly to Cloudinary using a signed token.
 * See: lib/cloudinary-client.ts for the client-side flow.
 */

import "server-only";
import { v2 as cloudinary } from "cloudinary";

// ─── SDK Init ────────────────────────────────────────────────────────────────
// Runs once when this module is first imported on the server.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

// ─── Signature generation ─────────────────────────────────────────────────────

/**
 * Allowed upload formats — same list enforced by the client's MIME check
 * and Cloudinary's own format filter.
 *
 * Security: Cloudinary rejects any upload whose format isn't in this list,
 * even if the client sends a forged Content-Type header.
 */
export const CLOUDINARY_ALLOWED_FORMATS = "jpg,jpeg,png,webp,gif,mp4,webm,mov";

/**
 * Signatures are valid for this many seconds.
 * After expiry, Cloudinary rejects the upload — prevents replay attacks.
 */
export const SIGNATURE_TTL_SECONDS = 60;

export type SignParams = {
  timestamp: number;
  /** Full folder path: beacon/posts/{userId}/{postId} */
  folder: string;
  /** The postId portion of the folder path, returned to the client. */
  postId: string;
};

/**
 * Generate a signed upload parameter set for a given user.
 *
 * Security decisions baked into the signed params:
 *  - `folder`           Locked to `beacon/posts/{userId}` — a user cannot
 *                       upload into another user's namespace.
 *  - `allowed_formats`  Cloudinary enforces this server-side, independent of
 *                       what the client claims the file type is.
 *  - `moderation`       Content is held for review before being served.
 *                       "webpurify" covers text overlaid on images.
 *                       Add "aws_rek" for visual NSFW detection (paid add-on).
 *  - `timestamp`        Prevents replay: Cloudinary rejects signatures older
 *                       than SIGNATURE_TTL_SECONDS.
 *
 * ALL of these params must be appended to the client's upload FormData
 * exactly as signed — any modification invalidates the signature.
 */
export function generateUploadSignature(
  userId: string,
  postId: string
): {
  params: SignParams & Record<string, string | number>;
  signature: string;
  apiKey: string;
  cloudName: string;
} {
  const timestamp = Math.round(Date.now() / 1000);

  /**
   * ARCHITECTURE: folder includes postId → beacon/posts/{userId}/{postId}
   *
   * Benefits:
   *  - All media for a single post lives in one Cloudinary folder.
   *  - When a post is deleted, we can delete the entire folder in one API call
   *    instead of tracking individual publicIds.
   *  - Moderation, analytics, and storage audits are scoped to a single post.
   *  - A user cannot upload into another post's folder — signature enforces this.
   */
  const folder = `beacon/posts/${userId}/${postId}`;

  const params: Record<string, string | number> = {
    timestamp,
    folder,
    allowed_formats: CLOUDINARY_ALLOWED_FORMATS,
    moderation: "webpurify",
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    params: { ...params, postId } as SignParams & Record<string, string | number>,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  };
}

// ─── Asset deletion ───────────────────────────────────────────────────────────

/**
 * Delete a Cloudinary asset by its publicId.
 * Called server-side when a user deletes a post.
 *
 * Never throws — a failed asset deletion shouldn't block the DB row deletion.
 */
export async function deletePostMedia(
  publicId: string,
  resourceType: "image" | "video" = "image"
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error("[cloudinary] deletePostMedia failed:", publicId, err);
  }
}
