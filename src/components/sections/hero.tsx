"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { HiArrowRight } from "react-icons/hi";
import { useEntrance } from "@/lib/entrance-context";
import { ParticleNetwork } from "@/components/shared/particle-network";
import { MagneticButton } from "@/components/shared/magnetic-button";

/* ═══════════════════════════════════════════════════════════════ */
/*  HERO — Content-first. Clean background, no glow artifacts.  */
/*  Entrance-aware: waits for brand reveal before animating.     */
/* ═══════════════════════════════════════════════════════════════ */
export function HeroSection() {
  const prefersReduced = useReducedMotion();
  const { heroReady } = useEntrance();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] as const },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Fine dot grid for depth */}
      <div className="absolute inset-0 grid-pattern opacity-60" />

      {/* Interactive particle network — ambient depth layer */}
      <ParticleNetwork />

      {/* Floating aurora orbs */}
      <div
        className="floating-orb"
        style={{
          width: "clamp(300px, 40vw, 600px)",
          height: "clamp(300px, 40vw, 600px)",
          top: "10%",
          left: "-5%",
          background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)",
        }}
      />
      <div
        className="floating-orb-sm"
        style={{
          width: "clamp(200px, 30vw, 450px)",
          height: "clamp(200px, 30vw, 450px)",
          bottom: "15%",
          right: "-3%",
          background: "radial-gradient(circle, rgba(245,197,66,0.04) 0%, transparent 70%)",
          animationDelay: "4s",
        }}
      />
      <div
        className="floating-orb-sm"
        style={{
          width: "clamp(150px, 20vw, 300px)",
          height: "clamp(150px, 20vw, 300px)",
          top: "60%",
          left: "20%",
          background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)",
          animationDelay: "7s",
        }}
      />

      {/* Soft top-center radial */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(1200px,100vw)] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16,185,129,0.05) 0%, transparent 70%)",
          transform: "translateX(-50%) translateZ(0)",
        }}
      />

      {/* ════════ CONTENT ════════════════════════════════════ */}
      <motion.div
        className="relative z-10 container-max text-center"
        variants={container}
        initial="hidden"
        animate={heroReady ? "show" : "hidden"}
      >
        {/* Badge — glassmorphism */}
        <motion.div variants={fadeUp}>
          <span className="glass-badge inline-flex items-center px-5 py-2 text-xs font-semibold tracking-[0.2em] uppercase text-teal-light/90 rounded-full mb-6 sm:mb-8">
            CBIT Hyderabad
          </span>
        </motion.div>

        {/* Heading — Word-by-word reveal */}
        <motion.h1
          variants={fadeUp}
          className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold tracking-[-0.03em] leading-[1.08] max-w-4xl mx-auto"
        >
          <motion.span
            className="inline"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
            }}
          >
            {["Build", "Your"].map((word, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.25em] align-bottom">
                <motion.span
                  className="inline-block"
                  variants={{
                    hidden: { y: "100%", opacity: 0 },
                    show: {
                      y: "0%",
                      opacity: 1,
                      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
                    },
                  }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </motion.span>
          <br />
          <motion.span
            className="inline"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
            }}
          >
            {["Financial", "Edge"].map((word, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.25em] align-bottom">
                <motion.span
                  className="inline-block text-gradient"
                  variants={{
                    hidden: { y: "100%", opacity: 0 },
                    show: {
                      y: "0%",
                      opacity: 1,
                      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
                    },
                  }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </motion.span>
        </motion.h1>

        {/* Decorative gradient rule */}
        <motion.div
          className="mx-auto mt-5 sm:mt-6 gradient-divider"
          initial={{ width: 0, opacity: 0 }}
          animate={heroReady ? { width: 180, opacity: 1 } : { width: 0, opacity: 0 }}
          transition={{
            duration: 1,
            delay: heroReady ? 0.65 : 0,
            ease: [0.22, 1, 0.36, 1],
          }}
        />

        {/* Description */}
        <motion.p
          variants={fadeUp}
          className="mt-6 sm:mt-8 text-lg sm:text-xl text-muted-foreground max-w-[52ch] mx-auto leading-relaxed"
        >
          The premier financial literacy club at CBIT. Master stock markets,
          financial modeling, and wealth management — engineered for the next
          generation of leaders.
        </motion.p>

        {/* CTA buttons — premium glass style */}
        <motion.div
          variants={fadeUp}
          className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <MagneticButton strength={0.25}>
            <Link
              href="/contact"
              className="group btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-sm rounded-xl"
            >
              Join FinFoundry
              <HiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
          </MagneticButton>
          <MagneticButton strength={0.2}>
            <Link
              href="/programs"
              className="btn-ghost inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold rounded-xl text-foreground"
            >
              Explore Programs
            </Link>
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050816] to-transparent z-[3]" />
    </section>
  );
}
