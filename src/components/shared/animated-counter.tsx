"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useReducedMotion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════
 * AnimatedCounter v1.0 — Viewport-triggered number countup
 *
 * Parses stat strings like "500+", "20+", "3+" and animates
 * from 0 to the numeric target using requestAnimationFrame.
 * Preserves suffix characters (+, %, etc).
 *
 * Uses easeOutExpo curve for a fast-start, slow-finish feel
 * that matches the institutional/financial aesthetic.
 *
 * Respects prefers-reduced-motion: renders final value instantly.
 * Uses IntersectionObserver for viewport detection — no scroll
 * listener. Fires once only.
 *
 * Performance: Single rAF loop per counter, auto-cancels.
 * No framer-motion dependency to keep this lightweight.
 *
 * SOP compliance: §1.2-T2 (engineered motion), §4, §7, §8, §9
 * ═══════════════════════════════════════════════════════════════════ */

interface AnimatedCounterProps {
  /** The stat value string, e.g. "500+", "3+", "20K+" */
  value: string;
  /** Animation duration in ms (default: 2000) */
  duration?: number;
}

/**
 * Parse a stat string into numeric target + suffix.
 * "500+" → { target: 500, prefix: "", suffix: "+" }
 * "₹72K" → { target: 72, prefix: "₹", suffix: "K" }
 */
function parseStatValue(value: string): { target: number; prefix: string; suffix: string } {
  /* Extract leading non-digit chars as prefix (e.g. "₹") */
  const prefixMatch = value.match(/^([^\d]*)/);
  const prefix = prefixMatch?.[1] ?? "";

  /* Extract trailing non-digit chars as suffix (e.g. "+", "K+", "%") */
  const suffixMatch = value.match(/([^\d.,]*)$/);
  const suffix = suffixMatch?.[1] ?? "";

  /* Extract the numeric portion */
  const numStr = value.replace(prefix, "").replace(suffix, "").replace(/,/g, "");
  const target = parseFloat(numStr) || 0;

  return { target, prefix, suffix };
}

/** Easing: easeOutExpo — fast start, decelerating finish */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function AnimatedCounter({ value, duration = 2000 }: AnimatedCounterProps) {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [displayValue, setDisplayValue] = useState("0");

  const { target, prefix, suffix } = useMemo(() => parseStatValue(value), [value]);
  const isInteger = Number.isInteger(target);

  /* Reduced motion: show final value immediately */
  useEffect(() => {
    if (prefersReduced) {
      setDisplayValue(isInteger ? target.toLocaleString() : target.toString());
      setHasAnimated(true);
    }
  }, [prefersReduced, target, isInteger]);

  /* IntersectionObserver — triggers animation once in view */
  useEffect(() => {
    if (prefersReduced || hasAnimated || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [prefersReduced, hasAnimated]);

  /* rAF-based countup animation */
  useEffect(() => {
    if (!hasAnimated || prefersReduced) return;

    let frameId: number;
    let start: number | null = null;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = easedProgress * target;

      setDisplayValue(
        isInteger
          ? Math.round(current).toLocaleString()
          : current.toFixed(1)
      );

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [hasAnimated, prefersReduced, target, duration, isInteger]);

  return (
    <span ref={ref}>
      {prefix}
      {hasAnimated ? displayValue : "0"}
      {suffix}
    </span>
  );
}
