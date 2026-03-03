"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionWrapper } from "@/components/shared/section-wrapper";
import { siteConfig } from "@/data/site-data";
import { FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { HiOutlineMail, HiOutlineLocationMarker } from "react-icons/hi";
import { fadeUp, stagger, viewport } from "@/lib/motion";
import { PageHero } from "@/components/shared/page-hero";

export function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  /* Fetch live social links from Firestore settings */
  const [links, setLinks] = useState(siteConfig.links);
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setLinks({
            instagram: data.instagram || siteConfig.links.instagram,
            linkedin: data.linkedin || siteConfig.links.linkedin,
            email: data.email || siteConfig.links.email,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus("idle");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: unknown) {
      setSubmitStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to send message."
      );
    }
    setSubmitting(false);
  };
  return (
    <>
      <PageHero
        badge="Contact"
        title={<>Get In<br /><span className="text-gradient">Touch</span></>}
        description="Want to join FinFoundry, collaborate on an event, or invite us to speak? We'd love to hear from you."
      />

      <SectionWrapper>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="grid lg:grid-cols-2 gap-12 lg:gap-20"
        >
          {/* Contact Form */}
          <motion.div variants={fadeUp}>
            <h2 className="font-heading font-bold text-2xl tracking-[-0.02em] text-foreground mb-2">
              Send us a message
            </h2>
            <p className="text-muted-foreground mb-8">
              Fill out the form and we&apos;ll get back to you within 24 hours.
            </p>

            <form
              className="space-y-5"
              onSubmit={handleSubmit}
            >
              {submitStatus === "success" && (
                <div className="px-4 py-3 rounded-xl bg-teal/10 border border-teal/20 text-teal-light text-sm">
                  Message sent successfully! We&apos;ll get back to you soon.
                </div>
              )}
              {submitStatus === "error" && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {errorMsg}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="What's this about?"
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us more..."
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm rounded-xl w-full sm:w-auto disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div variants={fadeUp} className="space-y-6">
            <div className="glass-card rounded-2xl p-6 sm:p-8">
              <h3 className="font-heading font-semibold text-lg text-foreground mb-6">
                Contact Information
              </h3>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl neo-icon flex items-center justify-center shrink-0">
                    <HiOutlineMail className="w-4.5 h-4.5 text-teal-light/80" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <a
                      href={`mailto:${links.email}`}
                      className="text-sm text-muted-foreground hover:text-teal-light transition-colors duration-200"
                    >
                      {links.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl neo-icon flex items-center justify-center shrink-0">
                    <HiOutlineLocationMarker className="w-4.5 h-4.5 text-teal-light/80" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Location
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Chaitanya Bharathi Institute of Technology
                      <br />
                      Gandipet, Hyderabad, Telangana 500075
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 sm:p-8">
              <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
                Follow Us
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Stay updated with the latest events and content.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-input text-sm text-foreground hover:border-teal/30 transition-all duration-200"
                >
                  <FaInstagram className="w-4 h-4" />
                  Instagram
                </a>
                <a
                  href={links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-input text-sm text-foreground hover:border-teal/30 transition-all duration-200"
                >
                  <FaLinkedinIn className="w-4 h-4" />
                  LinkedIn
                </a>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 sm:p-8">
              <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
                Join FinFoundry
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Applications for new members are open at the start of each semester.
                Follow us on social media for announcements.
              </p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-light/60 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                <span className="text-xs text-teal-light/80 font-medium">
                  Applications Open
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </SectionWrapper>
    </>
  );
}
