"use client";

import { motion } from "motion/react";
import { useState } from "react";

const TABS = ["Posts", "Featured", "Liked"];

export function ProfileTabs() {
  const [activeTab, setActiveTab] = useState("Posts");

  return (
    <div className="bg-neutral-100/50 dark:bg-neutral-900/50 mb-8 inline-flex items-center gap-1.5 rounded-2xl p-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] backdrop-blur-md border-2 border-neutral-100/30 dark:border-neutral-800/30 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative flex items-center justify-center rounded-xl px-7 py-2 text-[14px] font-bold whitespace-nowrap transition-all duration-300 focus:outline-none ${
              isActive
                ? "text-black dark:text-white"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="profile-tab-capsule"
                className="absolute inset-0 z-0 bg-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12),0_2px_4px_-1px_rgba(0,0,0,0.06)] border border-neutral-200/50 dark:bg-neutral-800 dark:border-neutral-700/50 dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
                initial={false}
                style={{ borderRadius: 12 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        );
      })}
    </div>
  );
}
