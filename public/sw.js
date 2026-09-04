// This worker exists only to remove itself.
//
// CarTrack used to ship a real service worker, and its navigation handler was
// network-first: every cold launch of the installed PWA had to wait for the
// worker to boot *and* for a full server response before the browser had any
// HTML to paint. On iOS that gap was most of a ten-second blank screen, and the
// cache it filled bought nothing — a navigation was never served from it unless
// the network had already failed. Offline support was not worth that price.
//
// Deleting public/sw.js would not have removed anything: a registered worker
// keeps controlling its clients until the browser fetches a *new* script at the
// same URL, and a 404 there leaves the old one in place. So the file stays, and
// what it does now is unregister and take its caches with it.
//
// Keep this shipping for at least a few releases. Every installed client has to
// launch once to pick it up, and phones that sat unopened for a month have not
// had their turn yet.

self.addEventListener('install', () => {
  // Straight past the waiting state: the old worker is what we are here to
  // replace, so there is nothing to be gained by letting it serve another page.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.map((name) => caches.delete(name)))

      // `skipWaiting` only moves this worker to activated — pages that are
      // already open keep the *old* worker as their controller until they are
      // claimed or navigate. Without this line the launch that first picks up
      // the tombstone would still spend its whole session on the old
      // network-first navigation handler.
      await self.clients.claim()

      // Claim before unregister: once the registration is gone there is no
      // active worker left to hand those clients over to.
      await self.registration.unregister()

      // No reload is forced from here. Claiming already routes open pages
      // straight to the network, and `unregister` takes care of every later
      // launch, so navigating clients would only throw away whatever the
      // person was in the middle of typing.
    })()
  )
})
