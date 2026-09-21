/* Ozellar All Right Inspection — offline app-shell service worker.
   This file must be a real, separately-hosted script at the app's own
   web address for the browser to accept it (this is a browser security
   rule: a service worker cannot be registered from a blob: or data: URL,
   only from a real http/https file). That's exactly what a hosted Claude
   artifact link can't provide on its own, since it serves a single page
   with no second file alongside it — which is why this file has to live
   next to index.html on real static hosting (GitHub Pages, Netlify,
   Cloudflare Pages, Vercel, etc.) for offline cold-starts to work.

   Strategy: try the network first so the app always gets the latest
   version when online; if the network is unavailable, fall back to the
   last successful copy of the app shell saved in this cache. */

var CACHE = 'ozellar-app-shell-v1';

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return fetch(self.registration.scope, { cache: 'reload' })
        .then(function (res) { return cache.put(self.registration.scope, res); })
        .catch(function () {});
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request)
      .then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(self.registration.scope, copy); });
        return res;
      })
      .catch(function () {
        return caches.match(self.registration.scope).then(function (cached) {
          return cached || Response.error();
        });
      })
  );
});
