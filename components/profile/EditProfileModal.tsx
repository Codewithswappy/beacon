"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { DuoIcon } from "@/components/ui/DuoIcon";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  user: any;
  onSave: (data: any) => Promise<void>;
  onAvatarClick: () => void;
  onCoverClick: () => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  profile,
  user,
  onSave,
  onAvatarClick,
  onCoverClick,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    username: profile?.username || "",
    email: user?.email || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    website: profile?.website || "",
    profession: profile?.profession || "Designer",
    birthdate: profile?.birthdate || "",
    isProfessionVisible: profile?.is_profession_visible ?? true,
    isBirthdateVisible: profile?.is_birthdate_visible ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [showProfessionSuggestions, setShowProfessionSuggestions] =
    useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const professionOptions = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Software Engineer",
    "Web Developer",
    "Mobile App Developer",
    "Android Developer",
    "iOS Developer",
    "Game Developer",
    "AI Engineer",
    "Machine Learning Engineer",
    "Data Scientist",
    "DevOps Engineer",
    "Cloud Engineer",
    "Security Engineer",
    "Blockchain Developer",
    "Embedded Systems Engineer",
    "Site Reliability Engineer",
    "Data Engineer",
    "API Developer",
    "UI Designer",
    "UX Designer",
    "Product Designer",
    "Visual Designer",
    "Interaction Designer",
    "Design Engineer",
    "Motion Designer",
    "3D Designer",
    "Graphic Designer",
    "Brand Designer",
    "Creative Developer",
    "UI Engineer",
    "Frontend Engineer",
    "Software Architect",
    "Technical Lead",
    "Engineering Manager",
    "Startup Founder",
    "Indie Hacker",
    "Open Source Maintainer",
    "Tech Educator",
    "Technical Writer",
    "Developer Advocate",
    "Product Manager",
    "Technical Product Manager",
    "QA Engineer",
    "Automation Engineer",
    "Test Engineer",
    "Game Designer",
    "AR/VR Developer",
    "Robotics Engineer",
    "IoT Developer",
  ];

  const locationOptions = [
    "San Francisco, USA",
    "New York, USA",
    "Los Angeles, USA",
    "Seattle, USA",
    "Austin, USA",
    "Boston, USA",
    "Chicago, USA",
    "Toronto, Canada",
    "Vancouver, Canada",
    "London, UK",
    "Manchester, UK",
    "Berlin, Germany",
    "Munich, Germany",
    "Amsterdam, Netherlands",
    "Paris, France",
    "Barcelona, Spain",
    "Madrid, Spain",
    "Lisbon, Portugal",
    "Stockholm, Sweden",
    "Copenhagen, Denmark",
    "Zurich, Switzerland",
    "Vienna, Austria",
    "Dublin, Ireland",
    "Prague, Czech Republic",
    "Warsaw, Poland",
    "Budapest, Hungary",
    "Bangalore, India",
    "Mumbai, India",
    "Delhi, India",
    "Hyderabad, India",
    "Pune, India",
    "Chennai, India",
    "Kolkata, India",
    "Ahmedabad, India",
    "Jaipur, India",
    "Singapore",
    "Tokyo, Japan",
    "Osaka, Japan",
    "Seoul, South Korea",
    "Shanghai, China",
    "Beijing, China",
    "Shenzhen, China",
    "Hong Kong",
    "Taipei, Taiwan",
    "Sydney, Australia",
    "Melbourne, Australia",
    "Auckland, New Zealand",
    "Dubai, UAE",
    "Abu Dhabi, UAE",
    "Tel Aviv, Israel",
    "Istanbul, Turkey",
    "Cape Town, South Africa",
    "Johannesburg, South Africa",
    "São Paulo, Brazil",
    "Rio de Janeiro, Brazil",
    "Buenos Aires, Argentina",
    "Mexico City, Mexico",
    "Lagos, Nigeria",
    "Nairobi, Kenya",
  ];

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        full_name: profile.full_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        location: profile.location || "",
        website: profile.website || "",
        profession: profile.profession || "Designer",
        birthdate: profile.birthdate || "",
        isProfessionVisible: profile.is_profession_visible ?? true,
        isBirthdateVisible: profile.is_birthdate_visible ?? false,
      }));
    }
  }, [profile]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="scrollbar-hide relative max-h-[90vh] w-full max-w-[700px] overflow-hidden overflow-y-auto rounded-[40px] bg-white shadow-2xl dark:bg-neutral-900"
          >
            {/* 1. Header Area with Cover & Avatar */}
            <div className="relative h-[180px] px-8 pt-8 md:h-[220px]">
              <div className="absolute inset-0 m-4 overflow-hidden rounded-[32px] bg-neutral-200 dark:bg-neutral-800">
                {profile?.cover_url ? (
                  <Image
                    src={profile.cover_url}
                    alt="Cover"
                    fill
                    className="object-cover opacity-80"
                  />
                ) : (
                  <div className="h-full w-full bg-linear-to-br from-neutral-100 to-neutral-200 opacity-80 dark:from-neutral-800 dark:to-neutral-900" />
                )}
                <div
                  onClick={onCoverClick}
                  className="group absolute inset-0 flex cursor-pointer items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100"
                >
                  <DuoIcon
                    name="photoPlus"
                    size={42}
                    className="scale-90 text-white drop-shadow-lg transition-transform group-hover:scale-100"
                  />
                </div>
              </div>

              <div className="absolute -bottom-14 left-10">
                <div
                  onClick={onAvatarClick}
                  className="group relative cursor-pointer"
                >
                  <div className="flex h-[110px] w-[110px] items-center justify-center overflow-hidden rounded-full border-[6px] border-white bg-neutral-100 shadow-xl md:h-[130px] md:w-[130px] dark:border-neutral-900 dark:bg-neutral-800">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt="Avatar"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <DuoIcon
                        name="userDefault"
                        size={48}
                        className="text-neutral-400 md:scale-125"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <DuoIcon
                        name="photoPlus"
                        size={32}
                        className="scale-90 text-white transition-transform group-hover:scale-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Identity Section */}
            <div className="mt-16 px-10">
              <h2 className="text-foreground text-[26px] font-extrabold">
                Edit Profile
              </h2>
              <p className="font-medium text-neutral-400">
                Keep your profile fresh and updated.
              </p>
            </div>

            {/* 3. Form Section */}
            <div className="space-y-6 px-10 py-8">
              {/* Name & Username Row */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-foreground ml-1 text-[15px] font-bold">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="h-[52px] w-full rounded-2xl border border-neutral-100 bg-neutral-50 px-5 font-medium transition-all focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800/50 dark:focus:ring-white/5"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-foreground ml-1 text-[15px] font-bold">
                    Username
                  </label>
                  <input
                    type="text"
                    className="h-[52px] w-full rounded-2xl border border-neutral-100 bg-neutral-50 px-5 font-medium transition-all focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800/50 dark:focus:ring-white/5"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Bio Field Overlay */}
              <div className="space-y-2">
                <label className="text-foreground ml-1 text-[15px] font-bold">
                  Bio
                </label>
                <textarea
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-neutral-100 bg-neutral-50 px-5 py-4 font-medium transition-all focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800/50 dark:focus:ring-white/5"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Professional Category & Birthdate */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="relative space-y-2">
                  <div className="ml-1 flex items-center justify-between">
                    <label className="text-foreground text-[15px] font-bold">
                      Category / Profession
                    </label>
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          isProfessionVisible: !formData.isProfessionVisible,
                        })
                      }
                      className={`relative h-5 w-10 rounded-full transition-colors ${formData.isProfessionVisible ? "bg-neutral-900 dark:bg-white" : "bg-neutral-200 dark:bg-neutral-700"}`}
                    >
                      <div
                        className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${formData.isProfessionVisible ? "right-0.5 bg-white dark:bg-black" : "left-0.5 bg-white"}`}
                      />
                    </button>
                  </div>
                  <input
                    type="text"
                    className="h-[52px] w-full rounded-2xl border border-neutral-100 bg-neutral-50 px-5 font-medium transition-all focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800/50 dark:focus:ring-white/5"
                    value={formData.profession}
                    onChange={(e) => {
                      setFormData({ ...formData, profession: e.target.value });
                      setShowProfessionSuggestions(true);
                    }}
                    onFocus={() => setShowProfessionSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowProfessionSuggestions(false), 200)
                    }
                  />
                  <AnimatePresence>
                    {showProfessionSuggestions && formData.profession && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full right-0 left-0 z-20 mt-2 max-h-[200px] overflow-hidden overflow-y-auto rounded-2xl border border-neutral-100 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
                      >
                        {professionOptions
                          .filter((opt) =>
                            opt
                              .toLowerCase()
                              .includes(formData.profession.toLowerCase())
                          )
                          .map((opt) => (
                            <button
                              key={opt}
                              onClick={() => {
                                setFormData({ ...formData, profession: opt });
                                setShowProfessionSuggestions(false);
                              }}
                              className="text-foreground w-full px-5 py-3 text-left font-medium transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
                            >
                              {opt}
                            </button>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-2">
                  <div className="ml-1 flex items-center justify-between">
                    <label className="text-foreground text-[15px] font-bold">
                      Birthdate
                    </label>
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          isBirthdateVisible: !formData.isBirthdateVisible,
                        })
                      }
                      className={`relative h-5 w-10 rounded-full transition-colors ${formData.isBirthdateVisible ? "bg-neutral-900 dark:bg-white" : "bg-neutral-200 dark:bg-neutral-700"}`}
                    >
                      <div
                        className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${formData.isBirthdateVisible ? "right-0.5 bg-white dark:bg-black" : "left-0.5 bg-white"}`}
                      />
                    </button>
                  </div>
                  <input
                    type="date"
                    className="h-[52px] w-full rounded-2xl border border-neutral-100 bg-neutral-50 px-5 font-medium transition-all focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800/50 dark:focus:ring-white/5"
                    value={formData.birthdate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthdate: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Location & Website Row */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="relative space-y-2">
                  <label className="text-foreground ml-1 text-[15px] font-bold">
                    Location
                  </label>
                  <input
                    type="text"
                    className="h-[52px] w-full rounded-2xl border border-neutral-100 bg-neutral-50 px-5 font-medium transition-all focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800/50 dark:focus:ring-white/5"
                    value={formData.location}
                    onChange={(e) => {
                      setFormData({ ...formData, location: e.target.value });
                      setShowLocationSuggestions(true);
                    }}
                    onFocus={() => setShowLocationSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowLocationSuggestions(false), 200)
                    }
                  />
                  <AnimatePresence>
                    {showLocationSuggestions && formData.location && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full right-0 left-0 z-20 mt-2 max-h-[200px] overflow-hidden overflow-y-auto rounded-2xl border border-neutral-100 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
                      >
                        {locationOptions
                          .filter((opt) =>
                            opt
                              .toLowerCase()
                              .includes(formData.location.toLowerCase())
                          )
                          .map((opt) => (
                            <button
                              key={opt}
                              onClick={() => {
                                setFormData({ ...formData, location: opt });
                                setShowLocationSuggestions(false);
                              }}
                              className="text-foreground w-full px-5 py-3 text-left font-medium transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
                            >
                              {opt}
                            </button>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-2">
                  <label className="text-foreground ml-1 text-[15px] font-bold">
                    Website
                  </label>
                  <input
                    type="url"
                    className="h-[52px] w-full rounded-2xl border border-neutral-100 bg-neutral-50 px-5 font-medium transition-all focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800/50 dark:focus:ring-white/5"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* 4. Footer Actions */}
            <div className="mt-4 flex justify-end gap-3 border-t border-neutral-100 px-10 py-8 dark:border-neutral-800">
              <button
                onClick={onClose}
                className="h-[52px] rounded-2xl px-8 font-bold text-neutral-600 transition-all hover:bg-neutral-50 active:scale-95 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                Discard
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex h-[52px] items-center gap-2 rounded-2xl bg-neutral-950 px-8 font-bold text-white shadow-xl transition-all hover:shadow-black/10 active:scale-95 dark:bg-white dark:text-black dark:hover:shadow-white/10"
              >
                {loading ? (
                  <IconLoader2 className="animate-spin" size={20} />
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
function IconLoader2({
  className,
  size,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
