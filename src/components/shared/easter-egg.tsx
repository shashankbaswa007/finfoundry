"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

/* ═══════════════════════════════════════════════════════════════════
 * EasterEgg v1.0 — Konami Code hidden interaction
 *
 * Listens for the classic Konami Code sequence:
 *   ↑ ↑ ↓ ↓ ← → ← → B A
 *
 * On successful input, fires a gold + emerald confetti burst
 * using canvas-confetti (lightweight, tree-shaken).
 *
 * Architecture:
 *   - Keyboard-only (no touch support needed)
 *   - Tracks last 10 keystrokes in a rolling window
 *   - Resets sequence after successful trigger
 *   - Multiple triggers allowed per session
 *   - No visual component rendered (returns null)
 *
 * SOP compliance: §6 (micro-interaction), does not violate §11
 * (it's a hidden reward, not a visible decoration)
 * ═══════════════════════════════════════════════════════════════════ */

const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

function fireConfetti() {
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 99999,
    disableForReducedMotion: true,
  };

  // Emerald burst
  confetti({
    ...defaults,
    particleCount: 80,
    spread: 70,
    startVelocity: 45,
    colors: ["#10B981", "#34D399", "#059669"],
    angle: 60,
    origin: { x: 0.3, y: 0.7 },
  });

  // Gold burst (slight delay)
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 80,
      spread: 70,
      startVelocity: 45,
      colors: ["#F5C542", "#F7D56E", "#D4A82A"],
      angle: 120,
      origin: { x: 0.7, y: 0.7 },
    });
  }, 150);

  // Center burst
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 50,
      spread: 100,
      startVelocity: 30,
      colors: ["#10B981", "#F5C542", "#ffffff"],
      origin: { x: 0.5, y: 0.6 },
    });
  }, 300);
}

export function EasterEgg() {
  const [sequence, setSequence] = useState<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      setSequence((prev) => {
        const next = [...prev, key].slice(-10);

        if (next.length === 10 && next.join(",") === KONAMI_SEQUENCE.join(",")) {
          fireConfetti();
          return []; // Reset for reuse
        }

        return next;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}
