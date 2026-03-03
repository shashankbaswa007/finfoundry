"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionWrapper } from "@/components/shared/section-wrapper";
import { SectionHeading } from "@/components/shared/section-heading";
import { JoinCTA } from "@/components/sections/join-cta";
import { fadeUp, stagger, staggerSlow, viewport } from "@/lib/motion";
import { PageHero } from "@/components/shared/page-hero";

const staticValues = [
  {
    title: "Financial Literacy for All",
    description:
      "We believe every engineering student deserves access to quality financial education, regardless of their branch or background.",
  },
  {
    title: "Practical Over Theoretical",
    description:
      "Our programs emphasize hands-on learning through simulated trading, real case studies, and live market analysis sessions.",
  },
  {
    title: "Community First",
    description:
      "FinFoundry is a peer-driven community where knowledge sharing, mentorship, and collaborative learning are at the core.",
  },
  {
    title: "Industry Aligned",
    description:
      "We maintain strong connections with financial professionals and institutions to ensure our content stays relevant and practical.",
  },
];

const staticMilestones = [
  { year: "2022", event: "FinFoundry founded at CBIT" },
  { year: "2023", event: "First inter-college FinQuest competition" },
  { year: "2023", event: "100+ active members milestone" },
  { year: "2024", event: "Launched Market Pulse workshop series" },
  { year: "2024", event: "Partnership with industry professionals" },
  { year: "2025", event: "500+ members community" },
];

const staticMission = [
  "At CBIT FinFoundry, we recognize that traditional engineering curricula rarely cover financial literacy — a critical life skill. Our mission is to fill this gap by providing structured, practical financial education to every student at CBIT.",
  "From understanding how stock markets work to building professional-grade financial models, from personal wealth management to understanding macroeconomic indicators — we cover the full spectrum of financial knowledge.",
  "We don\u2019t just teach theory. Through simulated trading competitions, real-time market analysis sessions, and direct mentorship from industry professionals, our members gain practical skills that serve them throughout their careers.",
];

const staticAboutStats = [
  { value: "500+", label: "Members" },
  { value: "50+", label: "Events" },
  { value: "20+", label: "Industry Speakers" },
  { value: "3+", label: "Years" },
];

export function AboutPage() {
  const [values, setValues] = useState(staticValues);
  const [milestones, setMilestones] = useState(staticMilestones);
  const [mission, setMission] = useState(staticMission);
  const [aboutStats, setAboutStats] = useState(staticAboutStats);

  useEffect(() => {
    fetch("/api/about")
      .then((res) => res.json())
      .then((data) => {
        if (data.values && Array.isArray(data.values)) setValues(data.values);
        if (data.milestones && Array.isArray(data.milestones))
          setMilestones(data.milestones);
        if (data.mission && Array.isArray(data.mission))
          setMission(data.mission);
        if (data.stats && Array.isArray(data.stats))
          setAboutStats(data.stats);
      })
      .catch(() => {});
  }, []);
  return (
    <>
      <PageHero
        badge="About Us"
        title={<>Where Finance Meets<br /><span className="text-gradient">Engineering</span></>}
        description="CBIT FinFoundry bridges the gap between technical education and financial acumen at one of Hyderabad's premier engineering institutions."
      />

      {/* Mission */}
      <SectionWrapper>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <SectionHeading
              badge="Our Mission"
              title="Creating Financially Literate Engineers"
              align="left"
            />
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="space-y-4 text-muted-foreground leading-relaxed -mt-8 prose-narrow"
            >
              {mission.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="glass-card rounded-2xl p-6 sm:p-8"
          >
            <h3 className="font-heading font-semibold text-xl text-foreground mb-6">
              By the Numbers
            </h3>
            <motion.div
              variants={staggerSlow}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="grid grid-cols-2 gap-5"
            >
              {aboutStats.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={fadeUp}
                  className="text-center p-5 rounded-xl bg-white/[0.03] border border-white/[0.04]"
                >
                  <div className="text-2xl font-heading font-bold text-gradient-gold tracking-[-0.02em]">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </SectionWrapper>

      {/* Values */}
      <SectionWrapper className="bg-surface">
        <SectionHeading
          badge="Our Values"
          title="What Drives Us"
          description="The principles that guide everything we do at FinFoundry."
        />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="grid sm:grid-cols-2 gap-5"
        >
          {values.map((value, i) => (
            <motion.div
              key={value.title}
              variants={fadeUp}
              className="glass-card rounded-2xl p-7"
            >
              <div className="w-10 h-10 rounded-xl neo-icon flex items-center justify-center mb-5">
                <span className="text-teal-light/80 font-heading font-bold text-sm">
                  0{i + 1}
                </span>
              </div>
              <h3 className="font-heading font-semibold text-[17px] text-foreground mb-2 tracking-[-0.01em]">
                {value.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {value.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </SectionWrapper>

      {/* Timeline */}
      <SectionWrapper>
        <SectionHeading
          badge="Journey"
          title="Our Story So Far"
          description="Key milestones in FinFoundry's growth."
        />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="max-w-2xl mx-auto"
        >
          {milestones.map((milestone) => (
            <motion.div
              key={`${milestone.year}-${milestone.event}`}
              variants={fadeUp}
              className="flex gap-6 relative pb-8 last:pb-0"
            >
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-light/70 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                <div className="w-px flex-1 bg-white/[0.06] mt-2" />
              </div>
              <div>
                <span className="text-xs font-semibold text-teal-light/80">
                  {milestone.year}
                </span>
                <p className="text-foreground font-medium mt-1">
                  {milestone.event}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </SectionWrapper>

      <JoinCTA />
    </>
  );
}
