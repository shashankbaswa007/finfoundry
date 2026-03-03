"use client";

import { useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";

/* ═══════════════════════════════════════════════════════════════════
 * EasterEgg v1.1 — Konami Code hidden interaction
 *
 * Listens for the classic Konami Code sequence:
 *   ↑ ↑ ↓ ↓ ← → ← → B A
 *
 * On successful input, fires a gold + emerald confetti burst
 * using canvas-confetti (lightweight, tree-shaken).
 *
 * v1.1 fix: Uses a ref to track keystrokes instead of React state.
 * State updaters are pure functions — calling confetti() inside
 * one is a side effect that React 19 strict mode can suppress.
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

const KONAMI_STR = KONAMI_SEQUENCE.join(",");

function fireConfetti() {
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 99999,
    disableForReducedMotion: true,
  };

  confetti({
    ...defaults,
    particleCount: 80,
    spread: 70,
    startVelocity: 45,
    colors: ["#10B981", "#34D399", "#059669"],
    angle: 60,
    origin: { x: 0.3, y: 0.7 },
  });

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
  const keysRef = useRef<string[]>([]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const next = [...keysRef.current, key].slice(-10);
    keysRef.current = next;

    if (next.length === 10 && next.join(",") === KONAMI_STR) {
      keysRef.current = [];
      fireConfetti();
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return null;
}
