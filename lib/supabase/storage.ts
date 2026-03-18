"use client";

import { createClient } from "./client";

/**
 * Compresses an image client-side using the HTML5 Canvas API.
 * Converts to WebP format for 50-70% smaller file sizes.
 */
export const compressImage = async (
  file: File,
  opts: { maxWidth: number; maxHeight: number; quality: number }
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > opts.maxWidth) {
        height = Math.round((height * opts.maxWidth) / width);
        width = opts.maxWidth;
      }
      if (height > opts.maxHeight) {
        width = Math.round((width * opts.maxHeight) / height);
        height = opts.maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Failed to get canvas context"));
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Convert Blob back to File
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error("Failed to compress image"));
          }
        },
        "image/webp",
        opts.quality
      );
    };
    img.onerror = (err) => reject(err);
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Universal media uploader for Supabase Storage buckets.
 * Applies size limits and client-side compression automatically.
 */
export const uploadMedia = async (
  bucket: "avatars" | "covers" | "posts",
  path: string,
  file: File,
  type: "image" | "video" = "image"
) => {
  const supabase = createClient();
  let uploadFile = file;

  // Strict upload size limits to control storage burn rate
  const MAX_AVATAR_SIZE = 1 * 1024 * 1024; // 1MB
  const MAX_POST_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

  if (bucket === "avatars" && file.size > MAX_AVATAR_SIZE) {
    throw new Error("Avatar image must be under 1MB");
  }
  if (bucket === "posts" && type === "image" && file.size > MAX_POST_IMAGE_SIZE) {
    throw new Error("Post image must be under 5MB");
  }
  if (type === "video" && file.size > MAX_VIDEO_SIZE) {
    throw new Error("Video must be under 50MB");
  }

  // Client-side compression for images
  if (type === "image" && file.type.startsWith("image/")) {
    uploadFile = await compressImage(file, {
      maxWidth: bucket === "avatars" ? 400 : bucket === "covers" ? 1500 : 1200,
      maxHeight: bucket === "avatars" ? 400 : bucket === "covers" ? 500 : 1200,
      quality: 0.75, // Matching Next.js default quality for WebP
    });
  }

  // Upload with aggressive cache headers for extreme bandwidth savings
  const { data, error } = await supabase.storage.from(bucket).upload(path, uploadFile, {
    cacheControl: "31536000, immutable", // 1 year cache + immutable
    upsert: true,
    contentType: type === "image" ? "image/webp" : file.type,
  });

  if (error) throw error;
  
  // Return the public URL
  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicData.publicUrl;
};

/**
 * Removes a file from storage given its public URL.
 * Essential for reclaiming storage when users update their profile/cover images.
 */
export const deleteMedia = async (bucket: "avatars" | "covers" | "posts", url: string) => {
  if (!url || !url.includes(bucket)) return;
  
  const supabase = createClient();
  
  try {
    // Supabase public URLs usually follow: .../storage/v1/object/public/[bucket]/[path]
    // We need to extract the [path] part which might include folders (e.g., userId/file.webp)
    const bucketPart = `/${bucket}/`;
    const bucketIndex = url.indexOf(bucketPart);
    
    if (bucketIndex === -1) return;
    
    // Extract everything after the bucket name
    const path = url.substring(bucketIndex + bucketPart.length);
    
    if (!path) return;

    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error(`Failed to delete old ${bucket} image at path ${path}:`, error.message);
    } else {
      console.log(`Successfully deleted old ${bucket} image:`, path);
    }
  } catch (err) {
    console.error("Error in deleteMedia:", err);
  }
};
