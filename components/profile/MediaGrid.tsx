"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { DuoIcon } from "@/components/ui/DuoIcon";

const SHOTS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564",
  "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=2070",
  "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2074",
  "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070",
  "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=2070",
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070",
  "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=2232",
  "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029",
];

export function MediaGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {SHOTS.map((url, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: idx * 0.05 }}
          viewport={{ once: true, margin: "100px" }}
          className="group bg-surface border-border relative aspect-4/3 cursor-pointer overflow-hidden rounded-2xl border"
        >
          {/* Main Image with build-in lazy loading */}
          <Image
            src={url}
            alt={`Shot ${idx}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />

          <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/40 font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex translate-y-2 transform items-center gap-1.5 transition-transform duration-300 group-hover:translate-y-0">
              <DuoIcon name="heart" size={20} className="text-white" />
              <span>{Math.floor(Math.random() * 500) + 120}</span>
            </div>
            <div className="flex translate-y-2 transform items-center gap-1.5 transition-transform delay-50 duration-300 group-hover:translate-y-0">
              <DuoIcon name="search" size={20} className="text-white" />
              <span>{(Math.random() * 20 + 2).toFixed(1)}k</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
