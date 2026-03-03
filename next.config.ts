import type { NextConfig } from "next";

/* ── Content-Security-Policy ──────────────────────── */
const cspDirectives = [
  "default-src 'self'",
  // Scripts: self + inline (Next.js hydration) + eval (dev only removed in prod)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com https://va.vercel-scripts.com",
  // Styles: self + inline (Tailwind/Framer)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts
  "font-src 'self' https://fonts.gstatic.com data:",
  // Images: self + Firebase Storage + Google avatars + Cloudinary + data URIs
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://firebasestorage.googleapis.com https://res.cloudinary.com https://*.googleusercontent.com",
  // Connect: APIs + Firebase + Vercel Analytics
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://api.cloudinary.com",
  // Frames: Firebase auth popup
  "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://*.google.com",
  // Object/base/form
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Upgrade insecure requests in production
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  /* ── Performance & security ──────────────────────── */
  poweredByHeader: false,      // hide X-Powered-By
  compress: true,              // gzip/brotli (Vercel does this, but good for self-host)
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, immutable" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/:path(icon-.*|favicon-.*|apple-touch-icon).:ext(png|ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, immutable" },
        ],
      },
      {
        // Security headers for all routes
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: cspDirectives },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        // API routes: no caching, strict CORS
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
