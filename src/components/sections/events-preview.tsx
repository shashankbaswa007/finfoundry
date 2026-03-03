"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SectionWrapper } from "@/components/shared/section-wrapper";
import { SectionHeading } from "@/components/shared/section-heading";
import { events as staticEvents } from "@/data/site-data";
import { HiArrowRight } from "react-icons/hi";
import { fadeUp, stagger, viewport } from "@/lib/motion";
import { TiltCard } from "@/components/shared/tilt-card";

const statusColors: Record<string, string> = {
  upcoming: "text-teal-light/90 bg-teal/[0.06] border-teal/[0.1]",
  ongoing: "text-gold/90 bg-gold/[0.06] border-gold/[0.1]",
  completed: "text-muted-foreground bg-white/[0.03] border-white/[0.06]",
};

export function EventsPreview() {
  const [events, setEvents] = useState(staticEvents);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setEvents(data);
      })
      .catch(() => {});
  }, []);

  const previewEvents = events.slice(0, 3);

  return (
    <SectionWrapper showGlow glowColor="gold">
      <SectionHeading
        badge="Events"
        title="What's Happening"
        description="Competitions, workshops, guest lectures — stay ahead with our curated events calendar."
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="grid sm:grid-cols-2 md:grid-cols-3 gap-6"
      >
        {previewEvents.map((event) => (
          <motion.div
            key={event.title}
            variants={fadeUp}
          >
            <TiltCard
              className="group glass-card rounded-2xl p-7 h-full transition-all duration-[250ms] ease-out"
              tiltStrength={6}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-muted-foreground">
                  {event.date}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-medium rounded-full border capitalize ${
                    statusColors[event.status]
                  }`}
                >
                  {event.status}
                </span>
              </div>
              <span className="inline-block px-2.5 py-0.5 text-[11px] font-medium text-teal-light/80 bg-teal/[0.06] rounded-md mb-3">
                {event.type}
              </span>
              <h3 className="font-heading font-semibold text-[17px] text-foreground mb-2 tracking-[-0.01em]">
                {event.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            </TiltCard>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="mt-16 text-center"
      >
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-light hover:text-teal transition-colors duration-200 group"
        >
          View All Events
          <HiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
        </Link>
      </motion.div>
    </SectionWrapper>
  );
}
