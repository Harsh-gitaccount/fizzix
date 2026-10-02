const CACHE_PREFIX = 'fizzix-'
const CACHE_NAME = 'fizzix-v1'
const PRECACHE = [
  '/',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
]

function isSameOrigin(url) {
  return url.origin === self.location.origin
}

function hasValidContentType(response, request) {
  const ct = (response.headers.get('content-type') || '').toLowerCase()
  const dest = request.destination
  if (dest === 'script' && !ct.includes('javascript') && !ct.includes('ecmascript')) return false
  if (dest === 'style' && !ct.includes('css')) return false
  return true
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.keys().then((requests) =>
        Promise.all(
          requests.map((req) =>
            cache.match(req).then((res) => {
              if (!res) return
              const ct = (res.headers.get('content-type') || '').toLowerCase()
              const url = new URL(req.url)
              const isScript = url.pathname.endsWith('.js') || url.pathname.includes('/js/')
              if (isScript && ct.includes('text/html')) return cache.delete(req)
            })
          )
        )
      )
    ).then(() =>
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  if (e.request.method !== 'GET') return
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') return
  if (!isSameOrigin(url)) return

  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
          if (res.ok && hasValidContentType(res, e.request)) cache.put(e.request, res.clone())
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
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(e.request).then((hit) => {
        const fetchPromise = fetch(e.request).then((res) => {
          if (res.ok && hasValidContentType(res, e.request)) {
            cache.put(e.request, res.clone())
          }
          return res
        }).catch(() => null)
        return hit || fetchPromise
      }).then((response) => {
        if (response) return response
        return new Response('Offline - resource not cached', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        })
      })
    )
  )
})
