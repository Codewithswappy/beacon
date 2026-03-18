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
    <div className="flex w-full flex-col items-center">
      {/* Logo Container */}
      <div className="mb-10 flex w-full items-center justify-center gap-2">
        <Icon3dCubeSphere size={28} className="text-black dark:text-white" />
        <span className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-gray-100">
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
          <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-[8px] border border-[#e5e7eb] bg-white px-3 py-2.5 text-[14px] text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-transparent focus:ring-2 focus:ring-gray-300 focus:outline-none dark:border-[#333] dark:bg-white/5 dark:text-gray-100 dark:placeholder-gray-600 dark:focus:ring-gray-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="• • • • • • •"
              required
              className={`w-full rounded-[8px] border bg-white py-2.5 pr-10 pl-3 text-[14px] text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:outline-none dark:bg-white/5 dark:text-gray-100 dark:placeholder-gray-600 ${
                errorMessage && !errorMessage.includes("Confirmation")
                  ? "animate-shake border-orange-500"
                  : "border-[#e5e7eb] focus:border-transparent focus:ring-2 focus:ring-gray-300 dark:border-[#333] dark:focus:ring-gray-700"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none dark:text-gray-500 dark:hover:text-gray-300"
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
            <p className="animate-in fade-in slide-in-from-top-1 mt-1 text-[12px] font-medium text-orange-600 duration-200">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="animate-in fade-in slide-in-from-top-1 mt-1 text-[12px] font-medium text-emerald-600 duration-200">
              {successMessage}
            </p>
          )}
          {isSignUp &&
            !errorMessage &&
            !successMessage &&
            password.length > 0 && (
              <p className="mt-1 text-[11px] text-gray-500">
                Min. 8 chars, 1 uppercase, 1 number, 1 special char.
              </p>
            )}
        </div>

        <div className="rounded-[12px] border border-[#e5e7eb] p-0.5 dark:border-[#333]">
          <button
            type="submit"
            disabled={loading !== null}
            className="w-full cursor-pointer rounded-[10px] border border-[#1e1e1e] bg-linear-to-b from-[#2e2e2e] to-[#121212] px-4 py-[11px] text-[14px] font-bold tracking-wide text-white shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:from-[#2a2a2a] hover:to-[#090909] focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-300 dark:from-white dark:to-gray-200 dark:text-black dark:shadow-[0_2px_4px_rgba(255,255,255,0.1)] dark:hover:from-gray-100 dark:hover:to-white dark:focus:ring-white"
          >
            {loading === "credentials" ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
        className="mt-4 text-[13px] text-gray-500"
      >
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <span className="cursor-pointer font-semibold text-blue-400 transition-colors hover:text-blue-500 hover:underline dark:text-blue-300 dark:hover:text-blue-400">
              Sign In
            </span>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <span className="cursor-pointer font-semibold text-blue-400 transition-colors hover:text-blue-500 hover:underline dark:text-blue-300 dark:hover:text-blue-400">
              Create one
            </span>
          </>
        )}
      </button>

      <div className="my-6 flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
        <span className="text-[11px] font-medium tracking-wider text-gray-400 uppercase">
          or continue with
        </span>
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOAuthLogin("google")}
          disabled={loading !== null}
          className="group flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-[8px] border-2 border-[#e5e7eb] bg-linear-to-b from-white to-[#f9fafb] px-3 py-2.5 text-[13px] font-semibold text-gray-700 shadow-sm shadow-black/10 transition-all hover:border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-black/10 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#333] dark:from-white/5 dark:to-white/[0.02] dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-white/10 dark:focus:ring-white/10"
        >
          {loading === "google" ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
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
          className="group flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-[8px] border-2 border-[#e5e7eb] bg-linear-to-b from-[#1f1f1f] to-black px-3 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:border-gray-300 hover:from-black hover:to-black focus:ring-2 focus:ring-black/10 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#333] dark:from-white dark:to-gray-200 dark:text-black dark:hover:border-gray-500 dark:hover:from-gray-100 dark:hover:to-white dark:focus:ring-white/10"
        >
          {loading === "github" ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            <IconBrandGithub className="h-4 w-4 text-white dark:text-black" />
          )}
          GitHub
        </button>
      </div>
    </div>
  );
}
