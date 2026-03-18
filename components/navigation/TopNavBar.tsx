"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Icon3dCubeSphere,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { ProfileDropdown } from "./ProfileDropdown";
import { AnimatePresence } from "motion/react";
import { DuoIcon } from "@/components/ui/DuoIcon";

const NAV_ITEMS = [
  { name: "Home", href: "/", icon: "home" },
  { name: "Explore", href: "/explore", icon: "explore" },
  { name: "Shots", href: "/shots", icon: "shots" },
  { name: "Profile", href: "/profile", icon: "userCircle" },
  { name: "Bookmarks", href: "/bookmarks", icon: "bookmark" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

export function TopNavBar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(pathname);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isWaitLeave, setIsWaitLeave] = useState(false);

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

  const containerVariants: any = {
    hidden: {
      width: 0,
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
        when: "afterChildren",
      },
    },
    visible: {
      width: "auto",
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: any = {
    hidden: {
      opacity: 0,
      x: -15,
      scale: 0.9,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
      },
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 24,
        mass: 0.5,
      },
    },
  };

  // To seamlessly connect to the page content, the active tab should share the exact background color
  // as the page below it. The page defaults to white (light mode) or black (dark mode).

  // Determine final visibility
  // 1. If Pinned (Visible) -> Show
  // 2. If Unpinned -> Show ONLY if Hovered AND we aren't waiting for the mouse to leave after a manual close
  const showNav = isNavbarVisible || (isHovered && !isWaitLeave);

  return (
    <div
      className={`sticky top-0 z-50 flex w-full justify-between pt-1 transition-colors duration-500 ease-in-out ${
        isNavbarVisible
          ? "md:bg-nav-bg bg-background"
          : isHovered && !isWaitLeave
            ? "bg-nav-bg"
            : "bg-background"
      }`}
    >
      {/* Left side: Logo and Navigation Links */}
      <div className="flex min-w-0 flex-1 items-end pr-4">
        <div className="bg-background group relative z-10 flex shrink-0 items-center justify-center self-stretch rounded-tr-3xl pr-4 pl-6">
          <Icon3dCubeSphere size={35} />

          {/* Collapse Toggle Button - Always visible next to logo on desktop, hidden on mobile */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9, rotate: isNavbarVisible ? -10 : 190 }}
            onClick={() => {
              if (isNavbarVisible) {
                // If we are CLOSING it while mouse is there, prevent re-hovering
                setIsWaitLeave(true);
              }
              setIsNavbarVisible(!isNavbarVisible);
            }}
            className="hover:bg-surface text-muted hover:text-foreground z-50 ml-3 hidden cursor-pointer overflow-hidden rounded-lg p-1.5 transition-colors md:flex"
          >
            <motion.div
              animate={{
                rotate: isNavbarVisible ? 0 : 180,
                scale: isNavbarVisible ? 1 : 0.85,
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 22,
                mass: 0.8,
              }}
            >
              <DuoIcon name="sidebar" size={20} className="transition-transform group-hover:scale-105" />
            </motion.div>
          </motion.button>

          <svg
            className="text-background absolute right-[-23px] -bottom-0.5 h-6 w-6 -scale-x-100 md:bottom-0"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M24 24H0C13.255 24 24 13.255 24 0V24Z" />
          </svg>
        </div>

        {/* Middle Navigation - Hover Zone */}
        <div
          className="flex min-h-[58px] flex-1 items-end"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setIsWaitLeave(false);
          }}
        >
          <AnimatePresence mode="popLayout">
            {showNav && (
              <motion.div
                key="nav-links-container"
                className="flex items-end overflow-hidden"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <nav className="bg-nav-bg fixed right-0 bottom-0 left-0 z-40 flex w-full items-start justify-around gap-0 overflow-x-auto px-0 pb-0 [-ms-overflow-style:none] [scrollbar-width:none] md:static md:items-end md:justify-start md:gap-2 md:bg-transparent md:pr-4 md:pb-0 md:pl-[46px] [&::-webkit-scrollbar]:hidden">
                  {NAV_ITEMS.map((item, index) => {
                    const isActive = activeTab === item.href;
                    const isFirst = index === 0;
                    const isLast = index === NAV_ITEMS.length - 1;

                    return (
                      <motion.div
                        key={item.href}
                        variants={itemVariants}
                        className="flex-1 md:flex-none"
                      >
                        <Link
                          href={item.href}
                          onClick={() => setActiveTab(item.href)}
                          className={`relative w-full ${isActive ? "max-md:flex-[1.15]" : ""} z-10 flex items-center justify-center gap-2 px-2 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))] font-medium whitespace-nowrap transition-colors duration-300 md:px-5 md:pt-3 md:pb-3 ${
                            isActive
                              ? "text-foreground"
                              : "text-muted hover:text-foreground/80"
                          }`}
                        >
                          {isActive && mounted && (
                            <motion.div
                              layoutId="active-nav-tab"
                              className={`bg-background absolute inset-x-0 inset-y-0 drop-shadow-[0_8px_8px_rgba(0,0,0,0.05)] md:rounded-t-3xl md:rounded-b-none md:drop-shadow-[0_-5px_10px_rgba(0,0,0,0.06)] dark:drop-shadow-none ${isFirst ? "max-md:rounded-b-3xl max-md:rounded-bl-none" : isLast ? "max-md:rounded-b-3xl max-md:rounded-br-none" : "max-md:rounded-b-3xl"}`}
                              initial={false}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 25,
                                mass: 0.8,
                              }}
                              style={{ zIndex: -1 }}
                            >
                              <svg
                                className={`text-background absolute top-0 -left-6 h-6 w-6 -scale-y-100 md:top-auto md:bottom-0 md:scale-y-100 ${isFirst ? "max-md:hidden" : ""}`}
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M24 24H0C13.255 24 24 13.255 24 0V24Z" />
                              </svg>
                              <svg
                                className={`text-background absolute top-0 -right-6 h-6 w-6 -scale-x-100 -scale-y-100 md:top-auto md:bottom-0 md:-scale-x-100 md:scale-y-100 ${isLast ? "max-md:hidden" : ""}`}
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M24 24H0C13.255 24 24 13.255 24 0V24Z" />
                              </svg>
                            </motion.div>
                          )}
                          <DuoIcon
                            name={item.icon as any}
                            size={isActive ? 22 : 20}
                            className={`shrink-0 transition-all ${isActive ? "text-foreground scale-110" : "text-neutral-500 group-hover:text-foreground"}`}
                          />
                          <span className="hidden text-sm md:block md:text-base">
                            {item.name}
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right side: Profile Dropdown - Stays visible as requested */}
      <div className="relative z-50 flex shrink-0 items-center justify-end pt-1 pr-4 md:pr-6">
        <ProfileDropdown />
      </div>
    </div>
  );
}
