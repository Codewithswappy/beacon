"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconChevronLeft,
  IconMailFilled,
  IconCamera,
  IconLoader2,
  IconBookmark,
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { uploadMedia, deleteMedia } from "@/lib/supabase/storage";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { MediaGrid } from "@/components/profile/MediaGrid";
import { DuoIcon } from "@/components/ui/DuoIcon";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const supabase = createClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function getProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // We'll fetch the profile. Note: Ensure you have these columns in Supabase!
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }
    getProfile();
  }, []);

  const handleSaveProfile = async (newData: any) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: newData.full_name,
        username: newData.username,
        bio: newData.bio,
        location: newData.location,
        website: newData.website,
        profession: newData.profession,
        birthdate: newData.birthdate,
        is_profession_visible: newData.isProfessionVisible,
        is_birthdate_visible: newData.isBirthdateVisible,
      })
      .eq("id", user.id);

    if (error) {
      alert(error.message);
      return;
    }

    setProfile((prev: any) => ({
      ...prev,
      full_name: newData.full_name,
      username: newData.username,
      bio: newData.bio,
      location: newData.location,
      website: newData.website,
      profession: newData.profession,
      birthdate: newData.birthdate,
      is_profession_visible: newData.isProfessionVisible,
      is_birthdate_visible: newData.isBirthdateVisible,
    }));
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(type);
      const bucket = type === "avatar" ? "avatars" : "covers";

      // Capture the old URL for cleanup
      const oldUrl =
        type === "avatar" ? profile?.avatar_url : profile?.cover_url;

      // Use the storage utility we built
      const path = `${user.id}/${type}_${Date.now()}`;
      const publicUrl = await uploadMedia(bucket, path, file);

      // Update the profiles table
      const updateData =
        type === "avatar"
          ? { avatar_url: publicUrl }
          : { cover_url: publicUrl };
      const { error: dbError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (dbError) throw dbError;

      // Successfully updated DB, now safe to delete the OLD image from storage
      if (oldUrl) {
        await deleteMedia(bucket, oldUrl);
      }

      setProfile((prev: any) => ({ ...prev, ...updateData }));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const renderBioWithLinks = (text: string) => {
    if (!text) return "No bio yet.";

    // Regex to find URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        const displayUrl = part.replace(/^https?:\/\//, "").replace(/\/$/, "");

        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1d9bf0] transition-all hover:underline"
          >
            {displayUrl}
          </a>
        );
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="bg-background flex h-screen items-center justify-center">
        <IconLoader2 className="text-muted animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen w-full">
      {/* Centered Main Container */}
      <div className="relative mx-auto w-full max-w-4xl">
        {/* Top Space */}
        <div className="bg-background h-[10px] w-full" />

        {/* Cover Photos Area Container - 3:1 Ratio */}
        <div className="bg-surface group beacon-shadow relative aspect-3/1 w-full overflow-hidden rounded-[32px]">
          <div className="absolute inset-0">
            {profile?.cover_url ? (
              <Image
                src={profile.cover_url}
                alt="Profile cover banner"
                fill
                quality={85}
                priority
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-linear-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900" />
            )}
          </div>

          <input
            type="file"
            ref={coverInputRef}
            hidden
            onChange={(e) => handleUpload(e, "cover")}
            accept="image/*"
          />

          <div className="absolute top-4 left-4 z-20">
            <Link
              href="/"
              className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-black/40 text-white shadow-sm backdrop-blur-md transition-colors hover:bg-black/60 md:h-12 md:w-12"
            >
              <DuoIcon name="chevronLeft" size={24} className="text-white" />
            </Link>
          </div>
        </div>

        {/* Profile Info Content Container */}
        <div className="relative z-10 px-5 pb-10 md:px-10">
          {/* Avatar and Header Icons Row */}
          <div className="flex items-end justify-between">
            <div className="relative">
              {/* Avatar - Perfect circle overlapping the header */}
              <div className="group beacon-shadow bg-background border-background relative z-20 -mt-12 h-[100px] w-[100px] shrink-0 overflow-hidden rounded-full border-[6px] md:-mt-20 md:h-[150px] md:w-[150px] flex items-center justify-center">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt="User Avatar"
                    fill
                    quality={85}
                    priority
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <DuoIcon name="userDefault" size={60} className="text-neutral-400 md:scale-[1.5]" />
                  </div>
                )}

                <input
                  type="file"
                  ref={avatarInputRef}
                  hidden
                  onChange={(e) => handleUpload(e, "avatar")}
                  accept="image/*"
                />
              </div>
            </div>

            {/* Edit Button Area */}
            <div className="mb-2 flex items-center gap-3 md:mb-3">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="group flex h-[40px] cursor-pointer items-center gap-2 rounded-xl border-2 border-neutral-100 bg-white px-4 shadow-sm transition-all hover:scale-105 active:scale-95 md:h-[44px] md:rounded-2xl md:px-6 dark:border-neutral-700 dark:bg-neutral-800"
              >
                <DuoIcon 
                  name="edit" 
                  size={18} 
                  className="text-neutral-500 group-hover:text-black transition-colors dark:group-hover:text-white" 
                />
                <span className="text-sm font-bold text-neutral-700 md:text-base dark:text-neutral-200">
                  Edit Profile
                </span>
              </button>
            </div>
          </div>

          {/* Identity & Bio Section  */}
          <div className="mt-2 flex flex-col gap-1 md:mt-4">
            <div className="flex items-center gap-1.5">
              <h1 className="text-foreground text-[24px] font-extrabold tracking-tight md:text-[34px]">
                {profile?.full_name ||
                  user?.email?.split("@")[0] ||
                  "User Name"}
              </h1>
              <DuoIcon name="verified" size={24} className="text-[#1d9bf0]" />
            </div>
            <p className="text-muted text-[15px] leading-none font-medium md:text-[17px]">
              @{profile?.username || "username"}
            </p>

            <div className="mt-4 max-w-xl">
              <p className="text-foreground text-[15px] leading-relaxed whitespace-pre-wrap md:text-[18px] md:leading-normal">
                {renderBioWithLinks(profile?.bio)}
              </p>
            </div>
          </div>

          {/* Metadata Bar - Details with Icons */}
          {/* Metadata Rows */}
          <div className="mt-4 space-y-2 md:mt-5 md:space-y-2.5">
            {/* Primary Details Row */}
            <div className="text-muted flex flex-wrap items-center gap-x-4 gap-y-1.5 md:gap-x-5 md:gap-y-2">
              {profile?.is_profession_visible !== false && (
                <div className="hover:text-foreground flex cursor-default items-center gap-1.5 transition-colors">
                  <DuoIcon name="profession" size={18} />
                  <span className="text-[14px] md:text-[15px]">
                    {profile?.profession || "Designer"}
                  </span>
                </div>
              )}
              <div className="hover:text-foreground flex cursor-default items-center gap-1.5 transition-colors">
                <DuoIcon name="location" size={18} />
                <span className="text-[14px] md:text-[15px]">
                  {profile?.location || "India"}
                </span>
              </div>
              {profile?.website && (
                <a
                  href={
                    profile.website.startsWith("http")
                      ? profile.website
                      : `https://${profile.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-[#1d9bf0]"
                >
                  <DuoIcon name="userCircle" size={18} className="text-[#1d9bf0]" />
                  <span className="text-[14px] font-semibold text-[#1d9bf0] md:text-[15px]">
                    {profile.website
                      .replace(/^https?:\/\//, "")
                      .replace(/\/$/, "")}
                  </span>
                </a>
              )}
            </div>

            {/* Dates Row */}
            <div className="text-muted flex flex-wrap items-center gap-x-4 gap-y-1.5 md:gap-x-5 md:gap-y-2">
              {profile?.is_birthdate_visible && profile?.birthdate && (
                <div className="flex cursor-default items-center gap-1.5">
                  <DuoIcon name="calendar" size={18} />
                  <span className="text-[14px] md:text-[15px]">
                    Born{" "}
                    {new Date(profile.birthdate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              <div className="flex cursor-default items-center gap-1.5">
                <DuoIcon name="calendar" size={18} />
                <span className="text-[14px] md:text-[15px]">
                  Joined{" "}
                  {new Date(
                    profile?.created_at || Date.now()
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Bar (Twitter Style) */}
          <div className="mt-4 flex items-center gap-4 md:mt-5 md:gap-6">
            <div className="flex cursor-pointer items-center gap-1 transition-all hover:underline">
              <span className="text-foreground text-[15px] font-extrabold md:text-[16px]">
                104
              </span>
              <span className="text-muted text-[15px] md:text-[16px]">
                Following
              </span>
            </div>
            <div className="flex cursor-pointer items-center gap-1 transition-all hover:underline">
              <span className="text-foreground text-[15px] font-extrabold md:text-[16px]">
                139
              </span>
              <span className="text-muted text-[15px] md:text-[16px]">
                Followers
              </span>
            </div>
          </div>

          {/* PRIMARY ACTIONS: 3-Button Row */}
          <div className="mt-8 flex flex-wrap items-center gap-3 md:gap-4">
            <button className="flex h-[50px] flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-neutral-900 px-8 font-extrabold text-white shadow-xl transition-all hover:scale-105 active:scale-95 md:flex-none dark:bg-white dark:text-black">
              <DuoIcon name="heart" size={20} />
              <span>Follow</span>
            </button>
            <button className="group flex h-[50px] flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-neutral-200 bg-white px-8 font-bold text-black shadow-sm transition-all hover:bg-neutral-50 active:scale-95 md:flex-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700">
              <DuoIcon name="mail" size={20} className="text-neutral-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
              <span>Message</span>
            </button>
            <button className="group flex h-[50px] flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-neutral-200 bg-white px-6 font-bold text-black shadow-sm transition-all hover:bg-neutral-50 active:scale-95 md:flex-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700">
              <span>Save to list</span>
              <DuoIcon name="plusCircle" size={16} className="text-neutral-400 group-hover:translate-y-0.5 transition-all" />
            </button>
          </div>

          {/* Grid section */}
          <div className="mt-10">
            <ProfileTabs />
            <div className="mt-6">
              <MediaGrid />
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        user={user}
        onSave={handleSaveProfile}
        onAvatarClick={() => avatarInputRef.current?.click()}
        onCoverClick={() => coverInputRef.current?.click()}
      />
    </div>
  );
}
