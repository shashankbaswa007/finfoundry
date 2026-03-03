"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser } from "react-icons/hi";

export function LoginPage() {
  const { user, role, loading, googleLoading, sessionError, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } =
    useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

  const [mode, setMode] = useState<"login" | "register" | "reset">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Redirect once fully authenticated (user + session cookie/role established)
  useEffect(() => {
    if (!loading && user && role) {
      router.replace(redirect);
    }
  }, [loading, user, role, redirect, router]);

  // Surface session errors (e.g. admin SDK failure, deactivated account)
  useEffect(() => {
    if (sessionError) {
      setError(sessionError);
      setSubmitting(false);
    }
  }, [sessionError]);

  // Show spinner while redirecting
  if (!loading && user && role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-teal/30 border-t-teal animate-spin" />
      </div>
    );
  }

  const handleGoogle = async () => {
    setError("");
    try {
      await signInWithGoogle();
      // Popup: onAuthStateChanged handles session + redirect
      // Mobile redirect: page navigates away, handled on return
    } catch (err: unknown) {
      // Firebase errors expose the code on .code, not inside .message
      const code = (err as { code?: string })?.code || "";
      const msg = err instanceof Error ? err.message : "";
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request" ||
        code === "auth/popup-blocked"
      ) {
        return; // User closed popup or it was blocked — not an error
      } else if (code === "auth/operation-not-allowed") {
        setError("Google sign-in is not enabled. Please contact an administrator.");
      } else if (code === "auth/unauthorized-domain") {
        setError("This domain is not authorized. Please contact an administrator.");
      } else if (code === "auth/network-request-failed" || msg.includes("network")) {
        setError("Network error. Please check your connection and try again.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many sign-in attempts. Please wait a moment and try again.");
      } else if (code === "auth/internal-error") {
        setError("An internal error occurred. Please try again.");
      } else {
        // Surface the actual code so it's easier to debug
        setError(code ? `Sign-in failed: ${code}` : "Could not sign in with Google. Please try again.");
      }
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (mode === "reset") {
        if (!email.trim()) {
          setError("Please enter your email address.");
          setSubmitting(false);
          return;
        }
        await resetPassword(email.trim());
        setResetSent(true);
        setSubmitting(false);
        return;
      }
      if (mode === "register") {
        if (!name.trim()) {
          setError("Please enter your name.");
          setSubmitting(false);
          return;
        }
        await signUpWithEmail(email, password, name.trim());
      } else {
        await signInWithEmail(email, password);
      }
      // Don't redirect here — wait for onAuthStateChanged → createSession → role update
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError("Incorrect email or password.");
      } else if (msg.includes("email-already-in-use")) {
        setError("An account with this email already exists. Try signing in.");
      } else if (msg.includes("weak-password")) {
        setError("Password must be at least 6 characters.");
      } else if (msg.includes("invalid-email")) {
        setError("Please enter a valid email address.");
      } else if (msg.includes("operation-not-allowed")) {
        setError("This sign-in method is not enabled. Please contact an administrator.");
      } else if (msg.includes("too-many-requests")) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else if (msg.includes("network-request-failed")) {
        setError("Network error. Please check your connection.");
      } else if (msg.includes("user-not-found") && mode === "reset") {
        // Don't reveal that the email doesn't exist for password reset
        setResetSent(true);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10 sm:py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-10">
          <Image
            src="/logo.png"
            alt="FinFoundry"
            width={120}
            height={150}
            className="rounded-[5px] w-11 h-auto"
            unoptimized
          />
          <span className="font-heading font-bold text-2xl tracking-[-0.015em] text-foreground">
            FinFoundry
          </span>
        </Link>

        {/* Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <h1 className="font-heading font-bold text-2xl text-foreground mb-1">
            {mode === "reset"
              ? "Reset password"
              : mode === "login"
                ? "Welcome back"
                : "Create account"}
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            {mode === "reset"
              ? "Enter your email and we'll send a reset link."
              : mode === "login"
                ? "Sign in to access your account."
                : "Join CBIT FinFoundry today."}
          </p>

          {/* Password Reset Success */}
          {mode === "reset" && resetSent && (
            <div className="px-4 py-3 rounded-xl bg-teal/10 border border-teal/20 text-teal-light text-sm mb-6">
              Password reset email sent! Check your inbox.
            </div>
          )}

          {mode !== "reset" && (
            <>
          {/* Google Sign-In */}
          <button
            onClick={handleGoogle}
            disabled={loading || googleLoading || submitting}
            className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-sm font-medium hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 mb-6"
          >
            {googleLoading ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <FcGoogle className="w-5 h-5" />
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-muted-foreground/60">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
            </>
          )}

          {/* Email Form */}
          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "register" && (
              <div className="relative">
                <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-teal/30 focus:ring-1 focus:ring-teal/15 transition-colors duration-200"
                />
              </div>
            )}

            <div className="relative">
              <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-teal/30 focus:ring-1 focus:ring-teal/15 transition-colors duration-200"
              />
            </div>

            {mode !== "reset" && (
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-teal/30 focus:ring-1 focus:ring-teal/15 transition-colors duration-200"
              />
            </div>
            )}

            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setMode("reset"); setError(""); setResetSent(false); }}
                  className="text-xs text-muted-foreground hover:text-teal-light transition-colors duration-200"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || loading || (mode === "reset" && resetSent)}
              className="w-full px-4 py-3 rounded-xl bg-gold text-background text-sm font-semibold hover:bg-gold-light transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? "Please wait..."
                : mode === "reset"
                  ? resetSent ? "Email Sent" : "Send Reset Link"
                  : mode === "login"
                    ? "Sign In"
                    : "Create Account"}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  className="text-teal-light hover:text-teal font-medium transition-colors duration-200"
                >
                  Sign up
                </button>
              </>
            ) : mode === "reset" ? (
              <>
                Remember your password?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setResetSent(false);
                  }}
                  className="text-teal-light hover:text-teal font-medium transition-colors duration-200"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className="text-teal-light hover:text-teal font-medium transition-colors duration-200"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Back to home */}
        <p className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-200"
          >
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
