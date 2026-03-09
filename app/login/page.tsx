import { LoginForm } from "@/components/auth/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Nexus",
  description: "Sign in to access your dashboard",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen relative bg-[#f5f5f5] flex items-center justify-center font-sans overflow-hidden">
      {/* Background warm glowing orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-50%] w-[50%] h-[50%] bg-orange-200 blur-[120px]" />
        <div className="absolute top-[60%] left-[80%] w-[40%] h-[40%] bg-rose-100 blur-[120px]" />
        <div className="absolute top-[0%] left-full w-[30%] h-[30%] bg-amber-200 blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-40%] w-[50%] h-[50%] bg-cyan-50 blur-[120px]" />
      </div>

      <div className="relative flex w-[400px] h-fit">
        {/* Horizontal line extensions & top/bottom border */}
        <div className="absolute -left-12 -right-12 top-0 border-t border-dashed border-[#d1d5db] mask-[linear-gradient(to_right,transparent,black_48px,black_calc(100%-48px),transparent)]" />
        <div className="absolute -left-12 -right-12 bottom-0 border-t border-dashed border-[#d1d5db] mask-[linear-gradient(to_right,transparent,black_48px,black_calc(100%-48px),transparent)]" />

        {/* Vertical line extensions & left/right border */}
        <div className="absolute left-0 -top-12 -bottom-12 border-l border-dashed border-[#d1d5db] mask-[linear-gradient(to_bottom,transparent,black_48px,black_calc(100%-48px),transparent)]" />
        <div className="absolute right-0 -top-12 -bottom-12 border-l border-dashed border-[#d1d5db] mask-[linear-gradient(to_bottom,transparent,black_48px,black_calc(100%-48px),transparent)]" />

        <div className="relative w-full p-6 z-10 box-border">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
