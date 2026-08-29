// Bumped to v5 to drop caches poisoned by the bug fixed below: /api/support
// fell through to the cache-first branch and its first (empty) response was
// pinned in STATIC_CACHE forever. Renaming the caches is what evicts it from
// browsers that already stored it.
const CACHE_NAME = 'cartrack-v5'
const STATIC_CACHE = 'cartrack-static-v5'
const API_CACHE = 'cartrack-api-v4'
const CURRENT_CACHES = [CACHE_NAME, STATIC_CACHE, API_CACHE]

// Static assets to precache
const PRECACHE_URLS = ['/', '/dashboard', '/maintenance', '/mileage', '/events', '/settings', '/offline']

// API routes to cache
const CACHEABLE_API = ['/api/car', '/api/maintenance', '/api/mileage', '/api/events', '/api/user']

// Minimal inline fallback — guarantees a Russian response even if /offline isn't cached
const FALLBACK_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Нет подключения — CarTrack</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0a0a0a; color: #fafafa; }
  @media (prefers-color-scheme: light) { body { background: #ffffff; color: #0a0a0a; } }
  .card { text-align: center; max-width: 320px; padding: 2rem; }
  h1 { font-size: 1.125rem; font-weight: 600; margin: 0 0 0.5rem; }
  p { font-size: 0.875rem; opacity: 0.7; margin: 0 0 1.5rem; }
  button { font: inherit; padding: 0.5rem 1rem; border-radius: 0.375rem; border: 1px solid currentColor; background: transparent; color: inherit; cursor: pointer; }
</style>
</head>
<body>
<div class="card">
  <h1>Страница недоступна</h1>
  <p>Не удалось загрузить страницу. Проверьте подключение к интернету и попробуйте снова.</p>
  <button onclick="location.reload()">Обновить</button>
</div>
</body>
</html>`

function fallbackResponse() {
  return new Response(FALLBACK_HTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

// Install — precache core pages, never fail the whole install if one URL fails
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          try {
            await cache.add(url)
          } catch (e) {
            console.warn('[SW] precache failed:', url, e)
          }
        })
      )
    )
  )
  self.skipWaiting()
})

// Activate — delete every cache not in the current set, notify clients to refresh
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names.filter((name) => !CURRENT_CACHES.includes(name)).map((name) => caches.delete(name))
      )
      await self.clients.claim()

      const clients = await self.clients.matchAll({ type: 'window' })
      clients.forEach((c) => c.postMessage({ type: 'SW_UPDATED' }))
    })()
  )
})

// Fetch handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never intercept auth routes — CSRF tokens and session cookies must flow freely
  if (url.pathname.startsWith('/api/auth')) return

  // Content-hashed Next.js static assets: safe to cache-first indefinitely
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone))
            }
            return response
          })
          .catch(() => fallbackResponse())
      })
    )
    return
  }

  // Everything else under /_next/ (data, RSC payloads) changes every deploy — network-first, never cached
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(fetch(event.request).catch(() => fallbackResponse()))
    return
  }

  // API requests: network first, cache fallback (GET only)
  if (CACHEABLE_API.some((path) => url.pathname.startsWith(path))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok && event.request.method === 'GET') {
            const clone = response.clone()
            caches.open(API_CACHE).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => {
          if (event.request.method !== 'GET') {
            return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
              headers: { 'Content-Type': 'application/json' },
              status: 503,
            })
          }
          return caches.match(event.request).then((cached) => {
            if (cached) return cached
            return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
              headers: { 'Content-Type': 'application/json' },
              status: 503,
            })
          })
        })
    )
    return
  }

  // Any other API route: straight to the network, never cached.
  //
  // Without this, an API route that is not listed in CACHEABLE_API falls all the
  // way through to the cache-first branch at the bottom — which is meant for
  // static assets. A same-origin fetch() has mode 'cors', not 'navigate', so
  // nothing above catches it. The first response for that URL then gets stored
  // and replayed forever: /api/support answered with an empty list before the
  // user had written anything, and every later request was served that same
  // empty list, so their own tickets never appeared.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(JSON.stringify({ error: 'Offline', offline: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
          })
      )
    )
    return
  }

  // Navigation requests: network first → cache for this URL → /offline → hardcoded fallback (never undefined)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (event.request.method === 'GET' && response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(event.request)
          if (cached) return cached

          const offline = await caches.match('/offline')
          if (offline) return offline

          return fallbackResponse()
        })
    )
    return
  }

  // Other requests (static assets): cache first, network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request)
        .then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => new Response('', { status: 404 }))
    })
  )
})
