const CACHE_NAME = 'fizzix-v1'
const PRECACHE = [
  '/',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  if (e.request.method !== 'GET') return
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') return

  // Cache-first for immutable static assets (JS/CSS chunks)
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
          cache.put(e.request, res.clone())
          return res
        }))
      )
    )
    return
  }

  // Stale-while-revalidate for navigation (home page)
  if (e.request.mode === 'navigate' || url.pathname === '/') {
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(e.request).then((cached) => {
          const fetchPromise = fetch(e.request).then((res) => {
            if (res.ok) cache.put(e.request, res.clone())
            return res
          }).catch(() => cached)
          return cached || fetchPromise
        })
      )
    )
    return
  }

  // Network-first for everything else
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match('/')))
  )
})
