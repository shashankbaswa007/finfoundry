"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════
 * TiltCard v1.0 — Mouse-tracking 3D parallax card
 *
 * Tracks cursor position over the card and applies subtle
 * rotateX/rotateY transforms for a depth-aware 3D tilt.
 * Optional glare overlay follows cursor position.
 *
 * Architecture:
 *   - Spring-damped return to flat on mouse leave
 *   - CSS perspective on the card itself (not parent)
 *   - Glare uses radial gradient positioned at cursor
 *   - Mobile: tilt disabled (touch devices have no hover)
 *
 * Performance:
 *   - Only state updates on mousemove
 *   - Spring transition handles interpolation
 *   - GPU composited via preserve-3d
 *
 * SOP compliance: §1.2-T1 (depth over decoration), §4, §7, §8
 * ═══════════════════════════════════════════════════════════════════ */

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  tiltStrength?: number;
  glareEnabled?: boolean;
}

export function TiltCard({
  children,
  className = "",
  tiltStrength = 8,
  glareEnabled = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glare, setGlare] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;   // 0 → 1
    const y = (e.clientY - rect.top) / rect.height;    // 0 → 1
    setRotateX((y - 0.5) * -tiltStrength);
    setRotateY((x - 0.5) * tiltStrength);
    setGlare({ x: x * 100, y: y * 100 });
  };

  const handleEnter = () => setIsHovered(true);

  const handleLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      animate={{ rotateX, rotateY }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={`relative ${className}`}
    >
      {children}

      {/* Glare overlay — subtle light reflection following cursor */}
      {glareEnabled && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-300 z-10"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.06) 0%, transparent 60%)`,
          }}
        />
      )}
    </motion.div>
  );
}
