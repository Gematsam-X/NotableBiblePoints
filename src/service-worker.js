const CACHE_NAME = "notablebiblepoints-cache-v1";
const urlsToCache = [
  "./",
  "./assets/favicon.ico",
  "./assets/avatar/dark.webp",
  "./assets/avatar/light.webp",
  "./assets/account/logout/light.webp",
  "./assets/account/logout/dark.webp",
  "./assets/account/delete/light.webp",
  "./assets/account/delete/dark.webp",
  "./assets/account/backup/create/dark.webp",
  "./assets/account/backup/create/light.webp",
  "./assets/account/backup/restore/dark.webp",
  "./assets/account/backup/restore/light.webp",
  "./assets/notes/share/dark.webp",
  "./assets/notes/share/light.webp",
  "./assets/notes/edit/dark.webp",
  "./assets/notes/edit/light.webp",
  "./assets/notes/delete/dark.webp",
  "./assets/notes/delete/light.webp",
  "./assets/notes/refresh/dark.webp",
  "./assets/notes/refresh/light.webp",
  "./assets/fonts/Cinzel-Bold.woff2",
  "./assets/fonts/FiraSansCondensed-SemiBold.woff2",
  "./assets/fonts/FiraSansCondensed-ExtraBold.ttf",
  "./assets/loadingGif/loading.gif",
  "./assets/lens/light.webp",
  "./assets/lens/dark.webp",
  "./assets/help/light.webp",
  "./assets/help/dark.webp",
  "./assets/drawer/open/light.webp",
  "./assets/drawer/open/dark.webp",
  "./assets/drawer/otherApps/light.webp",
  "./assets/drawer/otherApps/dark.webp",
  "./assets/drawer/rightArrow/light.webp",
  "./assets/drawer/rightArrow/dark.webp",
  "./assets/drawer/open/light.webp",
  "./assets/drawer/open/dark.webp",
  "./drawer.css",
  "./index.html",
  "./login.css",
  "./manifest.json",
  "./service-worker.js",
  "./styles.css",
  "./html/accessRestricted.html",
  "./html/account.html",
  "./html/chapters.html",
  "./html/login.html",
  "./html/notes.html",
  "./html/onboarding.html",
  "./js/accountEventListeners.js",
  "./js/auth.js",
  "./js/backendlessInit.js",
  "./js/backup.js",
  "./js/chaptersAndNotesReferrer.js",
  "./js/checkVersion.js",
  "./js/drawer.js",
  "./js/idb.js",
  "./js/indexedDButils.js",
  "./js/injectChapters.js",
  "./js/injectInstructions.js",
  "./js/isDarkTheme.js",
  "./js/isOnline.js",
  "./js/legend.js",
  "./js/loadingGif.js",
  "./js/logoutAndDelete.js",
  "./js/main-ok.js",
  "./js/notes.js",
  "./js/online.js",
  "./js/recovery.js",
  "./js/referrer.js",
  "./js/rememberMe.js",
  "./js/return.js",
  "./js/searchbar.js",
  "./js/theme.js",
  "./js/toast.js",
  "./js/toggleLoginSignup.js",
  "./js/verifyChapterNotes.js",
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
  }
});
