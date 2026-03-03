"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { viewport } from "@/lib/motion";

/* ═══════════════════════════════════════════════════════════════════
 * TextReveal v1.0 — Word-by-word viewport-triggered reveal
 *
 * Each word rises from a masked overflow-hidden container with
 * staggered timing, creating a premium heading reveal effect.
 *
 * Architecture:
 *   - Splits text by spaces, wraps each word in overflow-hidden span
 *   - Each word has translateY(100%) → 0 + opacity 0 → 1
 *   - Stagger: 0.04s gap between words
 *   - Easing: structural curve from motion tokens
 *   - Fires once (viewport: { once: true })
 *
 * Usage:
 *   <TextReveal as="h2" className="..." text="Build Your Financial Edge" />
 *
 * Use for hero headings and section titles for added ceremony.
 * Not for body text or descriptions (use fadeUp for those).
 *
 * SOP compliance: §1.2-T2 (engineered motion), §4, §7, §9
 * ═══════════════════════════════════════════════════════════════════ */

interface TextRevealProps {
  /** The text string to animate word by word */
  text: string;
  className?: string;
  delay?: number;
  /** HTML element to render as */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  /** Optional: render a ReactNode after the revealed text (e.g. gradient span) */
  children?: ReactNode;
}

const structuralEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

const wordVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: structuralEase,
    },
  },
};

export function TextReveal({
  text,
  className = "",
  delay = 0,
  as: Tag = "h2",
  children,
}: TextRevealProps) {
  const words = text.split(" ");

  return (
    <Tag className={className}>
      <motion.span
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.04,
              delayChildren: delay,
            },
          },
          hidden: {},
        }}
        className="inline"
      >
        {words.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden mr-[0.25em] align-bottom">
            <motion.span
              className="inline-block"
              variants={wordVariants}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </motion.span>
      {children}
    </Tag>
  );
}
