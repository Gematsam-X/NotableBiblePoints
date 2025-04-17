const CACHE_NAME = "notablebiblepoints-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./src/login.css",
  "./src/styles.css",
  "./src/assets/favicon.ico",
  "./src/assets/avatar/dark.webp",
  "./src/assets/avatar/light.webp",
  "./src/assets/account/logout/light.webp",
  "./src/assets/account/logout/dark.webp",
  "./src/assets/account/delete/light.webp",
  "./src/assets/account/delete/dark.webp",
  "./src/assets/account/backup/create/dark.webp",
  "./src/assets/account/backup/create/light.webp",
  "./src/assets/account/backup/restore/dark.webp",
  "./src/assets/account/backup/restore/light.webp",
  "./src/assets/notes/share/dark.webp",
  "./src/assets/notes/share/light.webp",
  "./src/assets/notes/edit/dark.webp",
  "./src/assets/notes/edit/light.webp",
  "./src/assets/notes/delete/dark.webp",
  "./src/assets/notes/delete/light.webp",
  "./src/assets/notes/refresh/dark.webp",
  "./src/assets/notes/refresh/light.webp",
  "./src/assets/fonts/Cinzel-Bold.woff2",
  "./src/assets/fonts/FiraSansCondensed-SemiBold.woff2",
  "./src/assets/fonts/FiraSansCondensed-ExtraBold.ttf",
  "./src/assets/loadingGif/loading.gif",
  "./src/assets/lens/light.webp",
  "./src/assets/lens/dark.webp",
  "./src/html/accessRestricted.html",
  "./src/html/account.html",
  "./src/html/chapters.html",
  "./src/html/login.html",
  "./src/html/main.html",
  "./src/html/notes.html",
  "./src/js/backendlessInit.js",
  "./src/js/referrer.js",
  "./src/js/rememberMe.js",
  "./src/js/auth.js",
  "./src/js/legend.js",
  "./src/js/theme.js",
  "./src/js/backup.js",
  "./src/js/main.js",
  "./src/js/logoutAndDelete.js",
  "./src/js/accountEventListeners.js",
  "./src/js/isDarkTheme.js",
  "./src/js/injectChapters.js",
  "./src/js/notes.js",
  "./src/js/chaptersAndNotesReferrer.js",
  "./src/js/return.js",
  "./src/js/toast.js",
  "./src/js/loadingGif.js",
  "./src/js/toggleLoginSignup.js",
  "./src/js/recovery.js",
  "./src/js/searchbar.js",
  "./src/js/verifyChapterNotes.js",
  "./src/js/online.js",
  "./src/js/idb.js",
  "./src/js/indexedDButils.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of urlsToCache) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn("Errore nel caching di:", asset, err);
        }
      }
    })
  );
});

// Attivazione del service worker
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch: recupera risorse dalla cache o dalla rete
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Rispondi con la cache se trovata, altrimenti fai una richiesta di rete
      console.log(cachedResponse || fetch(event.request));
      return cachedResponse || fetch(event.request);
    })
  );
});

// Aggiornamenti automatici: controlla se ci sono nuove versioni del service worker
self.addEventListener("message", (event) => {
  if (event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});
