"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { usePathname } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════
 * ScrollProgress v1.0 — Thin gradient progress bar
 *
 * Renders a 2px-tall gradient bar at the very top of the viewport
 * that scales horizontally from 0% → 100% as the user scrolls.
 *
 * Gradient: emerald → gold — matches the brand dual-accent system.
 * Spring-damped for buttery smooth updates (no jitter).
 *
 * Hidden on admin routes (not needed for editor workflow).
 *
 * SOP compliance: §4, §6, §7, §8
 * ═══════════════════════════════════════════════════════════════════ */

export function ScrollProgress() {
  const pathname = usePathname();
  const isAdmin =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/bootstrap");

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  if (isAdmin) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left pointer-events-none"
      style={{
        scaleX,
        background: "linear-gradient(90deg, #10B981, #34D399, #F5C542)",
      }}
      aria-hidden="true"
    />
  );
}
