"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════
 * TableOfContents v1.0 — Sticky sidebar navigation for About page
 *
 * Auto-discovers sections via data-toc-id/data-toc-label attributes
 * on the page. Highlights the active section based on scroll
 * position using IntersectionObserver.
 *
 * Architecture:
 *   - Looks for [data-toc-id] elements in the DOM
 *   - IntersectionObserver with rootMargin to detect active section
 *   - Clicks trigger smooth scroll via Lenis (falls back to native)
 *   - Hidden on mobile (<1024px) — shown as floating sidebar on desktop
 *   - Animates in after 1s delay (allows initial content to render)
 *
 * Performance:
 *   - Single IntersectionObserver for all sections
 *   - No scroll listeners, no RAF
 *   - Minimal re-renders (only on active section change)
 *
 * SOP compliance: §4, §6, §8, §9
 * ═══════════════════════════════════════════════════════════════════ */

interface TocItem {
  id: string;
  label: string;
}

export function TableOfContents() {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [visible, setVisible] = useState(false);

  /* ── Discover sections on mount ──────────────────────────── */
  useEffect(() => {
    const elements = document.querySelectorAll("[data-toc-id]");
    const tocItems: TocItem[] = [];

    elements.forEach((el) => {
      const id = el.getAttribute("data-toc-id");
      const label = el.getAttribute("data-toc-label") || id || "";
      if (id) tocItems.push({ id, label });
    });

    setItems(tocItems);

    // Show TOC after brief delay
    const timer = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  /* ── Intersection Observer for active tracking ───────────── */
  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible section from top
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // Pick the one closest to the top of the viewport
          const sorted = visibleEntries.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
          const id = sorted[0].target.getAttribute("data-toc-id");
          if (id) setActiveId(id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    items.forEach(({ id }) => {
      const el = document.querySelector(`[data-toc-id="${id}"]`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  /* ── Scroll to section ───────────────────────────────────── */
  const scrollTo = useCallback((id: string) => {
    const el = document.querySelector(`[data-toc-id="${id}"]`);
    if (!el) return;

    // Try Lenis first (if available via global), fall back to native
    const lenis = (window as unknown as { lenis?: { scrollTo: (el: Element, opts: Record<string, unknown>) => void } }).lenis;
    if (lenis) {
      lenis.scrollTo(el, { offset: -100, duration: 1.2 });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="hidden xl:block fixed right-8 top-1/2 -translate-y-1/2 z-40"
          aria-label="Table of contents"
        >
          <div className="flex flex-col gap-1 py-4 px-1">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-4 bottom-4 w-px bg-white/[0.06]" />

            {items.map(({ id, label }) => {
              const isActive = activeId === id;

              return (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="group relative flex items-center gap-3 py-1.5 text-left transition-colors duration-200"
                  aria-current={isActive ? "location" : undefined}
                >
                  {/* Dot indicator */}
                  <span
                    className={`relative z-10 w-[7px] h-[7px] rounded-full transition-all duration-300 ${
                      isActive
                        ? "bg-teal-light shadow-[0_0_8px_rgba(16,185,129,0.4)] scale-125"
                        : "bg-white/[0.15] group-hover:bg-white/[0.3]"
                    }`}
                  />

                  {/* Label */}
                  <span
                    className={`text-[11px] font-medium tracking-wide whitespace-nowrap transition-colors duration-200 ${
                      isActive
                        ? "text-teal-light"
                        : "text-muted-foreground/50 group-hover:text-muted-foreground/80"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
