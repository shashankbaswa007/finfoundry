"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import { usePathname } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════
 * CustomCursor v2.0 — Trailing ring accent (original cursor intact)
 *
 * A subtle emerald ring that trails the native cursor with spring
 * physics. Grows on hover over interactive elements, shrinks on
 * click. The native cursor remains fully visible — this is purely
 * a decorative accent layer.
 *
 * Architecture:
 *   - Disabled on admin/login routes
 *   - Disabled on touch devices (pointer: coarse)
 *   - MutationObserver re-attaches listeners on DOM changes
 *   - Spring physics via Framer Motion useSpring
 *
 * Performance:
 *   - Uses motion values (no React re-renders on move)
 *   - pointer-events: none, fixed position
 *   - GPU composited via translateZ(0)
 *
 * SOP compliance: §4, §6, §7, §8, §9
 * ═══════════════════════════════════════════════════════════════════ */

const INTERACTIVE_SELECTOR = "a, button, [role='button'], input, textarea, select, label[for], [data-cursor='pointer']";

export function CustomCursor() {
  const pathname = usePathname();
  const isAdmin =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/bootstrap");

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { damping: 25, stiffness: 250, mass: 0.5 });
  const springY = useSpring(cursorY, { damping: 25, stiffness: 250, mass: 0.5 });

  const ringRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(true);

  /* ── Detect pointer type ──────────────────────────────────── */
  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  /* ── Attach hover listeners (re-runs on pathname + DOM) ──── */
  const attachListeners = useCallback(() => {
    const elements = document.querySelectorAll(INTERACTIVE_SELECTOR);
    const onEnter = () => setHovered(true);
    const onLeave = () => setHovered(false);

    elements.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      elements.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  useEffect(() => {
    if (isAdmin || isTouchDevice) return;

    const cleanup = attachListeners();

    const observer = new MutationObserver(() => {
      cleanup();
      attachListeners();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cleanup();
      observer.disconnect();
    };
  }, [isAdmin, isTouchDevice, pathname, attachListeners]);

  /* ── Mouse move / click tracking ─────────────────────────── */
  useEffect(() => {
    if (isAdmin || isTouchDevice) return;

    const onMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!visible) setVisible(true);
    };
    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    };
  }, [isAdmin, isTouchDevice, cursorX, cursorY, visible]);

  /* ── Apply transforms directly via motion values ──────────── */
  useEffect(() => {
    if (isAdmin || isTouchDevice || !ringRef.current) return;

    const unsubX = springX.on("change", (x) => {
      if (ringRef.current) ringRef.current.style.left = `${x}px`;
    });
    const unsubY = springY.on("change", (y) => {
      if (ringRef.current) ringRef.current.style.top = `${y}px`;
    });

    return () => {
      unsubX();
      unsubY();
    };
  }, [isAdmin, isTouchDevice, springX, springY]);

  /* Don't render on admin, touch, or SSR */
  if (isAdmin || isTouchDevice) return null;

  /* Ring size: normal 32px, hovered 48px, clicking 24px */
  const size = hovered ? 48 : clicking ? 24 : 32;

  return (
    <div
      ref={ringRef}
      className="fixed pointer-events-none z-[9999] rounded-full"
      style={{
        width: size,
        height: size,
        border: hovered ? "1.5px solid rgba(16, 185, 129, 0.5)" : "1.5px solid rgba(16, 185, 129, 0.2)",
        background: hovered ? "rgba(16, 185, 129, 0.06)" : "transparent",
        transform: "translate(-50%, -50%) translateZ(0)",
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), height 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.3s, border-color 0.25s, background 0.25s",
        opacity: visible ? 1 : 0,
        willChange: "left, top, width, height",
      }}
      aria-hidden="true"
    />
  );
}
