const CACHE_NAME = "notablebiblepoints-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/src/styles.css",
  "/src/drawer.css",
  "/src/icons.css",
  "/src/assets/avatar/dark.webp",
  "/src/assets/avatar/light.webp",
  "/src/assets/account/logout/light.webp",
  "/src/assets/account/logout/dark.webp",
  "/src/assets/account/delete/light.webp",
  "/src/assets/account/delete/dark.webp",
  "/src/assets/account/backup/create/dark.webp",
  "/src/assets/account/backup/create/light.webp",
  "/src/assets/account/backup/restore/dark.webp",
  "/src/assets/account/backup/restore/light.webp",
  "/src/assets/notes/share/dark.webp",
  "/src/assets/notes/share/light.webp",
  "/src/assets/notes/edit/dark.webp",
  "/src/assets/notes/edit/light.webp",
  "/src/assets/notes/delete/dark.webp",
  "/src/assets/notes/delete/light.webp",
  "/src/assets/notes/refresh/dark.webp",
  "/src/assets/notes/refresh/light.webp",
  "/src/assets/fonts/Cinzel-Bold.woff2",
  "/src/assets/fonts/FiraSansCondensed-SemiBold.woff2",
  "/src/assets/fonts/FiraSansCondensed-ExtraBold.ttf",
  "/src/assets/loadingGif/loading.gif",
  "/src/assets/lens/light.webp",
  "/src/assets/lens/dark.webp",
  "/src/assets/help/light.webp",
  "/src/assets/help/dark.webp",
  "/src/assets/drawer/open/light.webp",
  "/src/assets/drawer/open/dark.webp",
  "/src/assets/drawer/otherApps/light.webp",
  "/src/assets/drawer/otherApps/dark.webp",
  "/src/assets/drawer/rightArrow/light.webp",
  "/src/assets/drawer/rightArrow/dark.webp",
  "/src/assets/drawer/open/light.webp",
  "/src/assets/drawer/open/dark.webp",
  "/src/html/accessRestricted.html",
  "/src/html/account.html",
  "/src/html/chapters.html",
  "/src/index.html",
  "/src/html/notes.html",
  "/src/html/onboarding.html",
  "/src/js/injectInstructions.js",
  "/src/js/backendlessInit.js",
  "/src/js/referrer.js",
  "/src/js/rememberMe.js",
  "/src/js/legend.js",
  "/src/js/theme.js",
  "/src/js/backup.js",
  "/src/js/main-ok.js",
  "/src/js/accountEventListeners.js",
  "/src/js/isDarkTheme.js",
  "/src/js/injectChapters.js",
  "/src/js/notes.js",
  "/src/js/chaptersAndNotesReferrer.js",
  "/src/js/return.js",
  "/src/js/toast.js",
  "/src/js/loadingGif.js",
  "/src/js/searchbar.js",
  "/src/js/verifyChapterNotes.js",
  "/src/js/online.js",
  "/src/js/idb.js",
  "/src/js/indexedDButils.js",
  "/src/js/drawer.js"
];

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
