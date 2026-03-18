import { memo } from "react";
import Link from "next/link";
import { CloudinaryImage } from "@/components/ui/CloudinaryImage";
import { CloudinaryVideo } from "@/components/ui/CloudinaryVideo";
import { DuoIcon } from "@/components/ui/DuoIcon";

type FeedCardProps = {
  post: {
    id: string;
    caption: string;
    user: {
      name: string;
      username: string;
      avatarUrl?: string;
    };
    media: Array<{
      publicId: string;
      type: "image" | "video";
      width: number;
      height: number;
      duration?: number;
    }>;
    likesCount: number;
    createdAt: string;
  };
  /**
   * Used to prioritize loading (e.g. LCP optimization) for the first item in the feed.
   */
  priority?: boolean;
};

export const FeedCard = memo(function FeedCard({ post, priority = false }: FeedCardProps) {
  // If we have media, calculate the aspect ratio of the first item to prevent CLS
  const firstMedia = post.media[0];
  const aspectRatio = firstMedia
    ? `${firstMedia.width}/${firstMedia.height}`
    : undefined;

  return (
    <article className="beacon-shadow relative overflow-hidden rounded-[24px] border border-white/5 bg-surface md:rounded-[32px]">
      {/* ── User Header ── */}
      <div className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-800">
            {post.user.avatarUrl ? (
              <img
                src={post.user.avatarUrl}
                alt={post.user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <DuoIcon name="userDefault" size={24} className="m-auto mt-2 text-neutral-400" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-foreground">{post.user.name}</h3>
            <p className="text-sm font-medium text-muted">@{post.user.username}</p>
          </div>
        </div>
        <button className="text-muted hover:text-foreground transition-colors">
          <DuoIcon name="settings" size={24} />
        </button>
      </div>

      {/* ── Media Area ── */}
      {firstMedia && (
        <Link href={`/shots/${post.id}`} className="block w-full cursor-zoom-in">
          {firstMedia.type === "video" ? (
            <CloudinaryVideo
              cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!}
              publicId={firstMedia.publicId}
              context="card"
              aspectRatio={aspectRatio}
              autoPlayInView
              loop
              duration={firstMedia.duration}
            />
          ) : (
            <CloudinaryImage
              cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!}
              publicId={firstMedia.publicId}
              context="card"
              alt={post.caption || "Post media"}
              aspectRatio={aspectRatio}
              priority={priority}
            />
          )}
        </Link>
      )}

      {/* ── Body & Actions ── */}
      <div className="p-4 md:p-6">
        {/* Actions */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-4">
            <button className="flex items-center gap-2 text-muted transition-colors hover:text-white">
              <DuoIcon name="heart" size={24} />
              <span className="font-bold">{post.likesCount}</span>
            </button>
            <button className="flex items-center gap-2 text-muted transition-colors hover:text-white">
              <DuoIcon name="mail" size={24} />
              <span className="font-bold">24</span>
            </button>
          </div>
          <button className="text-muted transition-colors hover:text-white">
            <DuoIcon name="bookmark" size={24} />
          </button>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-[15px] leading-relaxed text-foreground">
            <span className="font-bold mr-2">{post.user.username}</span>
            {post.caption}
          </p>
        )}
      </div>
    </article>
  );
});

/**
 * Skeleton loading state for FeedCard.
 * Exact dimensional match to prevent any scroll jump or layout shift
 * when replaced by the real data.
 */
export function FeedCardSkeleton() {
  return (
    <article className="beacon-shadow relative overflow-hidden rounded-[24px] border border-white/5 bg-surface md:rounded-[32px] animate-pulse">
      {/* ── User Header Skeleton ── */}
      <div className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/5" />
          <div className="space-y-2">
            <div className="h-4 w-24 rounded-md bg-white/5" />
            <div className="h-3 w-16 rounded-md bg-white/5" />
          </div>
        </div>
        <div className="h-6 w-6 rounded-md bg-white/5" />
      </div>

      {/* ── Media Area Skeleton ── 
          Matches the typical 4/3 aspect ratio of the feed.
      */}
      <div className="w-full bg-white/5 aspect-4/3" />

      {/* ── Body & Actions Skeleton ── */}
      <div className="p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-4">
            <div className="h-6 w-12 rounded-md bg-white/5" />
            <div className="h-6 w-12 rounded-md bg-white/5" />
          </div>
          <div className="h-6 w-6 rounded-md bg-white/5" />
        </div>

        <div className="space-y-2 mt-4">
          <div className="h-4 w-full rounded-md bg-white/5" />
          <div className="h-4 w-3/4 rounded-md bg-white/5" />
        </div>
      </div>
    </article>
  );
}
