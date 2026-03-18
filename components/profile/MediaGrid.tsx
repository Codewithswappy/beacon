"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CloudinaryImage } from "@/components/ui/CloudinaryImage";
import { DuoIcon } from "@/components/ui/DuoIcon";

// Mocking Cloudinary publicIds to represent the user's uploaded work
const SHOTS = [
  { publicId: "samples/balloons", width: 1920, height: 1280 },
  { publicId: "samples/animals/kitten-playing", width: 300, height: 200 },
  { publicId: "samples/ecommerce/accessories-bag", width: 1000, height: 1000 },
  { publicId: "samples/ecommerce/leather-bag-gray", width: 1000, height: 1000 },
  { publicId: "samples/food/spices", width: 1000, height: 667 },
  { publicId: "samples/landscapes/nature-mountains", width: 1920, height: 1280 },
];

export function MediaGrid() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {SHOTS.map((item, idx) => {
        // Compute strict aspect ratio (or default to 4/3 for visual uniformity if we prefer)
        const aspectRatio = "4/3"; // You could also use: `${item.width}/${item.height}` array-wise

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
            viewport={{ once: true, margin: "100px" }}
            className="group bg-surface relative aspect-4/3 cursor-pointer overflow-hidden rounded-2xl border border-white/5 beacon-shadow"
          >
            <CloudinaryImage
              cloudName={cloudName}
              publicId={item.publicId}
              context="card"     // Load the w_800 responsive sizing
              alt={`Project ${idx}`}
              fill               // Handled internally by CloudinaryImage wrapper
              className="transition-transform duration-700 ease-out group-hover:scale-110"
              priority={idx < 3} // Priority preload the top row
            />

            {/* Hover overlay stats */}
            <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/40 font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex translate-y-2 transform items-center gap-1.5 transition-transform duration-300 group-hover:translate-y-0 delay-75">
                <DuoIcon name="heart" size={20} className="text-white" />
                <span>{Math.floor(Math.random() * 500) + 120}</span>
              </div>
              <div className="flex translate-y-2 transform items-center gap-1.5 transition-transform duration-300 group-hover:translate-y-0 delay-100">
                <DuoIcon name="mail" size={20} className="text-white" />
                <span>{(Math.random() * 20 + 2).toFixed(1)}k</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
