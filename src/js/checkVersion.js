import toast from "/src/js/toast.js";

export default async function checkVersion(refresh = true, showToast = false) {
  console.log("refresh", refresh, "showToast", showToast);
  async function hardRefresh() {
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cache) => caches.delete(cache)));
        console.log("Cache eliminata! Ora la ripristino...");
        navigator.serviceWorker.controller.postMessage("updateCache");
        console.log("Cache ripristinata! Ricarico la pagina...");
        window.location.reload();
      } catch (err) {
        console.error("Errore nella cancellazione cache:", err);
        window.location.reload();
      }
    } else {
      console.warn("Il browser non supporta le cache. Faccio solo il reload.");
      window.location.reload();
    }
  }

  try {
    const response = await fetch(
      "https://gematsam-x.github.io/NotableBiblePoints/version.json",
      { cache: "no-store" }
    );
    const data = await response.json();
    const latestVersion = data.version;
    const currentVersion = localStorage.getItem("appVersion");

    if (currentVersion && currentVersion !== latestVersion) {
      console.log(
        `Nuova versione disponibile! (${currentVersion} → ${latestVersion})`
      );
      if (showToast)
        toast(
          `Nuova versione disponibile (${currentVersion} → ${latestVersion}). Per aggiornare, ricarica la pagina.`,
          2000
        );

      /**
       * Controlla se la connessione è accettabile (ping < 600ms)
       * @returns {Promise<boolean>}
       */
      async function isConnectionDecent() {
        if (!navigator.onLine) return false;
        const url = "https://gematsam-x.github.io/NotableBiblePoints/ping.txt";
        const start = performance.now();

        try {
          await fetch(url, {
            method: "HEAD",
            cache: "no-store",
            mode: "no-cors",
          });

          const ping = performance.now() - start;
          console.log(`Ping: ${Math.round(ping)}ms`);

          return ping < 600; // true se buona o discreta
        } catch (err) {
          console.warn("Errore di rete:", err);
          return false; // connessione assente o errore
        }
      }

      localStorage.setItem("appVersion", latestVersion);
      if (refresh && (await isConnectionDecent()))
        window.setTimeout(hardRefresh, 1000);
    } else if (!currentVersion) {
      localStorage.setItem("appVersion", latestVersion);
    } else {
      if (showToast)
        toast(
          `La versione corrente (${localStorage.getItem(
            "appVersion"
          )}) è già aggiornata.`,
          2000
        );

      console.log("Versione aggiornata, nessuna azione necessaria");
    }
  } catch (err) {
    console.error("Errore durante il controllo della versione:", err);
  }
}
