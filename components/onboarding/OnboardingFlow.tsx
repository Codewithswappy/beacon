"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence, easeIn } from "motion/react";
import { debounce } from "lodash";
import { useRouter } from "next/navigation";
import { DuoIcon } from "@/components/ui/DuoIcon";
import { Icon3dCubeSphere } from "@tabler/icons-react";

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
  {
    id: "twitter",
    icon: "x",
    label: "Twitter",
    color: "var(--foreground)",
  },
  {
    id: "github",
    icon: "github",
    label: "GitHub",
    color: "var(--foreground)",
  },
  {
    id: "linkedin",
    icon: "linkedin",
    label: "LinkedIn",
    color: "#0077B5",
  },
  { id: "website", icon: "userCircle", label: "Website", color: "#10b981" },
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

  // Fetch User and check completion
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, avatar_url")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push("/");
      }

      if (profile?.avatar_url) {
        setUserAvatar(profile.avatar_url);
      } else if (user?.user_metadata?.avatar_url) {
        setUserAvatar(user.user_metadata.avatar_url);
      }
    };
    checkUser();
  }, [supabase, router]);

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
    [supabase]
  );

  useEffect(() => {
    if (username) checkUsername(username);
    else setUsernameStatus("idle");
  }, [username, checkUsername]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
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
            val
          )
        );

      case "linkedin":
        // LinkedIn handles are too variable, so we strictly enforce the profile URL format
        return /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company|school|me)\/[A-Za-z0-9-]{3,100}\/?$/.test(
          val
        );

      case "website":
        return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(
          val
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
        validateSocial(id, val)
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
    <div className="pointer-events-none absolute inset-0 z-100 flex items-center justify-center overflow-visible">
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
          className="absolute h-1 w-1 rounded-full bg-black dark:bg-white"
        />
      ))}
    </div>
  );

  return (
    <div className="dark:bg-background dark:text-foreground [WebkitTapHighlightColor:transparent] flex min-h-screen flex-col overflow-hidden bg-white font-sans tracking-tight text-gray-900 transition-colors duration-300 select-none">
      {/* Warm Gradient Spots */}
      <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
        <div className="absolute top-[20%] left-[-10%] h-[20%] w-[30%] bg-amber-300/20 blur-[100px] dark:bg-amber-800/10" />
        <div className="absolute bottom-[20%] left-[-10%] h-[30%] w-[30%] bg-cyan-400/20 blur-[100px] dark:bg-cyan-800/10" />
        <div className="absolute right-[-10%] bottom-[10%] h-[30%] w-[30%] bg-rose-400/20 blur-[100px] dark:bg-rose-800/10" />
      </div>

      <header className="fixed top-0 left-0 z-50 flex w-full items-center justify-between px-6 py-6 md:px-12 md:py-8">
        <div className="flex items-center gap-2">
         <Icon3dCubeSphere
            size={34}
            className="text-black dark:text-white"
          />
          <span className="text-lg font-bold tracking-tighter md:text-xl">
            Beacon
          </span>
        </div>
        <div className="flex items-center gap-3">
          {userAvatar ? (
            <div className="dark:border-border dark:bg-surface h-12 w-12 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-50 shadow-sm ring-1 shadow-black/10 ring-black/10 dark:ring-white/10">
              <img
                src={userAvatar}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="dark:bg-surface dark:border-border h-8 w-8 rounded-full border border-gray-100 bg-gray-50 shadow-sm" />
          )}
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-start px-6 pt-28 md:flex-row md:gap-20 md:px-10 md:pt-40">
        {/* PROGRESS SIDEBAR: RESPONSIVE LIQUID */}
        <aside className="mb-12 w-full shrink-0 pt-2 md:mb-0 md:w-[160px]">
          <p className="mb-8 hidden text-[9px] font-black tracking-widest text-gray-400 uppercase opacity-50 md:block">
            OnBoarding
          </p>
          <nav className="relative flex items-center justify-center md:flex-col md:items-start md:justify-start">
            {STEPS.map((step, idx) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div
                  key={step.id}
                  className="relative flex flex-1 flex-col items-center gap-2 last:pb-0 md:flex-none md:flex-row md:gap-4 md:pb-8"
                >
                  {/* Connecting Line with Liquid Pulse */}
                  {idx !== STEPS.length - 1 && (
                    <div className="absolute top-2.5 left-1/2 h-px w-[calc(100%-20px)] translate-x-[15px] -translate-y-1/2 overflow-hidden bg-gray-50 md:top-6 md:left-[9.5px] md:h-full md:w-px md:translate-x-0 md:translate-y-0">
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
                            className="absolute top-0 left-0 h-full w-full bg-linear-to-r from-transparent via-black/20 to-transparent md:bg-linear-to-b"
                          />
                        )}
                      </motion.div>
                    </div>
                  )}

                  {/* Icon Marker with Ripple & Pop */}
                  <div className="relative z-10">
                    <motion.div
                      animate={{
                        backgroundColor: isCompleted
                          ? "#10b981"
                          : "var(--background)",
                        borderColor: isCompleted
                          ? "#10b981"
                          : isActive
                            ? "var(--foreground)"
                            : "var(--border)",
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
                      className="relative flex h-5 w-5 items-center justify-center overflow-visible rounded-full border-[1.5px] text-[9px] font-bold shadow-sm"
                    >
                      {/* Smooth Multi-Layer Ripple */}
                      {isActive && (
                        <div className="pointer-events-none absolute inset-0 overflow-visible">
                          {[0, 1].map((i) => (
                            <motion.div
                              key={i}
                              className="border-foreground/10 absolute inset-0 rounded-full border will-change-transform"
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
                            <DuoIcon
                              name="check"
                              size={12}
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
                            className="bg-foreground h-1.5 w-1.5 rounded-full"
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
                      className={`origin-left text-center text-[10px] font-bold transition-all md:text-left md:text-[12px] ${isActive ? "text-foreground" : "text-gray-300 dark:text-gray-600"}`}
                    >
                      {step.title}
                    </motion.span>
                    <motion.span
                      animate={{
                        opacity: isActive ? 1 : 0,
                        height: isActive ? "auto" : 0,
                      }}
                      className="hidden overflow-hidden text-[9px] font-semibold text-gray-400 md:block"
                    >
                      {step.sub}
                    </motion.span>
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="flex w-full flex-1 justify-center perspective-[1000px]">
          <div className="relative w-full max-w-[400px] px-1 md:max-w-[440px] md:px-0">
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
                      <h1 className="text-foreground text-[28px] leading-tight font-black tracking-tight">
                        Choose your handle.
                      </h1>
                      <p className="text-[14px] font-medium text-gray-400">
                        This is how people will find your work.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="relative">
                        <span className="absolute top-1/2 left-4 -translate-y-1/2 font-bold text-gray-300">
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
                                .replace(/[^a-z0-9_]/g, "")
                            )
                          }
                          placeholder="handle"
                          className={`dark:bg-surface w-full rounded-xl border bg-white py-3 pr-12 pl-8 text-base font-bold transition-all focus:ring-0 focus:outline-none ${
                            usernameStatus === "taken"
                              ? "border-red-100 focus:border-red-400"
                              : usernameStatus === "available"
                                ? "border-green-100 focus:border-green-400"
                                : "dark:border-border focus:border-foreground border-gray-50"
                          }`}
                        />
                        <div className="absolute top-1/2 right-4 -translate-y-1/2">
                          {usernameStatus === "checking" && (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-foreground" />
                          )}
                          {usernameStatus === "available" && (
                            <DuoIcon
                              name="check"
                              size={18}
                              className="text-green-500"
                            />
                          )}
                          {usernameStatus === "taken" && (
                            <DuoIcon
                              name="x"
                              size={18}
                              className="text-red-400"
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold text-gray-400">
                          beacon.com/{username || "..."}
                        </span>
                        {usernameStatus === "taken" && (
                          <span className="text-[9px] font-black tracking-widest text-red-500 uppercase">
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
                      <h1 className="text-foreground text-[28px] leading-tight font-black tracking-tight">
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
                          className={`rounded-lg border px-4 py-2 text-[12px] font-bold transition-all focus:ring-0 focus:outline-none ${selectedSkills.includes(skill) ? "bg-foreground text-background border-foreground" : "dark:bg-surface dark:text-muted dark:border-border hover:border-foreground border-gray-100 bg-white text-gray-500"}`}
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
                      <h1 className="text-foreground text-[28px] leading-tight font-black tracking-tight">
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
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-all ${
                              activeSocial === soc.id
                                ? "border-foreground bg-foreground text-background shadow-lg shadow-black/10 dark:shadow-white/5"
                                : "dark:border-border dark:bg-surface dark:text-muted dark:hover:border-foreground border-gray-50 bg-white text-gray-400 hover:border-gray-200"
                            } relative`}
                          >
                            <DuoIcon
                              name={soc.icon as any}
                              size={22}
                              className={
                                activeSocial === soc.id
                                  ? "text-inherit"
                                  : socialLinks[soc.id]
                                    ? ""
                                    : "text-inherit"
                              }
                              style={{
                                color: activeSocial === soc.id
                                  ? "currentColor"
                                  : socialLinks[soc.id]
                                    ? soc.color
                                    : "currentColor"
                              }}
                            />
                            {socialLinks[soc.id] && activeSocial !== soc.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="dark:border-background absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500"
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
                              className="group relative"
                            >
                              <div
                                className={`absolute top-1/2 left-4 -translate-y-1/2 transition-colors ${!validateSocial(activeSocial, socialLinks[activeSocial]) ? "text-red-400" : "text-gray-300"}`}
                              >
                                {(() => {
                                  const iconName =
                                    SOCIALS.find((s) => s.id === activeSocial)
                                      ?.icon || "userCircle";
                                  return <DuoIcon name={iconName as any} size={18} />;
                                })()}
                              </div>
                              <input
                                autoFocus
                                type="text"
                                value={socialLinks[activeSocial]}
                                onChange={(e) =>
                                  handleSocialChange(
                                    activeSocial,
                                    e.target.value
                                  )
                                }
                                placeholder={
                                  activeSocial === "linkedin"
                                    ? "linkedin.com/in/handle"
                                    : activeSocial === "twitter"
                                      ? "@handle"
                                      : `Your ${activeSocial} handle...`
                                }
                                className={`dark:bg-surface dark:placeholder:text-muted w-full rounded-xl border-2 bg-gray-50/50 py-3 pr-16 pl-11 text-sm font-bold transition-all placeholder:text-gray-200 focus:ring-0 focus:outline-none ${
                                  !validateSocial(
                                    activeSocial,
                                    socialLinks[activeSocial]
                                  )
                                    ? "border-red-100 focus:border-red-400"
                                    : "focus:border-foreground border-transparent"
                                }`}
                              />
                              {!validateSocial(
                                activeSocial,
                                socialLinks[activeSocial]
                              ) && (
                                <span className="absolute -bottom-5 left-1 text-[10px] font-bold tracking-tight text-red-500 uppercase">
                                  Enter a valid {activeSocial}{" "}
                                  {activeSocial === "linkedin"
                                    ? "link"
                                    : "format"}
                                </span>
                              )}
                              <button
                                onClick={() => setActiveSocial(null)}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-black tracking-tight text-gray-400 uppercase hover:text-black focus:ring-0 focus:outline-none dark:hover:text-white"
                              >
                                Done
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="dark:border-border group dark:hover:border-muted flex h-full cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-8 transition-colors hover:border-gray-300 focus:ring-0 focus:outline-none"
                              onClick={() => setActiveSocial("twitter")}
                            >
                              <p className="dark:text-muted/50 dark:group-hover:text-muted flex items-center gap-2 text-[12px] font-bold text-gray-400/50 transition-colors group-hover:text-gray-600">
                                <span>Connect your presence</span>
                                <DuoIcon name="arrowRight" size={14} />
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Bio Area */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[10px] font-semibold tracking-[0.2em] text-gray-400">
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
                          className="dark:bg-surface dark:border-border dark:focus:border-foreground dark:placeholder:text-muted w-full resize-none rounded-[10px] border-3 border-gray-100 bg-white p-4 text-[14px] font-normal shadow-xs transition-all placeholder:text-gray-300 focus:border-gray-200 focus:ring-0 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {currentStep > 1 && (
                    <button
                      onClick={handleBack}
                      className="dark:border-border dark:hover:bg-surface-hover hover:text-foreground flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-gray-50 text-gray-400 shadow-xs transition-all hover:bg-gray-50 focus:ring-0 focus:outline-none"
                    >
                      <DuoIcon name="chevronLeft" size={18} />
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
                          validateSocial(id, val)
                        ))
                    }
                    className="bg-foreground text-background flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg text-xs font-bold shadow-lg shadow-black/5 transition-all hover:outline-2 hover:outline-gray-200 focus:ring-0 focus:outline-none disabled:opacity-20 dark:hover:outline-gray-700"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background/30 border-t-background" />
                    ) : (
                      <>
                        <span>
                          {currentStep === 3 ? "Complete Profile" : "Continue"}
                        </span>
                        <DuoIcon name="arrowRight" size={16} />
                      </>
                    )}
                  </motion.button>
                  <button
                    onClick={() => saveProfile(true)}
                    className="hover:text-foreground px-2 text-[11px] font-black text-gray-400 transition-all focus:ring-0 focus:outline-none"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Skip
                      <DuoIcon name="arrowRight" size={16} />
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
