"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
 * OfflinePage — Branded fallback when network is unavailable
 *
 * Features:
 *   - Auto-reconnect listener → redirects when back online
 *   - Retry button with loading state
 *   - FinFoundry-branded glass card with vignette
 *   - Particle-style floating dots for visual polish
 * ═══════════════════════════════════════════════════════════════════ */

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1.0];

export function OfflinePage() {
  const [retrying, setRetrying] = useState(false);

  /* Auto-redirect when connectivity restores */
  useEffect(() => {
    const onOnline = () => window.location.replace("/");
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050816]">
      {/* ── Atmospheric background ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(16,185,129,0.06), transparent)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 48%, transparent 0%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      {/* ── Floating particles ── */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-emerald-400/20"
          initial={{
            x: `${15 + i * 14}vw`,
            y: `${20 + (i % 3) * 25}vh`,
            opacity: 0,
          }}
          animate={{
            y: [`${20 + (i % 3) * 25}vh`, `${10 + (i % 3) * 25}vh`],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.8,
          }}
        />
      ))}

      {/* ── Main card ── */}
      <motion.div
        className="relative z-10 text-center px-6 py-12 max-w-md mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {/* Icon */}
        <motion.div
          className="mx-auto mb-8 flex items-center justify-center w-20 h-20 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
        >
          <WifiOff className="w-9 h-9 text-emerald-400/70" strokeWidth={1.5} />
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-white/90 mb-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.25 }}
        >
          You&apos;re Offline
        </motion.h1>

        {/* Description */}
        <motion.p
          className="text-base text-white/50 leading-relaxed mb-8 max-w-sm mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          It looks like you&apos;ve lost your internet connection.
          We&apos;ll automatically reconnect when you&apos;re back online.
        </motion.p>

        {/* Retry button */}
        <motion.button
          onClick={handleRetry}
          disabled={retrying}
          className="group relative inline-flex items-center gap-2.5 px-7 py-3 rounded-lg font-medium text-sm tracking-wide text-white/90 border border-emerald-500/20 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14] hover:border-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.45 }}
          whileTap={{ scale: 0.97 }}
        >
          <RefreshCw
            className={`w-4 h-4 text-emerald-400/80 ${retrying ? "animate-spin" : ""}`}
            strokeWidth={1.5}
          />
          {retrying ? "Reconnecting…" : "Try Again"}
        </motion.button>

        {/* Brand footer */}
        <motion.div
          className="mt-12 flex items-center justify-center gap-2 text-white/20 text-xs tracking-wider uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="w-6 h-px bg-gradient-to-r from-transparent to-white/10" />
          <span className="font-heading">
            <span className="text-emerald-400/30">Fin</span>
            <span className="text-amber-400/30">Foundry</span>
          </span>
          <div className="w-6 h-px bg-gradient-to-l from-transparent to-white/10" />
        </motion.div>
      </motion.div>
    </div>
  );
}
