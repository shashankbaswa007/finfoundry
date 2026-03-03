"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HiArrowRight } from "react-icons/hi";
import { fadeUp, viewport } from "@/lib/motion";
import { MagneticButton } from "@/components/shared/magnetic-button";

export function JoinCTA() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-36 bg-aurora">
      {/* Aurora floating orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="floating-orb"
          style={{
            width: "clamp(250px, 40vw, 500px)",
            height: "clamp(250px, 40vw, 500px)",
            top: "20%",
            left: "-10%",
            background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)",
          }}
        />
        <div
          className="floating-orb-sm"
          style={{
            width: "clamp(200px, 30vw, 400px)",
            height: "clamp(200px, 30vw, 400px)",
            bottom: "10%",
            right: "-5%",
            background: "radial-gradient(circle, rgba(245,197,66,0.035) 0%, transparent 70%)",
            animationDelay: "5s",
          }}
        />
      </div>

      <div className="relative z-10 container-max">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="glass-cta rounded-3xl px-8 py-14 sm:px-12 sm:py-16 lg:px-16 lg:py-20 text-center"
        >
          <span className="glass-badge-gold inline-block px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-gold/90 rounded-full mb-6">
            Ready to Start?
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.025em] leading-[1.1] max-w-3xl mx-auto">
            Your Financial Journey
            <br />
            <span className="text-gradient">Starts Here</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-[50ch] mx-auto leading-relaxed">
            Join 500+ students who are already building their financial literacy.
            No prior experience required — just the drive to learn.
          </p>
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
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
                href="/about"
                className="btn-ghost inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold rounded-xl text-foreground"
              >
                Learn More
              </Link>
            </MagneticButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
