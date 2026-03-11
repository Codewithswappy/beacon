"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  IconUser,
  IconSelector,
  IconLogout,
  IconUserPlus,
  IconSwitchHorizontal,
} from "@tabler/icons-react";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function ProfileDropdown() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className="flex items-center self-center mb-1 relative shrink-0 pl-4" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center justify-center gap-2 p-1 pr-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all cursor-pointer group active:scale-95 duration-200"
      >
        <div className="w-10 h-10 rounded-full bg-linear-to-b from-[#adadad] to-[#e3d1cda3] flex items-center justify-center text-lg leading-none shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1),0_2px_5px_rgba(0,0,0,0.05)] cursor-default relative z-10 select-none">
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.4}
            dragSnapToOrigin={true}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.15, cursor: "grabbing" }}
            transition={{ type: "spring", bounceStiffness: 600, bounceDamping: 10 }}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1),0_3px_6px_rgba(0,0,0,0.15)] cursor-grab overflow-hidden ${!avatarUrl ? 'bg-linear-to-b from-[#ffd194] to-[#ffb19da3] pb-[2px]' : 'bg-gray-100 dark:bg-gray-800'}`}
            onClick={(e) => {
              // Only let button handle the click if it wasn't a long drag interaction
              e.stopPropagation();
              setIsDropdownOpen((prev) => !prev);
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="User avatar" className="w-full h-full object-cover pointer-events-none" />
            ) : (
              <IconUser size={24} fill="#6e6e6e" strokeWidth={3} strokeOpacity={0.3} className="pointer-events-none" />
            )}
          </motion.div>
        </div>
        <motion.div 
          animate={{ rotate: isDropdownOpen ? 180 : 0, scale: isDropdownOpen ? 1.05 : 1, y: isDropdownOpen ? 1 : 0 }} 
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
              opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
              transition: { 
                type: "spring", 
                stiffness: 400, 
                damping: 30, 
                mass: 0.8,
                staggerChildren: 0.04, 
                delayChildren: 0.02
              }
            }}
            exit={{ 
              opacity: 0, y: -8, scale: 0.96, filter: "blur(4px)",
              transition: { ease: "easeInOut", duration: 0.15 }
            }}
            className="absolute top-[calc(100%+6px)] right-0 w-48 bg-white/95 dark:bg-[#1E1E20]/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-[20px] shadow-[0_15px_35px_-10px_rgba(0,0,0,0.15)] p-1.5 z-100 origin-top-right overflow-hidden flex flex-col"
          >
            <motion.div 
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              className="px-2.5 py-1.5 mb-0.5"
            >
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Account Settings</span>
            </motion.div>
            
            <motion.button 
              initial={{ opacity: 0, x: -10, filter: "blur(4px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              whileHover={{ scale: 1.02, x: 2 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5" 
              onClick={() => setIsDropdownOpen(false)}
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500">
                <IconUserPlus size={14} stroke={2.5} />
              </div>
              <span>Add Account</span>
            </motion.button>
            
            <motion.button 
              initial={{ opacity: 0, x: -10, filter: "blur(4px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              whileHover={{ scale: 1.02, x: 2 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5" 
              onClick={() => setIsDropdownOpen(false)}
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500">
                <IconSwitchHorizontal size={14} stroke={2.5} />
              </div>
              <span>Switch Account</span>
            </motion.button>
            
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-px bg-gray-100 dark:bg-gray-800/80 my-1 mx-2" />
            
            <motion.button 
              initial={{ opacity: 0, x: -10, filter: "blur(4px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              whileHover={{ scale: 1.02, x: 2 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setIsDropdownOpen(false); handleSignOut(); }}
              className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <div className="flex items-center justify-center w-7 h-7 text-red-500/80 dark:text-red-400/80">
                <IconLogout size={16} stroke={2.5} />
              </div>
              Log Out
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
