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
        <Icon3dCubeSphere size={28} />
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
        className="mt-4 text-[13px] text-gray-500 hover:text-gray-800 transition-colors"
      >
        {isSignUp
          ? "Already have an account? Sign In"
          : "Don't have an account?  Create one"}
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
          className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 bg-white border border-[#e5e7eb] rounded-[8px] shadow-sm text-[13px] font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-[1.5px] focus:ring-black transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading === "google" ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <IconBrandGoogle className="w-4 h-4 text-gray-600" />
          )}
          Google
        </button>

        <button
          type="button"
          onClick={() => handleOAuthLogin("github")}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 bg-white border border-[#e5e7eb] rounded-[8px] shadow-sm text-[13px] font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-[1.5px] focus:ring-black transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading === "github" ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <IconBrandGithub className="w-4 h-4 text-gray-600" />
          )}
          GitHub
        </button>
      </div>
    </div>
  );
}
