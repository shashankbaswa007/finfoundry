/* ═══════════════════════════════════════════════════════════════════
 * FinFoundry Service Worker — Offline-first PWA support
 *
 * Caches the offline page + essential assets so the app degrades
 * gracefully when the user has no internet connection.
 *
 * Strategy:
 *   - Install: precache /offline + icon
 *   - Activate: clean old caches
 *   - Fetch (navigate): network-first, fall back to /offline
 *   - Fetch (other): network-only (Next.js handles its own caching)
 * ═══════════════════════════════════════════════════════════════════ */

const CACHE_NAME = "finfoundry-offline-v1";
const OFFLINE_URL = "/offline";

const PRECACHE = [OFFLINE_URL, "/icon-192x192.png", "/icon-512x512.png"];

/* ── Install ─────────────────────────────────────── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate & clean old caches ────────────────── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ── Fetch — navigation = network-first ─────────── */
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL).then((cached) => cached || new Response("Offline", { status: 503 }))
    )
  );
});
