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
    <div className="w-full bg-nav-bg flex justify-between sticky top-0 z-50 pt-1">
      {/* Left side: Logo and Navigation Links */}
      <div className="flex flex-1 items-end min-w-0 pr-4">
        <div className="flex items-center justify-center px-6 rounded-tr-3xl bg-background relative shrink-0 self-stretch z-10">
          <Icon3dCubeSphere size={35} />
          <svg
            className="absolute right-[-23px] -bottom-0.5 md:bottom-0 w-6 h-6 text-background -scale-x-100"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M24 24H0C13.255 24 24 13.255 24 0V24Z" />
          </svg>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 md:static flex items-start md:items-end justify-around md:justify-start gap-0 md:gap-2 w-full px-0 md:pl-[46px] md:pr-4 pb-0 md:pb-0 bg-nav-bg md:bg-transparent z-40 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {NAV_ITEMS.map((item, index) => {
            const isActive = activeTab === item.href;
            const isFirst = index === 0;
            const isLast = index === NAV_ITEMS.length - 1;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setActiveTab(item.href)}
                className={`relative ${isActive ? "max-md:flex-[1.15]" : "max-md:flex-1"} flex-1 md:flex-none px-2 md:px-5 pb-[calc(16px+env(safe-area-inset-bottom))] md:pb-3 pt-4 md:pt-3 flex items-center justify-center gap-2 z-10 font-medium whitespace-nowrap transition-colors duration-300 ${
                  isActive
                    ? "text-foreground"
                    : "text-muted hover:text-foreground/80"
                }`}
              >
                {isActive && mounted && (
                  <motion.div
                    layoutId="active-nav-tab"
                    className={`absolute inset-x-0 inset-y-0 bg-background md:rounded-b-none md:rounded-t-3xl drop-shadow-[0_8px_8px_rgba(0,0,0,0.05)] md:drop-shadow-[0_-5px_10px_rgba(0,0,0,0.06)] dark:drop-shadow-none ${isFirst ? "max-md:rounded-b-3xl max-md:rounded-bl-none" : isLast ? "max-md:rounded-b-3xl max-md:rounded-br-none" : "max-md:rounded-b-3xl"}`}
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
                    <svg
                      className={`absolute w-6 h-6 text-background -left-6 top-0 -scale-y-100 md:scale-y-100 md:bottom-0 md:top-auto ${isFirst ? "max-md:hidden" : ""}`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 24H0C13.255 24 24 13.255 24 0V24Z" />
                    </svg>
                    {/* Right curve connecting to background */}
                    <svg
                      className={`absolute w-6 h-6 text-background -right-6 top-0 -scale-y-100 -scale-x-100 md:scale-y-100 md:-scale-x-100 md:bottom-0 md:top-auto ${isLast ? "max-md:hidden" : ""}`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 24H0C13.255 24 24 13.255 24 0V24Z" />
                    </svg>
                  </motion.div>
                )}

                <item.icon
                  stroke={isActive ? 2 : 1.5}
                  className="w-6 h-6 md:w-5 md:h-5 shrink-0"
                />
                <span className="hidden md:block text-sm md:text-base">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right side: Profile Dropdown */}
      <div className="flex items-center justify-end pt-1 pr-4 md:pr-6 relative z-50 shrink-0">
        <ProfileDropdown />
      </div>
    </div>
  );
}
