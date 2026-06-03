const CACHE_NAME = 'cartrack-v3'
const STATIC_CACHE = 'cartrack-static-v3'
const API_CACHE = 'cartrack-api-v2'

// Static assets to precache
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/maintenance',
  '/mileage',
  '/events',
  '/settings',
  '/offline',
]

// API routes to cache
const CACHEABLE_API = [
  '/api/car',
  '/api/maintenance',
  '/api/mileage',
  '/api/events',
  '/api/user',
]

// Install — precache core pages
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Some pages may fail to cache, that's ok
        console.log('Some precache URLs failed')
      })
    })
  )
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never intercept auth routes — CSRF tokens and session cookies must flow freely
  if (url.pathname.startsWith('/api/auth')) return

  // API requests: network first, cache fallback
  if (CACHEABLE_API.some((path) => url.pathname.startsWith(path))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only cache successful GET responses
          if (response.ok && event.request.method === 'GET') {
            const clone = response.clone()
            caches.open(API_CACHE).then((cache) => {
              cache.put(event.request, clone)
            })
          }
          return response
        })
        .catch(() => {
          // Offline — try cache
          return caches.match(event.request).then((cached) => {
            if (cached) return cached
            // Return empty JSON if no cache
            return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
              headers: { 'Content-Type': 'application/json' },
              status: 503,
            })
          })
        })
    )
    return
  }

  // Navigation requests: network first, cache fallback, then offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only cache GET navigations — POST (form submits) cannot be cached
          if (event.request.method === 'GET') {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, clone)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/offline')
          })
        })
    )
    return
  }

  // Other requests (static assets): cache first, network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        // Cache static assets
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone()
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, clone)
          })
        }
        return response
      }).catch(() => {
        // Return nothing for failed static asset requests
        return new Response('', { status: 404 })
      })
    })
  )
})
