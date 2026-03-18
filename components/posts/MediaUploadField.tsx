"use client";

/**
 * components/posts/MediaUploadField.tsx
 *
 * Example component showing how to use the signed Cloudinary upload flow.
 *
 * Usage in a post-creation form:
 *
 *   <MediaUploadField
 *     onChange={(media) => setMedia(media)}
 *     onError={(msg) => toast.error(msg)}
 *   />
 *
 * After the user picks files, this component:
 *  1. Validates type/size locally (instant, no network)
 *  2. Requests a signed token from our server
 *  3. Uploads directly to Cloudinary with a progress bar
 *  4. Calls onChange() with the UploadedMedia[] result
 */

import { useRef, useState, useCallback } from "react";
import { uploadFiles, validateFile } from "@/lib/cloudinary-client";
import { MEDIA_LIMITS } from "@/lib/types/media";
import type { UploadedMedia } from "@/lib/types/media";

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number; fileName: string }
  | { status: "done"; media: UploadedMedia[] }
  | { status: "error"; message: string };

type Props = {
  onChange: (media: UploadedMedia[]) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function MediaUploadField({ onChange, onError, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [isDragging, setIsDragging] = useState(false);

  // ─── Handle file selection ─────────────────────────────────────────────────

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      // Quick local validation before hitting the network
      try {
        for (const file of files) {
          validateFile(file); // throws on bad type/size
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid file.";
        setState({ status: "error", message });
        onError?.(message);
        return;
      }

      // Abort any in-flight upload
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setState({ status: "uploading", progress: 0, fileName: files[0].name });

      try {
        const uploaded = await uploadFiles(files, {
          signal: abortRef.current.signal,
          // For multi-file uploads the progress tracks the last file's progress.
          // In production you'd track per-file progress separately.
          onProgress: (pct) =>
            setState((prev) =>
              prev.status === "uploading"
                ? { ...prev, progress: pct }
                : prev
            ),
        });

        setState({ status: "done", media: uploaded });
        onChange(uploaded);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed.";
        setState({ status: "error", message });
        onError?.(message);
      }
    },
    [onChange, onError]
  );

  // ─── Input change ──────────────────────────────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    handleFiles(files);
    // Reset input so the same file can be re-selected after an error
    e.target.value = "";
  };

  // ─── Drag & drop ──────────────────────────────────────────────────────────

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  // ─── Cancel ───────────────────────────────────────────────────────────────

  const handleCancel = () => {
    abortRef.current?.abort();
    setState({ status: "idle" });
  };

  // ─── Reset ────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setState({ status: "idle" });
    onChange([]);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const isUploading = state.status === "uploading";

  return (
    <div className="w-full space-y-3">
      {/* Drop zone */}
      {state.status === "idle" || state.status === "error" ? (
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={[
            "flex w-full cursor-pointer flex-col items-center justify-center gap-2",
            "rounded-xl border-2 border-dashed px-6 py-10 transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground",
            isDragging
              ? "border-foreground bg-foreground/5"
              : "dark:border-border border-gray-200 hover:border-gray-300 dark:hover:border-foreground/40",
            disabled ? "pointer-events-none opacity-40" : "",
          ].join(" ")}
        >
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            Drop files here or{" "}
            <span className="text-foreground underline underline-offset-2">browse</span>
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-600">
            Images up to 5 MB · Videos up to 50 MB
            <br />
            Max {MEDIA_LIMITS.MAX_IMAGES_PER_POST} images or{" "}
            {MEDIA_LIMITS.MAX_VIDEOS_PER_POST} video per post
          </span>

          {state.status === "error" && (
            <p className="mt-2 text-xs font-semibold text-red-500">{state.message}</p>
          )}
        </button>
      ) : null}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
        multiple
        className="sr-only"
        onChange={handleInputChange}
        aria-label="Upload media"
      />

      {/* Upload progress */}
      {state.status === "uploading" && (
        <div className="space-y-2 rounded-xl border border-gray-100 p-4 dark:border-border">
          <div className="flex items-center justify-between">
            <span className="max-w-[200px] truncate text-sm font-medium text-gray-700 dark:text-gray-300">
              {state.fileName}
            </span>
            <button
              type="button"
              onClick={handleCancel}
              className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* ASCII Progress bar */}
          <div className="flex flex-col items-center mt-3 mb-1">
            <span className="text-sm font-bold text-foreground font-mono tracking-tight">
              Uploading {state.progress}%
            </span>
            <span className="text-lg text-muted mt-1 tracking-widest font-mono leading-none">
              {Array.from({ length: 15 }).map((_, i) =>
                i < Math.floor((state.progress / 100) * 15) ? "█" : "░"
              ).join("")}
            </span>
          </div>
        </div>
      )}

      {/* Uploaded preview */}
      {state.status === "done" && state.media.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {state.media.map((m) => (
              <div
                key={m.publicId}
                className="relative aspect-square overflow-hidden rounded-lg border border-gray-100 dark:border-border"
              >
                {m.type === "image" ? (
                  <img
                    src={m.url}
                    alt="Uploaded"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <video
                    src={m.url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                  />
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
          >
            Remove all
          </button>
        </div>
      )}
    </div>
  );
}
