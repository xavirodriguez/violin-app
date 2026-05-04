/* global self, caches, fetch */
const CACHE_NAME = 'violin-mentor-v1'
const ASSETS_TO_CACHE = ['/', '/index.html', '/manifest.json', '/favicon.ico']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE)
    }),
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      return fetch(event.request).then((fetchResponse) => {
        // Cache audio samples and MusicXML files dynamically
        if (
          fetchResponse.ok &&
          (event.request.url.endsWith('.mp3') ||
            event.request.url.endsWith('.wav') ||
            event.request.url.endsWith('.xml'))
        ) {
          const responseClone = fetchResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return fetchResponse
      })
    }),
  )
})
