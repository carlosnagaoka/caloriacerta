// CaloriaCerta Service Worker v3
// Strategy:
//   /_next/static/*  → Cache-first (imutável, hashed)
//   pages HTML       → Network-only (NUNCA cachear HTML — referencia chunk hashes novos a cada deploy)
//   images/icons     → Cache-first
//   /api/*           → Pass-through
//   offline fallback → /offline (somente quando sem rede)

const CACHE_VERSION = 'v3'
const STATIC_CACHE  = `cc-static-${CACHE_VERSION}`
const ALL_CACHES    = [STATIC_CACHE]

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
      .then(cache => cache.addAll(PRECACHE).catch(() => {})) // ignora falhas de pré-cache
      .then(() => self.skipWaiting())
  )
})

// ── Activate — limpa caches velhos ───────────────────────────────────────────
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

  // Somente GET do próprio domínio
  if (request.method !== 'GET') return
  if (url.origin !== location.origin) return

  // Nunca interceptar: API, auth, dados RSC
  if (url.pathname.startsWith('/api/'))        return
  if (url.pathname.startsWith('/auth/'))       return
  if (url.pathname.startsWith('/_next/data/')) return

  // Next.js static assets (hashed) → cache-first para sempre
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Imagens e fontes públicas → cache-first
  if (/\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Páginas HTML → SEMPRE buscar da rede. Offline: mostra /offline.
  // Nunca cachear HTML porque os chunk hashes mudam a cada deploy.
  if (request.mode === 'navigate') {
    event.respondWith(networkOnlyNav(request))
    return
  }
})

// ── Estratégias ───────────────────────────────────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Asset unavailable offline', { status: 503 })
  }
}

async function networkOnlyNav(request) {
  try {
    return await fetch(request)
  } catch {
    // Sem rede → mostra página offline
    const offline = await caches.match('/offline')
    return offline || new Response('Você está offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
