"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════ */
/*  PageHero — Compact hero for sub-pages (About, Events, etc.) */
/*  Height: ~55vh (not full screen like Home hero).              */
/*  Clean design: grid pattern + subtle radial, no glow/orbs.   */
/* ═══════════════════════════════════════════════════════════════ */
interface PageHeroProps {
  badge: string;
  title: ReactNode;
  description: string;
}

export function PageHero({ badge, title, description }: PageHeroProps) {
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-gradient-hero pt-40 pb-20 sm:pt-44 sm:pb-24 md:pt-48 md:pb-28">
      {/* Fine dot grid */}
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Floating aurora orbs */}
      <div
        className="floating-orb"
        style={{
          width: "clamp(250px, 35vw, 500px)",
          height: "clamp(250px, 35vw, 500px)",
          top: "5%",
          right: "-8%",
          background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)",
        }}
      />
      <div
        className="floating-orb-sm"
        style={{
          width: "clamp(180px, 25vw, 350px)",
          height: "clamp(180px, 25vw, 350px)",
          bottom: "10%",
          left: "-5%",
          background: "radial-gradient(circle, rgba(245,197,66,0.03) 0%, transparent 70%)",
          animationDelay: "6s",
        }}
      />

      {/* Subtle top-edge glow — barely perceptible */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 70% at 50% 0%, rgba(16,185,129,0.04) 0%, transparent 70%)",
          transform: "translateX(-50%) translateZ(0)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 container-max text-center">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="glass-badge inline-block px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-teal-light/90 rounded-full mb-5"
        >
          {badge}
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
          className="font-heading tracking-[-0.025em] leading-[1.1] text-4xl sm:text-5xl lg:text-6xl font-bold"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease }}
          className="mt-5 text-lg text-muted-foreground max-w-[52ch] mx-auto leading-relaxed"
        >
          {description}
        </motion.p>
      </div>

      {/* Bottom edge blend */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#050816] to-transparent z-[3]" />
    </section>
  );
}
