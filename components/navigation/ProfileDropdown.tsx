"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  IconSelector,
  IconSwitchHorizontal,
  IconSun,
  IconMoon,
  IconDeviceDesktop,
} from "@tabler/icons-react";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { DuoIcon } from "@/components/ui/DuoIcon";

export function ProfileDropdown() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [themeMounted, setThemeMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div
      className="relative mb-1 flex shrink-0 items-center self-center pl-4"
      ref={dropdownRef}
    >
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="group box-shadow: rgba(255, 255, 255, 0.4) 0px 0px 0px 1px inset, rgb(255, 255, 255) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.08) 0px 0px 0px 0.5px; opacity: 1; flex cursor-pointer items-center justify-center gap-2 rounded-full bg-black/5 p-1 pr-2.5 transition-all duration-200 hover:bg-black/10 active:scale-95 dark:bg-white/5 dark:hover:bg-white/10"
      >
        <div className="relative z-10 flex h-10 w-10 cursor-default items-center justify-center rounded-full bg-linear-to-b from-[#adadad] to-[#e3d1cda3] text-lg leading-none shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1),0_2px_5px_rgba(0,0,0,0.05)] select-none">
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.4}
            dragSnapToOrigin={true}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.15, cursor: "grabbing" }}
            transition={{
              type: "spring",
              bounceStiffness: 600,
              bounceDamping: 10,
            }}
            className={`flex h-8 w-8 cursor-grab items-center justify-center overflow-hidden rounded-full text-lg leading-none shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1),0_3px_6px_rgba(0,0,0,0.15)] ${!avatarUrl ? "bg-linear-to-b from-[#ffd194] to-[#ffb19da3] pb-[2px]" : "bg-gray-100 dark:bg-gray-800"}`}
            onClick={(e) => {
              // Only let button handle the click if it wasn't a long drag interaction
              e.stopPropagation();
              setIsDropdownOpen((prev) => !prev);
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="User avatar"
                className="pointer-events-none h-full w-full object-cover"
                onError={() => setAvatarUrl(null)}
              />
            ) : (
              <DuoIcon
                name="userDefault"
                size={16}
                className="text-gray-400 translate-y-px"
              />
            )}
          </motion.div>
        </div>
        <motion.div
          animate={{
            rotate: isDropdownOpen ? 180 : 0,
            scale: isDropdownOpen ? 1.05 : 1,
            y: isDropdownOpen ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="text-gray-500 group-hover:text-gray-800 dark:group-hover:text-gray-200"
        >
          <IconSelector size={18} stroke={2.5} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96, filter: "blur(4px)" }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.8,
                staggerChildren: 0.04,
                delayChildren: 0.02,
              },
            }}
            exit={{
              opacity: 0,
              y: -8,
              scale: 0.96,
              filter: "blur(4px)",
              transition: { ease: "easeInOut", duration: 0.15 },
            }}
            className="absolute top-[calc(100%+6px)] right-0 z-100 flex w-48 origin-top-right flex-col overflow-hidden rounded-[20px] border border-gray-200/50 bg-white/95 p-1.5 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.15)] backdrop-blur-xl dark:border-gray-800/50 dark:bg-[#1E1E20]/95"
          >
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-0.5 px-2.5 py-1.5"
            >
              <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase dark:text-gray-500">
                Account Settings
              </span>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              className="flex cursor-pointer items-center gap-2.5 rounded-2xl px-2.5 py-1.5 text-left text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 focus:ring-2 focus:ring-black/5 focus:outline-none dark:text-gray-200 dark:hover:bg-white/10 dark:focus:ring-white/5"
              onClick={() => setIsDropdownOpen(false)}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/10">
                <DuoIcon name="plusCircle" size={14} />
              </div>
              <span>Add Account</span>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              className="flex cursor-pointer items-center gap-2.5 rounded-2xl px-2.5 py-1.5 text-left text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 focus:ring-2 focus:ring-black/5 focus:outline-none dark:text-gray-200 dark:hover:bg-white/10 dark:focus:ring-white/5"
              onClick={() => setIsDropdownOpen(false)}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/10">
                <IconSwitchHorizontal size={14} stroke={2.5} />
              </div>
              <span>Switch Account</span>
            </motion.button>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-2 my-1 h-px bg-gray-100 dark:bg-gray-800/80"
            />

            {/* Theme Toggle */}
            <motion.button
              initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (theme === "light") setTheme("dark");
                else if (theme === "dark") setTheme("system");
                else setTheme("light");
              }}
              className="flex cursor-pointer items-center gap-2.5 rounded-2xl px-2.5 py-1.5 text-left text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none dark:text-gray-200 dark:hover:bg-white/10"
            >
              <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400">
                <AnimatePresence mode="wait" initial={false}>
                  {themeMounted && theme === "dark" ? (
                    <motion.div
                      key="moon"
                      initial={{ y: 12, rotate: 90, opacity: 0 }}
                      animate={{ y: 0, rotate: 0, opacity: 1 }}
                      exit={{ y: -12, rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <IconMoon size={14} stroke={2.5} />
                    </motion.div>
                  ) : themeMounted && theme === "light" ? (
                    <motion.div
                      key="sun"
                      initial={{ y: 12, rotate: -90, opacity: 0 }}
                      animate={{ y: 0, rotate: 0, opacity: 1 }}
                      exit={{ y: -12, rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <IconSun size={14} stroke={2.5} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="system"
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -12, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <IconDeviceDesktop size={14} stroke={2.5} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span>
                {themeMounted
                  ? theme === "dark"
                    ? "Dark Mode"
                    : theme === "light"
                      ? "Light Mode"
                      : "System"
                  : "Theme"}
              </span>
            </motion.button>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-2 my-1 h-px bg-gray-100 dark:bg-gray-800/80"
            />

            <motion.button
              initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsDropdownOpen(false);
                handleSignOut();
              }}
              className="flex cursor-pointer items-center gap-2.5 rounded-2xl px-2.5 py-1.5 text-left text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 focus:ring-2 focus:ring-red-500/20 focus:outline-none dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <div className="flex h-7 w-7 items-center justify-center text-red-500/80 dark:text-red-400/80">
                <DuoIcon name="logout" size={16} />
              </div>
              Log Out
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
