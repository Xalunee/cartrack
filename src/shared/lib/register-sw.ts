const RELOAD_GUARD_KEY = 'sw-reload-once'

export function registerServiceWorker() {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    process.env.NODE_ENV === 'production'
  ) {
    // SW_UPDATED: a new worker took over, so the page should re-render against it.
    // STALE_BUILD: a chunk this page asked for came back 404, meaning the HTML
    // came from a cached shell of an older deploy — reloading fetches the
    // current shell instead of leaving the route to fail on missing chunks.
    // The guard keeps either case to one reload per session, never a loop.
    navigator.serviceWorker.addEventListener('message', (event) => {
      const type = event.data?.type
      if (type !== 'SW_UPDATED' && type !== 'STALE_BUILD') return
      if (sessionStorage.getItem(RELOAD_GUARD_KEY)) return

      sessionStorage.setItem(RELOAD_GUARD_KEY, '1')
      window.location.reload()
    })

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('SW registration failed:', err)
      })
    })
  }
}
