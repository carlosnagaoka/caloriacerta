// CaloriaCerta Service Worker
// Strategy:
//   /_next/static/*  → Cache-first (immutable hashed files)
//   /api/*           → Network-only (never cache)
//   images/icons     → Cache-first
//   pages            → Network-first with cache fallback + offline page

const CACHE_VERSION = 'v2'
const STATIC_CACHE  = `cc-static-${CACHE_VERSION}`
const PAGES_CACHE   = `cc-pages-${CACHE_VERSION}`
const ALL_CACHES    = [STATIC_CACHE, PAGES_CACHE]

const PRECACHE = [
  '/offline',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
]

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

// ── Activate — purge old caches ──────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !ALL_CACHES.includes(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET from our origin
  if (request.method !== 'GET') return
  if (url.origin !== location.origin) return

  // Never cache API, auth, Supabase calls
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/auth/')) return
  if (url.pathname.startsWith('/_next/data/')) return // RSC payloads → always fresh

  // Next.js static assets (hashed filenames) → cache-first forever
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Public images / icons / fonts → cache-first
  if (/\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // All other navigations (pages) → network-first, fall back to cache then /offline
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNav(request))
    return
  }
})

// ── Strategies ───────────────────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Asset unavailable offline', { status: 503 })
  }
}

async function networkFirstNav(request) {
  const cache = await caches.open(PAGES_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    // Generic offline fallback
    const offline = await caches.match('/offline')
    return offline || new Response('Você está offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
