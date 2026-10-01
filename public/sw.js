const CACHE_PREFIX = 'fizzix-'
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
      Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  if (e.request.method !== 'GET') return
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') return

  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
          if (res.ok) cache.put(e.request, res.clone())
          return res
        }))
      )
    )
    return
  }

  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(e.request).then((cached) => {
          const fetchPromise = fetch(e.request).then((res) => {
            if (res.ok) cache.put(e.request, res.clone())
            return res
          }).catch(() => cached || null)
          return cached || fetchPromise
        }).then((response) => {
          if (response) return response
          return caches.match('/').then((fallback) =>
            fallback || new Response('Offline - page not cached', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' },
            })
          )
        })
      )
    )
    return
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone))
        }
        return res
      })
      .catch(() =>
        caches.match(e.request).then((hit) => {
          if (hit) return hit
          return caches.match('/').then((fallback) =>
            fallback || new Response('Offline - resource not cached', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' },
            })
          )
        })
      )
  )
})
