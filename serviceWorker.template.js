const CACHE_NAME = "notable-bible-v1";
const urlsToCache = __ASSETS_TO_CACHE__;

// Funzione riutilizzabile per aggiornare la cache
async function cacheAssets() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    urlsToCache.map((asset) =>
      cache.add(asset).catch((err) => {
        console.warn("Errore nel caching di:", asset, err);
      })
    )
  );
}

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(cacheAssets());
});

// Activate: pulizia delle vecchie cache
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

// Fetch: rete o cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

// Message: aggiorna cache o forza skipWaiting
self.addEventListener("message", (event) => {
  if (event.data?.action === "skipWaiting") {
    self.skipWaiting();
  } else if (event.data?.action === "updateCache") {
    cacheAssets();
  }
});
