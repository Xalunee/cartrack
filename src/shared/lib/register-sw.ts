const RELOAD_GUARD_KEY = 'sw-reload-once'

export function registerServiceWorker() {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    process.env.NODE_ENV === 'production'
  ) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type !== 'SW_UPDATED') return
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
