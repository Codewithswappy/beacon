"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconCompass,
  IconCamera,
  IconUser,
  IconBookmark,
  IconSettings,
  Icon3dCubeSphere,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { ProfileDropdown } from "./ProfileDropdown";

const NAV_ITEMS = [
  { name: "Home", href: "/", icon: IconHome },
  { name: "Explore", href: "/explore", icon: IconCompass },
  { name: "Shots", href: "/shots", icon: IconCamera },
  { name: "Profile", href: "/profile", icon: IconUser },
  { name: "Bookmarks", href: "/bookmarks", icon: IconBookmark },
  { name: "Settings", href: "/settings", icon: IconSettings },
];

export function TopNavBar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  // Don't render nav on auth pages
  if (pathname === "/login" || pathname === "/onboarding") {
    return null;
  }

  // To seamlessly connect to the page content, the active tab should share the exact background color 
  // as the page below it. The page defaults to white (light mode) or black (dark mode).
  
  return (
    <div className="w-full bg-[#E5E7EB] dark:bg-[#18181B] flex justify-between sticky top-0 z-50 pt-0 lg:pt-0">
      {/* Left side: Logo and Navigation Links */}
      <div className="flex flex-1 items-end min-w-0 pr-4 bg-white md:bg-transparent">
        <div className="flex items-center justify-center px-6 rounded-tr-2xl bg-white dark:bg-black relative shrink-0 self-stretch">
          <Icon3dCubeSphere size={35}/>
          <svg className="absolute right-[-12px] bottom-0 w-3 h-3 text-white dark:text-black -scale-x-100" fill="currentColor" viewBox="0 0 12 12">
            <path d="M12 12H0C6.627 12 12 6.627 12 0V12Z" />
          </svg>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 md:static flex items-start md:items-end justify-around md:justify-start gap-1 md:gap-2 w-full px-2 md:px-4 pb-1 md:pb-0 bg-[#E5E7EB] dark:bg-[#18181B] md:bg-transparent z-40 overflow-x-auto scrollbar-hide"> 
          {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setActiveTab(item.href)}
              className={`relative flex-1 md:flex-none px-2 md:px-5 pb-[calc(16px+env(safe-area-inset-bottom))] md:pb-3 pt-4 md:pt-3 flex items-center justify-center gap-2 transition-colors z-10 font-medium whitespace-nowrap ${
                isActive
                  ? "text-black dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {isActive && mounted && (
                <motion.div
                  layoutId="active-nav-tab"
                  className="absolute inset-x-0 inset-y-0 bg-white dark:bg-black rounded-b-2xl md:rounded-b-none md:rounded-t-2xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] md:shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_15px_-3px_rgba(255,255,255,0.02)] md:dark:shadow-[0_-10px_15px_-3px_rgba(255,255,255,0.02)]"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    mass: 0.8,
                  }}
                  style={{ zIndex: -1 }}
                >
                  {/* Left curve connecting to background */}
                  <svg className="absolute w-3 h-3 text-white dark:text-black -left-3 top-0 -scale-y-100 md:scale-y-100 md:bottom-0 md:top-auto" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M12 12H0C6.627 12 12 6.627 12 0V12Z" />
                  </svg>
                  {/* Right curve connecting to background */}
                  <svg className="absolute w-3 h-3 text-white dark:text-black -right-3 top-0 -scale-y-100 -scale-x-100 md:scale-y-100 md:-scale-x-100 md:bottom-0 md:top-auto" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M12 12H0C6.627 12 12 6.627 12 0V12Z" />
                  </svg>
                </motion.div>
              )}

              <item.icon stroke={isActive ? 2 : 1.5} className="w-6 h-6 md:w-5 md:h-5 shrink-0" />
              <span className="hidden md:block text-sm md:text-base">{item.name}</span>
            </Link>
          );
        })}
        </nav>
      </div>

      {/* Right side: Profile Dropdown */}
      <div className="flex items-center justify-end pt-1 pr-4 md:pr-6 relative z-50 bg-white md:bg-transparent shrink-0">
        <ProfileDropdown />
      </div>
    </div>
  );
}
