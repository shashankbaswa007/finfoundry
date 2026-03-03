"use client";

import { useEffect, useRef, useCallback } from "react";
import { useReducedMotion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════
 * ParticleNetwork v1.0 — Canvas-based Ambient Mesh Background
 *
 * Renders a sparse network of gently drifting particles connected
 * by proximity lines — evokes financial data networks, node graphs,
 * and Bloomberg terminal aesthetics.
 *
 * Architecture:
 *   - Offscreen-safe: pauses when tab is hidden (visibilitychange)
 *   - Responsive: recalculates on resize (debounced 200ms)
 *   - Density-aware: particle count scales with viewport area
 *   - Mobile-tuned: fewer particles, no mouse interaction on touch
 *   - Reduced motion: renders static frame, no animation
 *
 * Performance guarantees:
 *   - Single canvas element, no DOM nodes per particle
 *   - will-change: transform for compositor promotion
 *   - Particle count capped at 80 (desktop), 35 (mobile)
 *   - Connection check uses squared distance (no sqrt in hot loop)
 *   - Max 60fps, auto-pauses when not visible
 *
 * Color: emerald (#10B981) at very low opacity to stay subtle.
 * No gold — particles are ambient depth, not accent.
 *
 * SOP compliance: §1.2-T1 (depth over decoration), §1.2-T4
 * (content supremacy), §3, §7, §8, §9
 * ═══════════════════════════════════════════════════════════════════ */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/* Tuning constants */
const CONNECTION_DIST = 140;
const CONNECTION_DIST_SQ = CONNECTION_DIST * CONNECTION_DIST;
const PARTICLE_SPEED = 0.25;
const LINE_OPACITY_MAX = 0.12;
const DOT_RADIUS = 1.2;
const DOT_OPACITY = 0.35;

/** Calculate appropriate particle count for viewport size */
function getParticleCount(width: number, height: number): number {
  const area = width * height;
  const isMobile = width < 768;

  if (isMobile) return Math.min(Math.floor(area / 25000), 35);
  return Math.min(Math.floor(area / 18000), 80);
}

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReduced = useReducedMotion();
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const isVisibleRef = useRef(true);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  /** Initialize particles with random positions & velocities */
  const initParticles = useCallback((width: number, height: number) => {
    const count = getParticleCount(width, height);
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = PARTICLE_SPEED * (0.5 + Math.random() * 0.5);
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }

    particlesRef.current = particles;
  }, []);

  /** Main render loop */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    const particles = particlesRef.current;
    const mouse = mouseRef.current;

    ctx.clearRect(0, 0, width, height);

    /* Update positions */
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      /* Wrap around edges (softer than bounce) */
      if (p.x < -10) p.x = width + 10;
      else if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      else if (p.y > height + 10) p.y = -10;
    }

    /* Draw connections between nearby particles */
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distSq = dx * dx + dy * dy;

        if (distSq < CONNECTION_DIST_SQ) {
          const opacity = (1 - distSq / CONNECTION_DIST_SQ) * LINE_OPACITY_MAX;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    /* Draw connections to mouse (desktop only) */
    if (mouse.active) {
      for (let i = 0; i < particles.length; i++) {
        const dx = particles[i].x - mouse.x;
        const dy = particles[i].y - mouse.y;
        const distSq = dx * dx + dy * dy;
        const mouseDist = CONNECTION_DIST * 1.5;

        if (distSq < mouseDist * mouseDist) {
          const opacity = (1 - distSq / (mouseDist * mouseDist)) * 0.18;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;
          ctx.lineWidth = 0.6;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    /* Draw particles (dots) */
    ctx.fillStyle = `rgba(16, 185, 129, ${DOT_OPACITY})`;
    for (let i = 0; i < particles.length; i++) {
      ctx.beginPath();
      ctx.arc(particles[i].x, particles[i].y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  /** Animation loop with visibility gating */
  const animate = useCallback(() => {
    if (!isVisibleRef.current) return;
    render();
    frameRef.current = requestAnimationFrame(animate);
  }, [render]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* ── Size the canvas to parent ────────────────────────────── */
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      initParticles(rect.width, rect.height);
    };

    resize();

    /* If reduced motion, render one static frame and stop */
    if (prefersReduced) {
      render();
      return;
    }

    /* ── Start animation ──────────────────────────────────────── */
    frameRef.current = requestAnimationFrame(animate);

    /* ── Resize handler (debounced) ───────────────────────────── */
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    };
    window.addEventListener("resize", handleResize);

    /* ── Visibility gating ────────────────────────────────────── */
    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
      if (isVisibleRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    /* ── Mouse tracking (desktop only) ────────────────────────── */
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };
    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    if (!isTouchDevice) {
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      cancelAnimationFrame(frameRef.current);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (!isTouchDevice) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [prefersReduced, initParticles, render, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto z-[1]"
      style={{ willChange: "transform", transform: "translateZ(0)" }}
      aria-hidden="true"
    />
  );
}
