"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEntrance } from "@/lib/entrance-context";

/* ═══════════════════════════════════════════════════════════════════
 * BrandEntrance v4.0 — Cinematic Letter-Group Reveal
 *
 * Adapted from the Lovable motion-architect prototype with:
 *   - Synced to FinFoundry palette (#050816 bg, emerald/gold accents)
 *   - Entrance-context integration (shouldPlay, markNavReady, markHeroReady)
 *   - Compressed timeline (~2.9s total vs original 5.2s)
 *   - prefers-reduced-motion respected
 *   - Once-per-session via EntranceContext
 *
 * Timeline (3.0s total):
 *   Phase 0  VOID         0–200ms     Black screen, cinematic anticipation
 *   Phase 1  ATMOSPHERE   200ms       Teal glow + bg fade in (1.2s ease)
 *   Phase 2  BORDER DRAW  400ms       Gold stroke animates (1.4s ease)
 *   Phase 3  "F"          950ms       Hero letter (0.55s fade)
 *   Phase 4  "IN"         1200ms      Follow pair (0.55s fade)
 *   Phase 5  "FOUNDRY"    1450ms      Bottom row (0.65s fade)
 *   Phase 6  GOLDEN BLOOM 1750ms      Gold glow climax (1.0s ease)
 *   Phase 7  SETTLE       2050ms      Scale to 1.0 + accent line
 *   Phase 8  EXIT         2350ms      markNavReady, begin dissolve
 *   heroReady             2500ms      Hero content unlocks
 *   Unmount               3000ms      DOM cleanup
 *
 * SOP compliance: §4, §5, §7, §9
 * ═══════════════════════════════════════════════════════════════════ */

const BORDER_PERIM = 2 * (965.775 + 769.312);
const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1.0];
const EASE_OUT: [number, number, number, number] = [0.0, 0.0, 0.2, 1.0];
const EXIT_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

export function BrandEntrance() {
  const { shouldPlay, markHeroReady, markNavReady } = useEntrance();
  const prefersReduced = useReducedMotion();
  const [phase, setPhase] = useState(0);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [mounted, setMounted] = useState(true);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!shouldPlay) return;

    if (prefersReduced) {
      setPhase(8);
      markNavReady();
      markHeroReady();
      const t = setTimeout(() => setOverlayVisible(false), 400);
      return () => clearTimeout(t);
    }

    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      timeoutsRef.current.push(id);
    };

    schedule(() => setPhase(1), 200);   // atmosphere
    schedule(() => setPhase(2), 400);   // border draw begins
    schedule(() => setPhase(3), 950);   // "F" — hero letter
    schedule(() => setPhase(4), 1200);  // "IN"  — 250ms gap
    schedule(() => setPhase(5), 1450);  // "FOUNDRY" — 250ms gap
    schedule(() => setPhase(6), 1750);  // golden bloom climax
    schedule(() => setPhase(7), 2050);  // settle
    schedule(() => {
      setPhase(8);
      markNavReady();
    }, 2350);                           // exit
    schedule(() => markHeroReady(), 2500);
    schedule(() => setOverlayVisible(false), 3000);

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [shouldPlay, prefersReduced, markHeroReady, markNavReady]);

  if (!shouldPlay || !mounted) return null;

  /* ── Letter group fade helper ─────────────────────────── */
  const fadeStyle = (minPhase: number, dur = "0.55s") => ({
    opacity: phase >= minPhase ? 1 : 0,
    transition: `opacity ${dur} cubic-bezier(0.25, 0.1, 0.25, 1)`,
  });

  return (
    <AnimatePresence onExitComplete={() => setMounted(false)}>
      {overlayVisible && (
        <motion.div
          key="brand-overlay"
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: "#050816" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: EXIT_EASE }}
        >
          {/* ── Atmospheric teal glow ── */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 1 ? 1 : 0 }}
            transition={{ duration: 1.2, ease: EASE }}
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 50% 48%, rgba(16,185,129,0.10), transparent)",
            }}
          />

          {/* ── Film grain ── */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
              backgroundSize: "200px 200px",
            }}
          />

          {/* ── Vignette ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 48%, transparent 0%, rgba(0,0,0,0.35) 100%)",
            }}
          />

          {/* ── Logo container ── */}
          <motion.div
            className="relative flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{
              opacity: phase >= 1 ? 1 : 0,
              scale: phase >= 7 ? 1 : phase >= 1 ? 0.97 : 0.94,
            }}
            transition={{
              opacity: { duration: 0.8, ease: EASE },
              scale: { duration: 1.8, ease: EASE_OUT },
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 810 1012.49997"
              preserveAspectRatio="xMidYMid meet"
              className="w-[min(55vw,320px)] h-auto"
              style={{
                filter:
                  phase >= 6
                    ? "drop-shadow(0 0 60px rgba(245,197,66,0.08))"
                    : "none",
                transition: "filter 1.0s cubic-bezier(0.25, 0.1, 0.25, 1)",
              }}
            >
              <defs>
                <clipPath id="be-clip-bg">
                  <path
                    d="M 0.199219 0 L 809.800781 0 L 809.800781 1012 L 0.199219 1012 Z"
                    clipRule="nonzero"
                  />
                </clipPath>
                <clipPath id="be-clip-f">
                  <rect x="0" width="203" y="0" height="480" />
                </clipPath>
                <clipPath id="be-clip-in">
                  <rect x="0" width="284" y="0" height="287" />
                </clipPath>
                <clipPath id="be-clip-y">
                  <path
                    d="M 241 18 L 272.980469 18 L 272.980469 54 L 241 54 Z"
                    clipRule="nonzero"
                  />
                </clipPath>
                <clipPath id="be-clip-foundry">
                  <rect x="0" width="273" y="0" height="69" />
                </clipPath>
                <clipPath id="be-clip-border">
                  <path
                    d="M 116.648438 144.011719 L 693.117188 144.011719 L 693.117188 867.984375 L 116.648438 867.984375 Z"
                    clipRule="nonzero"
                  />
                </clipPath>
              </defs>

              {/* ── Teal background fill ── */}
              <g clipPath="url(#be-clip-bg)">
                <rect
                  x="0.199219"
                  y="0"
                  width="809.601562"
                  height="1012"
                  fill="#008080"
                  style={fadeStyle(1, "1.4s")}
                />
              </g>

              {/* ── Golden border — stroke draw animation ── */}
              <g clipPath="url(#be-clip-border)">
                <motion.path
                  transform="matrix(0, -0.74963, 0.74963, 0, 116.649984, 867.985167)"
                  fill="none"
                  strokeLinecap="butt"
                  strokeLinejoin="miter"
                  stroke="#F5C542"
                  strokeWidth="76"
                  strokeOpacity="1"
                  strokeMiterlimit="4"
                  d="M 0.0010571 -0.00206244 L 965.774753 -0.00206244 L 965.774753 769.310053 L 0.0010571 769.310053 Z"
                  initial={{
                    strokeDasharray: BORDER_PERIM,
                    strokeDashoffset: BORDER_PERIM,
                    opacity: 0,
                  }}
                  animate={{
                    strokeDashoffset: phase >= 2 ? 0 : BORDER_PERIM,
                    opacity: phase >= 2 ? 1 : 0,
                  }}
                  transition={{
                    strokeDashoffset: { duration: 1.4, ease: EASE },
                    opacity: { duration: 0.15 },
                  }}
                />
              </g>

              {/* ── Large "F" ── */}
              <g style={fadeStyle(3)} transform="matrix(1, 0, 0, 1, 182, 278)">
                <g clipPath="url(#be-clip-f)">
                  <g fill="#F5C542" fillOpacity="1">
                    <g transform="translate(0.962138, 375.544211)">
                      <path d="M 31.609375 0 L 31.609375 -44.96875 L 5.96875 -44.96875 L 5.96875 -75.515625 L 31.609375 -75.515625 L 31.609375 -250.796875 L 182.3125 -250.796875 L 182.3125 -207.25 L 83.953125 -207.25 L 83.953125 -149.640625 L 175.984375 -149.640625 L 175.984375 -106.078125 L 83.953125 -106.078125 L 83.953125 -75.515625 L 138.046875 -75.515625 L 138.046875 -44.96875 L 83.953125 -44.96875 L 83.953125 0 Z M 31.609375 0" />
                    </g>
                  </g>
                </g>
              </g>

              {/* ── "I" and "N" ── */}
              <g style={fadeStyle(4)} transform="matrix(1, 0, 0, 1, 374, 328)">
                <g clipPath="url(#be-clip-in)">
                  <g fill="#F5C542" fillOpacity="1">
                    <g transform="translate(0.560652, 224.693211)">
                      <path d="M 49.109375 0 L 19.484375 0 L 19.484375 -149.90625 L 49.109375 -149.90625 Z M 49.109375 0" />
                    </g>
                    <g transform="translate(69.259262, 224.693211)">
                      <path d="M 48.1875 0 L 19.484375 0 L 19.484375 -149.90625 L 53.421875 -149.90625 L 113.609375 -53.3125 L 116.265625 -53.71875 L 116.265625 -149.90625 L 144.78125 -149.90625 L 144.78125 0 L 114.421875 0 L 50.75 -103.140625 L 48.1875 -102.734375 Z M 48.1875 0" />
                    </g>
                  </g>
                  <g fill="#F5C542" fillOpacity="1">
                    <g transform="translate(233.624016, 224.693211)">
                      <g />
                    </g>
                  </g>
                </g>
              </g>

              {/* ── "FOUNDRY" row — slightly longer fade for the full word ── */}
              <g style={fadeStyle(5, "0.65s")} transform="matrix(1, 0, 0, 1, 331, 563)">
                <g clipPath="url(#be-clip-foundry)">
                  <g fill="#F5C542" fillOpacity="1">
                    <g transform="translate(0.550236, 53.544364)">
                      <path d="M 19.359375 0.515625 C 16.109375 0.515625 13.238281 -0.144531 10.75 -1.46875 C 8.257812 -2.800781 6.3125 -4.832031 4.90625 -7.5625 C 3.5 -10.289062 2.796875 -13.6875 2.796875 -17.75 C 2.796875 -21.820312 3.5 -25.222656 4.90625 -27.953125 C 6.3125 -30.679688 8.257812 -32.707031 10.75 -34.03125 C 13.238281 -35.363281 16.109375 -36.03125 19.359375 -36.03125 C 22.617188 -36.03125 25.484375 -35.367188 27.953125 -34.046875 C 30.429688 -32.722656 32.367188 -30.691406 33.765625 -27.953125 C 35.171875 -25.222656 35.875 -21.820312 35.875 -17.75 C 35.875 -13.6875 35.171875 -10.285156 33.765625 -7.546875 C 32.367188 -4.816406 30.429688 -2.789062 27.953125 -1.46875 C 25.484375 -0.144531 22.617188 0.515625 19.359375 0.515625 Z M 19.359375 -5.59375 C 22.367188 -5.59375 24.664062 -6.554688 26.25 -8.484375 C 27.84375 -10.421875 28.640625 -13.507812 28.640625 -17.75 C 28.640625 -22 27.84375 -25.09375 26.25 -27.03125 C 24.664062 -28.976562 22.367188 -29.953125 19.359375 -29.953125 C 16.328125 -29.953125 14.015625 -28.976562 12.421875 -27.03125 C 10.828125 -25.09375 10.03125 -22 10.03125 -17.75 C 10.03125 -13.507812 10.828125 -10.421875 12.421875 -8.484375 C 14.015625 -6.554688 16.328125 -5.59375 19.359375 -5.59375 Z M 19.359375 -5.59375" />
                    </g>
                    <g transform="translate(39.245605, 53.544364)">
                      <g />
                    </g>
                    <g transform="translate(50.978099, 53.544364)">
                      <path d="M 18.828125 0.515625 C 13.929688 0.515625 10.300781 -0.644531 7.9375 -2.96875 C 5.570312 -5.300781 4.390625 -8.75 4.390625 -13.3125 L 4.390625 -35.515625 L 11.265625 -35.515625 L 11.265625 -13.359375 C 11.265625 -10.765625 11.890625 -8.820312 13.140625 -7.53125 C 14.390625 -6.238281 16.285156 -5.59375 18.828125 -5.59375 C 23.859375 -5.59375 26.375 -8.179688 26.375 -13.359375 L 26.375 -35.515625 L 33.25 -35.515625 L 33.25 -13.3125 C 33.25 -8.75 32.066406 -5.300781 29.703125 -2.96875 C 27.335938 -0.644531 23.710938 0.515625 18.828125 0.515625 Z M 18.828125 0.515625" />
                    </g>
                    <g transform="translate(88.628961, 53.544364)">
                      <g />
                    </g>
                    <g transform="translate(100.361455, 53.544364)">
                      <path d="M 11.421875 0 L 4.609375 0 L 4.609375 -35.515625 L 12.65625 -35.515625 L 26.921875 -12.625 L 27.546875 -12.734375 L 27.546875 -35.515625 L 34.296875 -35.515625 L 34.296875 0 L 27.109375 0 L 12.03125 -24.4375 L 11.421875 -24.34375 Z M 11.421875 0" />
                    </g>
                    <g transform="translate(139.299733, 53.544364)">
                      <g />
                    </g>
                    <g transform="translate(151.032227, 53.544364)">
                      <path d="M 17.390625 -35.515625 C 23.160156 -35.515625 27.5625 -34.023438 30.59375 -31.046875 C 33.632812 -28.066406 35.15625 -23.632812 35.15625 -17.75 C 35.15625 -11.894531 33.632812 -7.472656 30.59375 -4.484375 C 27.5625 -1.492188 23.160156 0 17.390625 0 L 4.609375 0 L 4.609375 -35.515625 Z M 16.984375 -5.90625 C 20.640625 -5.90625 23.375 -6.835938 25.1875 -8.703125 C 27 -10.578125 27.90625 -13.59375 27.90625 -17.75 C 27.90625 -21.914062 27 -24.929688 25.1875 -26.796875 C 23.375 -28.671875 20.640625 -29.609375 16.984375 -29.609375 L 11.640625 -29.609375 L 11.640625 -5.90625 Z M 16.984375 -5.90625" />
                    </g>
                    <g transform="translate(188.99887, 53.544364)">
                      <g />
                    </g>
                  </g>
                  <g fill="#F5C542" fillOpacity="1">
                    <g transform="translate(200.731359, 53.544364)">
                      <path d="M 12.1875 0 L 3.234375 -15.625 L 3.234375 -19.296875 L 6.21875 -19.296875 C 7.976562 -19.296875 9.453125 -19.6875 10.640625 -20.46875 C 11.835938 -21.25 12.601562 -22.335938 12.9375 -23.734375 L 3.234375 -23.734375 L 3.234375 -27.40625 L 12.890625 -27.40625 C 12.585938 -28.664062 11.972656 -29.71875 11.046875 -30.5625 C 10.117188 -31.414062 8.820312 -31.84375 7.15625 -31.84375 L 3.234375 -31.84375 L 3.234375 -35.515625 L 25.671875 -35.515625 L 25.671875 -31.84375 L 17.859375 -31.84375 C 19.015625 -30.582031 19.742188 -29.101562 20.046875 -27.40625 L 25.671875 -27.40625 L 25.671875 -23.734375 L 20.15625 -23.734375 C 19.820312 -21.273438 18.863281 -19.359375 17.28125 -17.984375 C 15.707031 -16.609375 13.710938 -15.671875 11.296875 -15.171875 L 21.046875 0 Z M 12.1875 0" />
                    </g>
                  </g>
                  <g fill="#F5C542" fillOpacity="1">
                    <g transform="translate(229.187007, 53.544364)">
                      <g />
                    </g>
                  </g>
                  <g clipPath="url(#be-clip-y)">
                    <g fill="#F5C542" fillOpacity="1">
                      <g transform="translate(240.919512, 53.544364)">
                        <path d="M 19.453125 0 L 12.4375 0 L 12.4375 -13.9375 L 0.171875 -35.515625 L 7.703125 -35.515625 L 15.8125 -21.546875 L 16.421875 -21.546875 L 24.359375 -35.515625 L 31.71875 -35.515625 L 19.453125 -13.9375 Z M 19.453125 0" />
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </svg>

            {/* ── Golden bloom behind logo ── */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase >= 6 ? 1 : 0 }}
              transition={{ duration: 1.0, ease: EASE }}
              style={{
                background:
                  "radial-gradient(ellipse 50% 40% at 50% 45%, rgba(245,197,66,0.05), transparent)",
              }}
            />

            {/* ── Accent line (below logo, inside container) ── */}
            <motion.div
              className="mt-5 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(245,197,66,0.25) 30%, rgba(16,185,129,0.25) 70%, transparent)",
              }}
              initial={{ width: 0, opacity: 0 }}
              animate={{
                width: phase >= 7 ? 100 : 0,
                opacity: phase >= 7 && phase < 8 ? 1 : 0,
              }}
              transition={{ width: { duration: 0.6, ease: EASE_OUT }, opacity: { duration: 0.4 } }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
