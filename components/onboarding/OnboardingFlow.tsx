"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  IconCheck,
  IconLoader2,
  IconArrowRight,
  IconArrowLeft,
  IconRocket,
  IconBrandTwitter,
  IconBrandGithub,
  IconBrandLinkedin,
  IconWorld,
  IconAlertCircle,
  Icon3dCubeSphere,
  IconBrandX,
} from "@tabler/icons-react";
import { motion, AnimatePresence, easeIn } from "motion/react";
import { debounce } from "lodash";
import { useRouter } from "next/navigation";

const STEPS = [
  { id: 1, title: "Identity", sub: "Handle" },
  { id: 2, title: "Expertise", sub: "Skills" },
  { id: 3, title: "Profile", sub: "Socials" },
];

const SKILL_OPTIONS = [
  "UI Design",
  "Web Development",
  "Product Design",
  "3D",
  "Motion",
  "Branding",
  "Illustration",
  "UX Research",
];

const SOCIALS = [
  { id: "twitter", icon: IconBrandX, label: "Twitter", color: "#000" },
  { id: "github", icon: IconBrandGithub, label: "GitHub", color: "#333" },
  {
    id: "linkedin",
    icon: IconBrandLinkedin,
    label: "LinkedIn",
    color: "#0077B5",
  },
  { id: "website", icon: IconWorld, label: "Website", color: "#10b981" },
];

export function OnboardingFlow() {
  const supabase = createClient();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(0);
  const [showSpark, setShowSpark] = useState(false);

  const triggerStepTransition = (next: boolean) => {
    setShowSpark(true);
    setTimeout(() => setShowSpark(false), 800);
    if (next) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    } else {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Form State
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({
    twitter: "",
    github: "",
    linkedin: "",
    website: "",
  });
  const [activeSocial, setActiveSocial] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Fetch User Avatar on Mount
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.avatar_url) {
        setUserAvatar(user.user_metadata.avatar_url);
      }
    };
    fetchUser();
  }, [supabase]);

  // Username Availability Check
  const checkUsername = useCallback(
    debounce(async (val: string) => {
      if (val.length < 3) {
        setUsernameStatus("invalid");
        return;
      }
      setUsernameStatus("checking");
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", val.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error("Username check error:", error.message, error.code);
        setUsernameStatus("idle");
        return;
      }

      if (data) setUsernameStatus("taken");
      else setUsernameStatus("available");
    }, 500),
    [supabase],
  );

  useEffect(() => {
    if (username) checkUsername(username);
    else setUsernameStatus("idle");
  }, [username, checkUsername]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const handleContinue = async () => {
    if (currentStep < 3) {
      triggerStepTransition(true);
    } else {
      await saveProfile(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      triggerStepTransition(false);
    }
  };

  const validateSocial = (id: string, value: string) => {
    if (!value) return true;
    const val = value.trim();

    switch (id) {
      case "twitter":
        // Require @handle or full twitter/x URL
        return (
          /^@\w{1,15}$/.test(val) ||
          /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/\w{1,15}\/?$/.test(val)
        );

      case "github":
        // Require handle or full github URL
        return (
          /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(val) ||
          /^(https?:\/\/)?(www\.)?github\.com\/[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}\/?$/i.test(
            val,
          )
        );

      case "linkedin":
        // LinkedIn handles are too variable, so we strictly enforce the profile URL format
        return /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company|school|me)\/[A-Za-z0-9-]{3,100}\/?$/.test(
          val,
        );

      case "website":
        return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(
          val,
        );

      default:
        return true;
    }
  };
  const handleSocialChange = (id: string, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [id]: value }));
  };

  const saveProfile = async (skip = false) => {
    // Basic validation check before saving (unless skipping)
    if (!skip) {
      const allValid = Object.entries(socialLinks).every(([id, val]) =>
        validateSocial(id, val),
      );
      if (!allValid) return;
    }

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        username: username.toLowerCase().trim(),
        skills: selectedSkills,
        bio,
        website: socialLinks.website,
        socials: {
          twitter: socialLinks.twitter,
          github: socialLinks.github,
          linkedin: socialLinks.linkedin,
        },
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });
      if (!error) router.push("/dashboard");
    }
    setLoading(false);
  };

  const contentVariants = {
    enter: (direction: number) => ({
      y: direction > 0 ? 20 : -20,
      opacity: 0,
      scale: 0.96,
      filter: "blur(6px)",
      rotateX: direction > 0 ? 10 : -10,
    }),
    center: {
      y: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      rotateX: 0,
      transition: {
        duration: 0.6,
        type: "spring",
        stiffness: 120,
        damping: 20,
      } as any,
    },
    exit: (direction: number) => ({
      y: direction < 0 ? 20 : -20,
      opacity: 0,
      scale: 1.02,
      filter: "blur(6px)",
      transition: { duration: 0.3 } as any,
    }),
  };

  // Spark Effect Component
  const SparkBlast = () => (
    <div className="absolute inset-0 pointer-events-none z-100 flex items-center justify-center overflow-visible">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1.5, 0],
            x: Math.cos(i * 30 * (Math.PI / 180)) * 150,
            y: Math.sin(i * 30 * (Math.PI / 180)) * 150,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute w-1 h-1 bg-black rounded-full"
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 select-none overflow-hidden flex flex-col tracking-tight [WebkitTapHighlightColor:transparent]">
      {/* Warm Gradient Spots */}
      <div className="fixed inset-0 z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[-10%] w-[30%] h-[20%]  bg-amber-300/20 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[30%] h-[30%]  bg-cyan-400/20 blur-[100px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%]  bg-rose-400/20 blur-[100px]" />
      </div>

      <header className="fixed top-0 left-0 w-full px-6 md:px-12 py-6 md:py-8 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <Icon3dCubeSphere size={20} className="text-black md:w-6 md:h-6" />
          <span className="font-bold text-lg md:text-xl tracking-tighter">
            Beacon
          </span>
        </div>
        <div className="flex items-center gap-3">
          {userAvatar ? (
            <div className="w-12 h-12 rounded-full border-2 border-gray-200 shadow-sm shadow-black/10 ring-1 ring-black/10 overflow-hidden bg-gray-50">
              <img
                src={userAvatar}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 shadow-sm" />
          )}
        </div>
      </header>

      <div className="flex-1 w-full max-w-5xl mx-auto px-6 md:px-10 flex flex-col md:flex-row relative z-10 pt-28 md:pt-40 items-start md:gap-20">
        {/* PROGRESS SIDEBAR: RESPONSIVE LIQUID */}
        <aside className="w-full md:w-[160px] shrink-0 mb-12 md:mb-0 pt-2">
          <p className="hidden md:block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-8 opacity-50">
            OnBoarding
          </p>
          <nav className="flex md:flex-col justify-center md:justify-start items-center md:items-start relative">
            {STEPS.map((step, idx) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div
                  key={step.id}
                  className="relative flex flex-col md:flex-row items-center gap-2 md:gap-4 md:pb-8 last:pb-0 flex-1 md:flex-none"
                >
                  {/* Connecting Line with Liquid Pulse */}
                  {idx !== STEPS.length - 1 && (
                    <div className="absolute left-1/2 md:left-[9.5px] top-2.5 md:top-6 w-[calc(100%-20px)] md:w-[1px] h-[1px] md:h-full bg-gray-50 overflow-hidden -translate-y-1/2 md:translate-y-0 translate-x-[15px] md:translate-x-0">
                      <motion.div
                        initial={false}
                        animate={{
                          height: isCompleted ? "100%" : "0%",
                          backgroundColor: isCompleted ? "#10b981" : "#f3f4f6",
                        }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full origin-top"
                      >
                        {/* Kinetic Pulse traveling down */}
                        {isActive && (
                          <motion.div
                            initial={{
                              [idx > 0 && currentStep === step.id
                                ? "left"
                                : "top"]: "-20%",
                            }}
                            animate={{
                              [idx > 0 && currentStep === step.id
                                ? "left"
                                : "top"]: "120%",
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="absolute left-0 top-0 w-full h-full bg-linear-to-r md:bg-linear-to-b from-transparent via-black/20 to-transparent"
                          />
                        )}
                      </motion.div>
                    </div>
                  )}

                  {/* Icon Marker with Ripple & Pop */}
                  <div className="relative z-10">
                    <motion.div
                      animate={{
                        backgroundColor: isCompleted ? "#10b981" : "#fff",
                        borderColor: isCompleted
                          ? "#10b981"
                          : isActive
                            ? "#000"
                            : "#eee",
                        scale: isActive ? 1.2 : 1,
                        rotate: isCompleted ? 360 : 0,
                        boxShadow: isCompleted
                          ? "0 0 20px rgba(16, 185, 129, 0.2)"
                          : "none",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                      className="w-5 h-5 rounded-full flex items-center justify-center border-[1.5px] text-[9px] font-bold shadow-sm relative overflow-visible"
                    >
                      {/* Smooth Multi-Layer Ripple */}
                      {isActive && (
                        <div className="absolute inset-0 pointer-events-none overflow-visible">
                          {[0, 1].map((i) => (
                            <motion.div
                              key={i}
                              className="absolute inset-0 rounded-full border border-black/10 will-change-transform"
                              animate={{
                                scale: [1, 2.5],
                                opacity: [0.4, 0],
                              }}
                              transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "linear",
                                delay: i * 1.25,
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Content Pop */}
                      <AnimatePresence mode="wait">
                        {isCompleted ? (
                          <motion.div
                            key="check"
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 20,
                            }}
                          >
                            <IconCheck
                              size={11}
                              stroke={5}
                              className="text-white"
                            />
                          </motion.div>
                        ) : isActive ? (
                          <motion.div
                            key="dot"
                            initial={{ scale: 0.5 }}
                            animate={{ scale: [0.8, 1.2, 0.8] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            className="w-1.5 h-1.5 bg-black rounded-full"
                          />
                        ) : (
                          <motion.span key="num" className="text-gray-300">
                            {step.id}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>

                  {/* Staggered Text Label */}
                  <div className="flex flex-col">
                    <motion.span
                      animate={{
                        opacity: isActive || isCompleted ? 1 : 0.3,
                        x: isActive
                          ? typeof window !== "undefined" &&
                            window.innerWidth < 768
                            ? 0
                            : 6
                          : 0,
                        scale: isActive ? 1.05 : 1,
                      }}
                      className={`text-[10px] md:text-[12px] font-bold transition-all origin-left text-center md:text-left ${isActive ? "text-black" : "text-gray-300"}`}
                    >
                      {step.title}
                    </motion.span>
                    <motion.span
                      animate={{
                        opacity: isActive ? 1 : 0,
                        height: isActive ? "auto" : 0,
                      }}
                      className="hidden md:block text-[9px] font-semibold text-gray-400 overflow-hidden"
                    >
                      {step.sub}
                    </motion.span>
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 flex justify-center perspective-[1000px] w-full">
          <div className="w-full max-w-[400px] md:max-w-[440px] relative px-1 md:px-0">
            <AnimatePresence>{showSpark && <SparkBlast />}</AnimatePresence>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-10"
              >
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h1 className="text-[28px] font-black leading-tight tracking-tight text-gray-900">
                        Choose your handle.
                      </h1>
                      <p className="text-[14px] font-medium text-gray-400">
                        This is how people will find your work.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold">
                          @
                        </span>
                        <input
                          autoFocus
                          type="text"
                          value={username}
                          onChange={(e) =>
                            setUsername(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9_]/g, ""),
                            )
                          }
                          placeholder="handle"
                          className={`w-full pl-8 pr-12 py-3 bg-white border rounded-xl text-base font-bold transition-all focus:outline-none focus:ring-0 ${
                            usernameStatus === "taken"
                              ? "border-red-100 focus:border-red-400"
                              : usernameStatus === "available"
                                ? "border-green-100 focus:border-green-400"
                                : "border-gray-50 focus:border-black"
                          }`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          {usernameStatus === "checking" && (
                            <IconLoader2
                              className="animate-spin text-gray-300"
                              size={16}
                            />
                          )}
                          {usernameStatus === "available" && (
                            <IconCheck
                              className="text-green-500"
                              size={18}
                              stroke={4}
                            />
                          )}
                          {usernameStatus === "taken" && (
                            <IconAlertCircle
                              className="text-red-400"
                              size={18}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold text-gray-400">
                          beacon.com/{username || "..."}
                        </span>
                        {usernameStatus === "taken" && (
                          <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">
                            Taken
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h1 className="text-[28px] font-black leading-tight tracking-tight text-gray-900">
                        What's your craft?
                      </h1>
                      <p className="text-[14px] font-medium text-gray-400">
                        Choose the tags that define your skill set.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {SKILL_OPTIONS.map((skill) => (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all border focus:outline-none focus:ring-0 ${selectedSkills.includes(skill) ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-100 hover:border-gray-900"}`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h1 className="text-[28px] font-black leading-tight tracking-tight text-gray-900">
                        Final touches.
                      </h1>
                      <p className="text-[14px] font-medium text-gray-400">
                        Complete your profile to build instant trust.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Social Selection Grid */}
                      <div className="flex gap-3">
                        {SOCIALS.map((soc) => (
                          <motion.button
                            key={soc.id}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveSocial(soc.id)}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 ${
                              activeSocial === soc.id
                                ? "border-black bg-black text-white shadow-lg shadow-black/10"
                                : "border-gray-50 bg-white text-gray-400 hover:border-gray-200"
                            } relative`}
                          >
                            <soc.icon
                              size={22}
                              color={
                                activeSocial === soc.id
                                  ? "#fff"
                                  : socialLinks[soc.id]
                                    ? soc.color
                                    : "currentColor"
                              }
                            />
                            {socialLinks[soc.id] && activeSocial !== soc.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"
                              />
                            )}
                          </motion.button>
                        ))}
                      </div>

                      {/* Dynamic Social Input */}
                      <div className="min-h-[80px]">
                        <AnimatePresence mode="wait">
                          {activeSocial ? (
                            <motion.div
                              key={activeSocial}
                              initial={{ y: 10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -10, opacity: 0 }}
                              className="relative group"
                            >
                              <div
                                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${!validateSocial(activeSocial, socialLinks[activeSocial]) ? "text-red-400" : "text-gray-300"}`}
                              >
                                {(() => {
                                  const Icon =
                                    SOCIALS.find((s) => s.id === activeSocial)
                                      ?.icon || IconWorld;
                                  return <Icon size={18} />;
                                })()}
                              </div>
                              <input
                                autoFocus
                                type="text"
                                value={socialLinks[activeSocial]}
                                onChange={(e) =>
                                  handleSocialChange(
                                    activeSocial,
                                    e.target.value,
                                  )
                                }
                                placeholder={
                                  activeSocial === "linkedin"
                                    ? "linkedin.com/in/handle"
                                    : activeSocial === "twitter"
                                      ? "@handle"
                                      : `Your ${activeSocial} handle...`
                                }
                                className={`w-full pl-11 pr-16 py-3 bg-gray-50/50 border-2 rounded-xl text-sm font-bold transition-all placeholder:text-gray-200 focus:outline-none focus:ring-0 ${
                                  !validateSocial(
                                    activeSocial,
                                    socialLinks[activeSocial],
                                  )
                                    ? "border-red-100 focus:border-red-400"
                                    : "border-transparent focus:border-black"
                                }`}
                              />
                              {!validateSocial(
                                activeSocial,
                                socialLinks[activeSocial],
                              ) && (
                                <span className="absolute -bottom-5 left-1 text-[10px] font-bold text-red-500 uppercase tracking-tight">
                                  Enter a valid {activeSocial}{" "}
                                  {activeSocial === "linkedin"
                                    ? "link"
                                    : "format"}
                                </span>
                              )}
                              <button
                                onClick={() => setActiveSocial(null)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-tight focus:outline-none focus:ring-0"
                              >
                                Done
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl py-8 group hover:border-gray-300 transition-colors cursor-pointer focus:outline-none focus:ring-0"
                              onClick={() => setActiveSocial("twitter")}
                            >
                              <p className="text-[12px] font-bold text-gray-300 group-hover:text-gray-400 transition-colors flex items-center gap-2">
                                <span>Connect your presence</span>
                                <IconArrowRight size={12} />
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Bio Area */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[10px] font-semibold text-gray-400  tracking-[0.2em]">
                            Bio & Identity
                          </label>
                          <span className="text-[10px] font-bold text-gray-300">
                            {bio.length}/160
                          </span>
                        </div>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value.slice(0, 160))}
                          placeholder="Designer by day, builder by night..."
                          rows={3}
                          className="w-full p-4 bg-white border-3  border-gray-100  rounded-[10px] text-[14px] font-normal focus:outline-none focus:border-gray-200 transition-all resize-none shadow-xs placeholder:text-gray-300 focus:ring-0"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {currentStep > 1 && (
                    <button
                      onClick={handleBack}
                      className="w-10 h-10 rounded-lg border border-gray-50 flex items-center justify-center hover:bg-gray-50 transition-all text-gray-400 hover:text-black cursor-pointer shadow-xs focus:outline-none focus:ring-0"
                    >
                      <IconArrowLeft size={16} stroke={4} />
                    </button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleContinue}
                    disabled={
                      loading ||
                      (currentStep === 1 &&
                        (usernameStatus !== "available" ||
                          username.length < 3)) ||
                      (currentStep === 2 && selectedSkills.length === 0) ||
                      (currentStep === 3 &&
                        !Object.entries(socialLinks).every(([id, val]) =>
                          validateSocial(id, val),
                        ))
                    }
                    className="flex-1 bg-black text-white h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:outline-2 hover:outline-gray-200 transition-all disabled:opacity-20 cursor-pointer shadow-lg shadow-black/5 focus:outline-none focus:ring-0"
                  >
                    {loading ? (
                      <IconLoader2 className="animate-spin" size={14} />
                    ) : (
                      <>
                        <span>
                          {currentStep === 3 ? "Complete Profile" : "Continue"}
                        </span>
                        <IconArrowRight size={14} stroke={4} />
                      </>
                    )}
                  </motion.button>
                  <button
                    onClick={() => saveProfile(true)}
                    className="text-[11px] font-black text-gray-400 hover:text-black px-2 transition-all focus:outline-none focus:ring-0"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Skip
                      <IconArrowRight size={14} stroke={4} />
                    </span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
