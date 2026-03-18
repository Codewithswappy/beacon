import { z } from "zod";

// ─── Post text limits ─────────────────────────────────────────────────────────
export const POST_TEXT_MIN = 1;
export const POST_TEXT_MAX = 500;       // hard cap, enforced server-side

// ─── Create Post schema ───────────────────────────────────────────────────────
export const CreatePostSchema = z.object({
  /**
   * Optional text body of the post.
   * Stripped of leading/trailing whitespace server-side.
   */
  caption: z
    .string()
    .min(POST_TEXT_MIN, "Post cannot be empty.")
    .max(POST_TEXT_MAX, `Post cannot exceed ${POST_TEXT_MAX} characters.`)
    .trim()
    .optional(),

  /**
   * Cloudinary URLs + metadata returned from the upload API.
   * Client first uploads media → gets back URLs → sends this array.
   */
  media: z
    .array(
      z.object({
        url: z.string().url("Invalid media URL."),
        publicId: z.string().min(1),
        type: z.enum(["image", "video"]),
        width: z.number().optional(),
        height: z.number().optional(),
        duration: z.number().optional(),
      })
    )
    .max(4, "A post can have at most 4 media items.")
    .optional(),
}).superRefine((val, ctx) => {
  // A post must have at least text OR media
  if (!val.caption && (!val.media || val.media.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Post must have text or at least one media item.",
      path: ["caption"],
    });
  }

  // Only 1 video allowed
  const videos = val.media?.filter((m) => m.type === "video") ?? [];
  if (videos.length > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A post can contain at most 1 video.",
      path: ["media"],
    });
  }

  // Cannot mix video with images in same post
  const images = val.media?.filter((m) => m.type === "image") ?? [];
  if (videos.length > 0 && images.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A post cannot contain both images and a video.",
      path: ["media"],
    });
  }
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

// ─── Delete Post schema ───────────────────────────────────────────────────────
export const DeletePostSchema = z.object({
  postId: z.string().uuid("Invalid post ID."),
});

// ─── Media upload validation (pre-Cloudinary, on server) ─────────────────────
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024;  // 50 MB
