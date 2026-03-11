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
    <div className="w-full bg-[#E5E7EB] dark:bg-[#18181B] flex justify-between sticky top-0 z-50 pt-2 lg:pt-2 pr-2 md:pr-6">
      <div className="flex w-full">
        <div className="flex items-center justify-center px-6 rounded-tr-2xl bg-white relative shrink-0">
          <Icon3dCubeSphere size={35}/>
          <div className="absolute left-[83px] bottom-0  w-3 h-3 bg-transparent rounded-bl-full shadow-[-4px_4px_0_4px_#ffffff] dark:shadow-[-4px_4px_0_4px_#000000]" />
        </div>

        <nav className="flex items-end gap-1 md:gap-2 max-w-5xl w-full px-2 md:px-6 relative"> 
          {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setActiveTab(item.href)}
              className={`relative px-3 md:px-5 py-2.5 md:py-3 flex items-center gap-2 transition-colors z-10 font-medium ${
                isActive
                  ? "text-black dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {isActive && mounted && (
                <motion.div
                  layoutId="active-nav-tab"
                  className="absolute inset-x-0 inset-y-0 bg-white dark:bg-black rounded-t-xl md:rounded-t-2xl shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_15px_-3px_rgba(255,255,255,0.02)]"
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
                  <div className="absolute -left-3 bottom-0 w-3 h-3 bg-transparent rounded-br-full shadow-[4px_4px_0_4px_#ffffff] dark:shadow-[4px_4px_0_4px_#000000]" />
                  {/* Right curve connecting to background */}
                  <div className="absolute -right-3 bottom-0 w-3 h-3 bg-transparent rounded-bl-full shadow-[-4px_4px_0_4px_#ffffff] dark:shadow-[-4px_4px_0_4px_#000000]" />
                </motion.div>
              )}

              <item.icon stroke={isActive ? 2 : 1.5} className="w-5 h-5 md:w-5 md:h-5" />
              <span className="hidden md:block text-sm md:text-base">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      </div>

      <ProfileDropdown />
    </div>
  );
}
