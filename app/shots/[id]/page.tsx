import { notFound } from "next/navigation";
import { CloudinaryImage } from "@/components/ui/CloudinaryImage";
import { CloudinaryVideo } from "@/components/ui/CloudinaryVideo";
import { DuoIcon } from "@/components/ui/DuoIcon";

// Static mock DB of projects for demonstration
const PROJECTS: Record<string, any> = {
  "e1": { publicId: "samples/balloons", type: "image", width: 1920, height: 1280, title: "Aesthetic Blur", user: "jcreator" },
  "e2": { publicId: "samples/sea-turtle", type: "video", width: 1920, height: 1080, duration: 12.5, title: "Nature Motion", user: "alexd" },
  "post-1": { publicId: "samples/balloons", type: "image", width: 1920, height: 1280, title: "Brand Identity", user: "alexd" },
  "post-2": { publicId: "samples/shoe", type: "image", width: 1000, height: 1000, title: "Progressive JPEG", user: "samdev" }
};

export default function ShotDetailPage({ params }: { params: { id: string } }) {
  const project = PROJECTS[params.id];

  if (!project) {
    // Basic fallback for IDs not matched 
    return (
      <div className="min-h-screen bg-background pt-20 flex flex-col items-center">
        <h1 className="text-2xl font-bold">Project Not Found</h1>
        <p className="text-muted mt-2">Could not locate mock project ID: {params.id}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ── Top Nav Header ── */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-surface/80 px-4 backdrop-blur-md md:px-8 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-800">
            {/* Generic avatar */}
            <DuoIcon name="userDefault" size={24} className="m-auto mt-2 text-neutral-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">{project.title}</h1>
            <p className="text-sm font-medium text-muted mt-1">{"@" + project.user}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition">
            <DuoIcon name="bookmark" size={20} className="text-white" />
          </button>
          <button className="flex h-10 items-center justify-center gap-2 rounded-full bg-white px-5 font-bold text-black hover:bg-neutral-200 transition">
            <DuoIcon name="heart" size={20} className="text-black" />
            Save
          </button>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <div className="mx-auto mt-8 max-w-5xl px-4 md:px-8">
        <div className="beacon-shadow relative overflow-hidden rounded-[24px] bg-surface md:rounded-[40px] border border-white/5">
          {/* Cloudinary Context: "full" uses w_1600 to deliver maximum crispness for the detail page  */}
          {project.type === "video" ? (
             <CloudinaryVideo
               cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!}
               publicId={project.publicId}
               context="full"
               aspectRatio={`${project.width}/${project.height}`}
               controls
               autoPlayInView
               duration={project.duration}
             />
          ) : (
            <CloudinaryImage
              cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!}
              publicId={project.publicId}
              context="full" 
              aspectRatio={`${project.width}/${project.height}`}
              alt={project.title}
              priority // absolute critical preloading for the hero image
            />
          )}
        </div>

        {/* ── Engagement Actions ── */}
        <div className="mt-8 flex justify-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <button className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white transition-all hover:scale-105 hover:bg-white/10 active:scale-95">
              <DuoIcon name="heart" size={28} />
            </button>
            <span className="font-bold text-sm text-muted">2.4k</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white transition-all hover:scale-105 hover:bg-white/10 active:scale-95">
              <DuoIcon name="mail" size={28} />
            </button>
            <span className="font-bold text-sm text-muted">145</span>
          </div>
        </div>
      </div>
    </div>
  );
}
