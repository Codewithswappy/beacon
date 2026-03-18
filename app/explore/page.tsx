import Link from "next/link";
import { CloudinaryImage } from "@/components/ui/CloudinaryImage";
import { CloudinaryVideo } from "@/components/ui/CloudinaryVideo";
import { DuoIcon } from "@/components/ui/DuoIcon";

// Mixed Mock Data for Explore Grid (Cloudinary examples)
const EXPLORE_ITEMS = [
  { id: "e1", type: "image" as const, publicId: "samples/balloons", width: 1920, height: 1280, title: "Aesthetic Blur", span: "row-span-1 col-span-1" },
  { id: "e2", type: "video" as const, publicId: "samples/sea-turtle", width: 1920, height: 1080, duration: 12.5, title: "Nature Motion", span: "row-span-2 col-span-1 md:col-span-2" },
  { id: "e3", type: "image" as const, publicId: "samples/food/pot-mussels", width: 1530, height: 1024, title: "Culinary Art", span: "row-span-1 col-span-1" },
  { id: "e4", type: "image" as const, publicId: "samples/landscapes/nature-mountains", width: 1920, height: 1280, title: "Alpine Vista", span: "row-span-1 col-span-1" },
  { id: "e5", type: "image" as const, publicId: "samples/animals/reindeer", width: 1920, height: 1280, title: "Wildlife Discovery", span: "row-span-1 col-span-1 md:col-span-2" },
  { id: "e6", type: "image" as const, publicId: "samples/ecommerce/analog-classic", width: 1000, height: 1000, title: "Vintage Tech", span: "row-span-1 col-span-1" },
];

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-background pb-20 pt-8">
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Explore</h1>
          <p className="mt-1 text-muted">Discover the best creative work from the community.</p>
        </header>

        {/* ── Masonry-style Grid ── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:gap-8 auto-rows-[250px]">
          {EXPLORE_ITEMS.map((item, i) => (
            <Link 
              key={item.id} 
              href={`/shots/${item.id}`} 
              className={`group relative overflow-hidden rounded-3xl bg-surface border border-white/5 ${item.span}`}
            >
              {item.type === "video" ? (
                <CloudinaryVideo
                  cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!}
                  publicId={item.publicId}
                  context="thumbnail" 
                  autoPlayInView
                  loop
                  duration={item.duration}
                  wrapperClassName="h-full w-full"
                />
              ) : (
                <CloudinaryImage
                  cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!}
                  publicId={item.publicId}
                  context={item.span.includes("col-span-2") ? "card" : "thumbnail"} // optimized size map
                  alt={item.title}
                  fill // Fills the container, handles its own CLS correctly
                  priority={i < 4} // Preload the first few above the fold
                  className="transition-transform duration-700 ease-out group-hover:scale-105"
                />
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-100 flex flex-col justify-end p-6">
                <h3 className="text-white font-bold text-lg leading-none translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  {item.title}
                </h3>
                <div className="flex gap-4 mt-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                  <div className="flex items-center gap-1.5 text-white/90">
                    <DuoIcon name="heart" size={16} />
                    <span className="text-sm font-bold">12k</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/90">
                    <span className="text-sm font-bold">4.2k Views</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
