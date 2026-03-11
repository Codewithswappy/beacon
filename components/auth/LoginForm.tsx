"use client";

import { createClient } from "@/lib/supabase/client";
import {
  Icon3dCubeSphere,
  IconBrandGithub,
  IconBrandGoogle,
  IconEye,
  IconEyeClosed,
} from "@tabler/icons-react";
import { useState } from "react";

export function LoginForm() {
  const supabase = createClient();
  const [loading, setLoading] = useState<
    "google" | "github" | "credentials" | null
  >(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pass))
      return "Password must contain at least one uppercase letter.";
    if (!/[0-9]/.test(pass))
      return "Password must contain at least one number.";
    if (!/[!@#$%^&*]/.test(pass))
      return "Password must contain at least one special character (!@#$%^&*).";
    return null;
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setLoading(provider);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setErrorMessage(error.message || "An unexpected error occurred.");
      setLoading(null);
    }
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("credentials");
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isSignUp) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setErrorMessage(passwordError);
        setLoading(null);
        return;
      }
    }

    try {
      const { data, error } = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      if (isSignUp) {
        setSuccessMessage("Account created successfully!");
        setLoading(null);
        // If email confirmation is off, Supabase logs them in immediately
        if (data?.session) {
          setTimeout(() => (window.location.href = "/"), 1500);
        }
      } else {
        window.location.href = "/";
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Invalid login credentials.");
      setLoading(null);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Logo Container */}
      <div className="flex items-center gap-2 mb-10 w-full justify-center">
        <Icon3dCubeSphere size={28} color="black"/>
        <span className="text-[22px] font-bold tracking-tight text-gray-900">
          Beacon
        </span>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>

      <form onSubmit={handleCredentials} className="w-full space-y-4">
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-3 py-2.5 bg-white border border-[#e5e7eb] rounded-[8px] text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all shadow-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="• • • • • • •"
              required
              className={`w-full pl-3 pr-10 py-2.5 bg-white border rounded-[8px] text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none transition-all shadow-sm ${
                errorMessage && !errorMessage.includes("Confirmation")
                  ? "border-orange-500 animate-shake"
                  : "border-[#e5e7eb] focus:ring-2 focus:ring-gray-300 focus:border-transparent"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <IconEyeClosed size={18} stroke={2} />
              ) : (
                <IconEye size={18} stroke={2} />
              )}
            </button>
          </div>
          {errorMessage && (
            <p className="text-[12px] mt-1 text-orange-600 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="text-[12px] mt-1 text-emerald-600 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
              {successMessage}
            </p>
          )}
          {isSignUp &&
            !errorMessage &&
            !successMessage &&
            password.length > 0 && (
              <p className="text-[11px] mt-1 text-gray-500">
                Min. 8 chars, 1 uppercase, 1 number, 1 special char.
              </p>
            )}
        </div>

        <div className=" border border-[#e5e7eb] rounded-[12px] p-0.5">
          <button
            type="submit"
            disabled={loading !== null}
            className="w-full py-[11px] px-4 bg-linear-to-b from-[#2e2e2e] to-[#121212] text-white rounded-[10px] text-[14px] font-bold cursor-pointer tracking-wide shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] border border-[#1e1e1e] hover:from-[#2a2a2a] hover:to-[#090909] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading === "credentials" ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign in"
            )}
          </button>
        </div>
      </form>

      <button
        type="button"
        onClick={() => setIsSignUp(!isSignUp)}
        className="mt-4 text-[13px] text-gray-500 "
      >
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <span className="text-blue-300 hover:text-blue-400 font-semibold hover:underline cursor-pointer transition-colors">
              Sign In
            </span>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <span className="text-blue-300 hover:text-blue-400 font-semibold hover:underline cursor-pointer transition-colors">
              Create one
            </span>
          </>
        )}
      </button>

      <div className="w-full flex items-center gap-3 my-6">
        <div className="h-px bg-gray-200 flex-1"></div>
        <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
          or continue with
        </span>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>

      <div className="w-full grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOAuthLogin("google")}
          disabled={loading !== null}
          className="group w-full flex items-center justify-center gap-2.5 px-3 py-2.5 bg-linear-to-b from-white to-[#f9fafb] border-2 border-[#e5e7eb] rounded-[8px] shadow-sm shadow-black/10 text-[13px] font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-black/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading === "google" ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Google
        </button>

        <button
          type="button"
          onClick={() => handleOAuthLogin("github")}
          disabled={loading !== null}
          className="group w-full flex items-center justify-center gap-2.5 px-3 py-2.5 bg-linear-to-b from-[#1f1f1f] to-black border-2 border-[#e5e7eb] hover:border-gray-300 rounded-[8px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]shadow-black/10 text-[13px] font-semibold text-white hover:from-black hover:to-black hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-black/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading === "github" ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <IconBrandGithub className="w-4 h-4 text-white" />
          )}
          GitHub
        </button>
      </div>
    </div>
  );
}
