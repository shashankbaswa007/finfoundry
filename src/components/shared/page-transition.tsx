"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════
 * PageTransition v2.0 — Enter-only route animation
 *
 * Animates a clean fade-in + subtle rise when the route changes.
 * Uses key={pathname} to re-trigger the enter animation on navigate.
 *
 * Architecture:
 *   - Enter only: opacity 0→1, y 8→0 (structural easing, 0.4s)
 *   - No exit animation — App Router layouts are persistent so
 *     AnimatePresence exit would animate the WRONG content
 *   - initial={true} so first page also gets the entrance
 *
 * Only used in the site (public) layout. Admin pages use
 * standard instant transitions for editor productivity.
 *
 * SOP compliance: §4, §5, §7, §8, §9
 * ═══════════════════════════════════════════════════════════════════ */

const structuralEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: structuralEase },
      }}
    >
      {children}
    </motion.div>
  );
}
