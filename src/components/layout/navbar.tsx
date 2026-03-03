"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { navLinks } from "@/data/site-data";
import { useAuth } from "@/lib/auth-context";
import { canAccessAdmin } from "@/lib/roles";
import { HiOutlineMenuAlt3 } from "react-icons/hi";
import { IoCloseOutline } from "react-icons/io5";
import { useEntrance } from "@/lib/entrance-context";
import { RiShieldUserLine } from "react-icons/ri";
import { HiOutlineLogout } from "react-icons/hi";
import { ease, duration, dropdownReveal } from "@/lib/motion";

/* ═══════════════════════════════════════════════════════════════════
 * Navbar v2.0 — Structural Anchor Motion System
 *
 * Architecture:
 *   The navbar is a structural anchor, not a decorative strip.
 *   It reacts to scroll depth with layered physical changes:
 *   blur, shadow, height, border luminance, logo scale.
 *
 * Hover system:
 *   Shared-layout emerald glow pill tracks across nav links.
 *   No underline slides. Gliding. Magnetic. Calm.
 *
 * Dropdown:
 *   Material elevation: scale 0.98→1, blur 4px→0, shadow materializes.
 *   No pop. No bounce. Feels like a layer rising from depth.
 *
 * Easing governance:
 *   smooth: cubic-bezier(0.4, 0, 0.2, 1) — all structural
 *   natural: cubic-bezier(0.25, 0.1, 0.25, 1) — micro-interactions
 *
 * SOP compliance: §4, §5, §6, §8, §9
 * ═══════════════════════════════════════════════════════════════════ */

export function Navbar() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, role, signOut } = useAuth();
  const isAdmin = role ? canAccessAdmin(role) : false;
  const { navReady } = useEntrance();
  const prefersReduced = useReducedMotion();

  // ── Scroll depth tracking (throttled via RAF) ──────────────────
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Derived: continuous 0→1 progress over first 150px ──────────
  const scrollProgress = Math.min(scrollY / 150, 1);

  // ── Close profile dropdown on outside click ────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [profileOpen]);

  // ── Route change resets ─────────────────────────────────────────
  useEffect(() => { setProfileOpen(false); }, [pathname]);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // ── Clear hover on route change ─────────────────────────────────
  useEffect(() => { setHoveredLink(null); }, [pathname]);

  // ── Scroll-reactive computed styles (continuous interpolation) ──
  const navShadow = scrollProgress > 0
    ? `0 ${(2 * scrollProgress).toFixed(1)}px ${(32 * scrollProgress).toFixed(1)}px rgba(0,0,0,${(0.25 * scrollProgress).toFixed(3)})`
    : "none";
  const navBorderColor = `rgba(255,255,255,${(scrollProgress * 0.06).toFixed(3)})`;
  const navBgOpacity = scrollProgress * 0.88;
  const logoScale = 1 - scrollProgress * 0.05;

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={navReady ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        transition={{
          duration: prefersReduced ? 0 : duration.l,
          ease: ease.structural,
        }}
        className="fixed top-[36px] left-0 right-0 z-50"
        style={{
          paddingTop: `${16 - scrollProgress * 6}px`,
          paddingBottom: `${16 - scrollProgress * 6}px`,
          background: `rgba(5, 8, 22, ${navBgOpacity})`,
          backdropFilter: `blur(${scrollProgress * 20}px) saturate(${1 + scrollProgress * 0.35})`,
          WebkitBackdropFilter: `blur(${scrollProgress * 20}px) saturate(${1 + scrollProgress * 0.35})`,
          borderBottom: `1px solid ${navBorderColor}`,
          boxShadow: navShadow,
          transition: `all 350ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        <div className="container-max flex items-center justify-between gap-4">
          {/* ═══ Logo ════════════════════════════════════════════════ */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span
              data-nav-logo
              className="inline-flex shrink-0"
              style={{
                transform: `scale(${logoScale})`,
                transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                transformOrigin: "center left",
              }}
            >
              <Image
                src="/logo.png"
                alt="FinFoundry"
                width={120}
                height={150}
                className="rounded-[4px] w-9 h-auto"
                unoptimized
                priority
              />
            </span>
            <span className="font-heading font-bold text-lg sm:text-xl tracking-[-0.015em] text-foreground transition-colors duration-200">
              <span className="group-hover:text-teal-light transition-colors duration-200">Fin</span>
              <span className="group-hover:text-gold transition-colors duration-200">Foundry</span>
            </span>
          </Link>

          {/* ═══ Desktop Nav Links — centered, with hover light tracking ═══ */}
          <nav
            className="hidden lg:flex items-center gap-0.5 relative"
            onMouseLeave={() => setHoveredLink(null)}
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const isHovered = hoveredLink === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => setHoveredLink(link.href)}
                  className={`relative px-3 py-2 text-[13px] font-medium rounded-lg transition-colors whitespace-nowrap z-10 ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={{
                    transitionDuration: "200ms",
                    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  {link.label}

                  {/* ── Shared-layout hover glow pill ── */}
                  {/* Soft emerald highlight glides between links */}
                  {(isHovered || (isActive && !hoveredLink)) && (
                    <motion.span
                      layoutId="nav-glow"
                      className="absolute inset-0 rounded-lg -z-10"
                      style={{
                        background: isActive && !hoveredLink
                          ? "rgba(16, 185, 129, 0.08)"
                          : "rgba(16, 185, 129, 0.05)",
                        boxShadow: isActive && !hoveredLink
                          ? "0 0 12px -2px rgba(16, 185, 129, 0.12), inset 0 0.5px 0 rgba(255,255,255,0.04)"
                          : "0 0 8px -2px rgba(16, 185, 129, 0.08)",
                      }}
                      transition={{
                        type: "tween",
                        duration: 0.2,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                    />
                  )}

                  {/* ── Active structural bar ── */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-bar"
                      className="absolute bottom-0 left-3 right-3 h-px"
                      style={{
                        background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.4) 30%, rgba(16,185,129,0.4) 70%, transparent)",
                      }}
                      transition={{
                        type: "tween",
                        duration: 0.2,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ═══ Desktop Right Actions ════════════════════════════ */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {user ? (
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full p-0.5 pr-3 border border-white/[0.08] hover:border-teal/[0.15] bg-white/[0.03] hover:bg-white/[0.05] backdrop-blur-sm transition-all hover:shadow-[0_0_20px_-4px_rgba(16,185,129,0.1)]"
                  style={{
                    transitionDuration: "200ms",
                    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      width={30}
                      height={30}
                      className="rounded-full ring-1 ring-white/10"
                    />
                  ) : (
                    <span className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-teal/40 to-emerald-600/40 flex items-center justify-center text-xs font-semibold text-white ring-1 ring-white/10">
                      {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="text-[13px] font-medium text-muted-foreground max-w-[100px] truncate">
                    {(user.displayName || user.email?.split("@")[0] || "").split(" ")[0]}
                  </span>
                  <svg
                    className="w-3.5 h-3.5 text-muted-foreground"
                    style={{
                      transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* ═══ Profile Dropdown — Material Elevation ═════════ */}
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      variants={dropdownReveal}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/[0.08] overflow-hidden"
                      style={{
                        background: "rgba(7, 10, 26, 0.92)",
                        backdropFilter: "blur(24px) saturate(1.4)",
                        WebkitBackdropFilter: "blur(24px) saturate(1.4)",
                        boxShadow: `0 4px 16px rgba(0,0,0,0.3),
                                    0 12px 48px rgba(0,0,0,0.4),
                                    0 0 0 1px rgba(255,255,255,0.03),
                                    inset 0 1px 0 rgba(255,255,255,0.04)`,
                      }}
                    >
                      {/* User info */}
                      <div className="px-4 py-3.5 border-b border-white/[0.06]">
                        <div className="flex items-center gap-3">
                          {user.photoURL ? (
                            <Image
                              src={user.photoURL}
                              alt={user.displayName || "User"}
                              width={36}
                              height={36}
                              className="rounded-full ring-1 ring-white/10"
                            />
                          ) : (
                            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-teal/40 to-emerald-600/40 flex items-center justify-center text-sm font-semibold text-white ring-1 ring-white/10">
                              {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {user.displayName || "User"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-1.5">
                        {isAdmin && (
                          <Link
                            href="/admin/dashboard"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-teal-light rounded-lg hover:bg-white/[0.06] transition-colors"
                            style={{ transitionDuration: "150ms" }}
                          >
                            <RiShieldUserLine className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            signOut();
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-red-400 rounded-lg hover:bg-white/[0.06] transition-colors"
                          style={{ transitionDuration: "150ms" }}
                        >
                          <HiOutlineLogout className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <a
                  href="/login"
                  className="inline-flex items-center justify-center px-4 py-2 text-[13px] font-medium rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  style={{
                    transitionDuration: "200ms",
                    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  Sign In
                </a>
                <a
                  href="/login?mode=register"
                  className="btn-primary inline-flex items-center justify-center px-5 py-2 text-[13px] rounded-lg"
                >
                  Join FinFoundry
                </a>
              </>
            )}
          </div>

          {/* ═══ Mobile Menu Toggle ═══════════════════════════════ */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 -mr-2 text-foreground hover:bg-white/[0.06] rounded-lg transition-colors duration-200"
            aria-label="Toggle menu"
          >
            <motion.span
              key={mobileOpen ? "close" : "open"}
              initial={{ opacity: 0, rotate: mobileOpen ? -90 : 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: ease.micro }}
              className="block"
            >
              {mobileOpen
                ? <IoCloseOutline className="w-6 h-6" />
                : <HiOutlineMenuAlt3 className="w-6 h-6" />}
            </motion.span>
          </button>
        </div>
      </motion.header>

      {/* ═══ Mobile Drawer ═══════════════════════════════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: duration.m, ease: ease.structural }}
              className="absolute right-0 top-0 bottom-0 w-[280px] sm:w-[300px] flex flex-col"
              style={{
                background: "rgba(5, 8, 22, 0.94)",
                backdropFilter: "blur(24px) saturate(1.3)",
                WebkitBackdropFilter: "blur(24px) saturate(1.3)",
                borderLeft: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "-8px 0 40px rgba(0,0,0,0.4)",
              }}
            >
              {/* Mobile nav links */}
              <div className="flex-1 overflow-y-auto px-4 pt-20 pb-4">
                <div className="flex flex-col gap-1">
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: i * 0.04 + 0.1,
                        duration: 0.3,
                        ease: ease.structural,
                      }}
                    >
                      <Link
                        href={link.href}
                        className={`block px-4 py-3 text-[15px] font-medium rounded-xl transition-all duration-200 ${
                          pathname === link.href
                            ? "text-foreground bg-white/[0.06]"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Mobile bottom actions */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3, ease: ease.structural }}
                className="p-4 pt-3 border-t border-white/[0.06] space-y-2.5"
              >
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-2 py-3 mb-1">
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt={user.displayName || "User"}
                          width={36}
                          height={36}
                          className="rounded-full ring-1 ring-white/10 shrink-0"
                        />
                      ) : (
                        <span className="w-9 h-9 rounded-full bg-gradient-to-br from-teal/40 to-emerald-600/40 flex items-center justify-center text-sm font-semibold text-white ring-1 ring-white/10 shrink-0">
                          {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.displayName || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <a
                        href="/admin/dashboard"
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 text-sm font-medium rounded-xl text-teal-light border border-teal/20 hover:bg-teal/[0.06] transition-colors duration-200"
                      >
                        <RiShieldUserLine className="w-4 h-4" />
                        Admin Panel
                      </a>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="flex items-center justify-center gap-2 w-full px-6 py-3 text-sm font-medium rounded-xl text-muted-foreground border border-white/[0.08] hover:text-red-400 hover:border-red-400/20 hover:bg-red-400/[0.04] transition-colors duration-200"
                    >
                      <HiOutlineLogout className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href="/login"
                      className="btn-ghost flex items-center justify-center w-full px-6 py-3 text-sm font-semibold rounded-xl text-foreground"
                    >
                      Sign In
                    </a>
                    <a
                      href="/login?mode=register"
                      className="btn-primary flex items-center justify-center w-full px-6 py-3 text-sm font-semibold rounded-xl"
                    >
                      Join FinFoundry
                    </a>
                  </>
                )}
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
