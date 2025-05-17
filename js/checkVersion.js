import toast from "./toast.js";

export default async function checkVersion(refresh = true, showToast = false) {
  async function isReallyOnline() {
    if (!navigator.onLine) return false;

    const start = performance.now();

    const testUrl = "../../ping.txt";

    // Costruzione della promessa con timeout
    const controller = new AbortController(); // Serve per poter "uccidere" la fetch se ci mette troppo
    const timeout = setTimeout(() => {
      controller.abort(); // KILL!
    }, 30);

    try {
      const response = await fetch(testUrl, {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal, // Colleghiamo il controller
      });

      return response.ok;
    } catch (err) {
      return false;
    } finally {
      clearTimeout(timeout); // Puliamo il timeout
      const end = performance.now();
      const duration = end - start;
      console.log("Finito il controllo della connessione in " + Math.round(duration) + " millisecondi.");
    }
  }

  // Funzione che rimuove la cache e ricarica la pagina solo se siamo online
  async function hardRefresh() {
    const online = await isReallyOnline();
    if (!online) {
      console.warn("Offline o connessione instabile. Evito hard refresh.");
      toast("Impossibile aggiornare: connessione assente o instabile.", 2500);
      return;
    }

    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cache) => caches.delete(cache)));
        console.log("Cache eliminata! Ora la ripristino...");
        navigator.serviceWorker.controller?.postMessage({
          action: "updateCache",
        });
        console.log("Cache ripristinata! Ricarico la pagina...");
        window.location.reload();
      } catch (err) {
        console.error("Errore nella cancellazione cache:", err);
        window.location.reload(); // fallback brutale
      }
    } else {
      console.warn("Il browser non supporta le cache. Faccio solo il reload.");
      window.location.reload();
    }
  }

  try {
    const response = await fetch("../version.json", { cache: "no-store" });
    const data = await response.json();
    const latestVersion = data.version;
    const currentVersion = localStorage.getItem("appVersion");

    if (currentVersion && currentVersion !== latestVersion) {
      console.log(
        `Nuova versione disponibile! (${currentVersion} → ${latestVersion})`
      );
      if (showToast)
        toast(
          `Nuova versione disponibile (${currentVersion} → ${latestVersion}). Sto aggiornando...`,
          2500
        );
      localStorage.setItem("appVersion", latestVersion);
      if (refresh) window.setTimeout(hardRefresh, 1000);
    } else if (!currentVersion) {
      localStorage.setItem("appVersion", latestVersion);
    } else {
      if (showToast)
        toast(
          `La versione corrente (${currentVersion}) è già aggiornata.`,
          2000
        );
      console.log("Versione aggiornata, nessuna azione necessaria.");
    }
  } catch (err) {
    console.error("Errore durante il controllo della versione:", err);
    if (showToast)
      toast(
        `Errore durante il controllo aggiornamenti. Dettagli: ${err}`,
        2000
      );
  }
}
