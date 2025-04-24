export default async function checkVersion() {
  async function hardRefresh() {
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cache) => caches.delete(cache)));
        console.log("Cache eliminata! Ora ricarico la pagina...");
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

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const response = await fetch("../../version.json", { cache: "no-store" });
      const data = await response.json();
      const latestVersion = data.version;
      const currentVersion = localStorage.getItem("appVersion");

      if (currentVersion && currentVersion !== latestVersion) {
        console.log(
          `Nuova versione disponibile! (${currentVersion} → ${latestVersion})`
        );
        localStorage.setItem("appVersion", latestVersion);
        window.setTimeout(hardRefresh, 1000);
      } else if (!currentVersion) {
        localStorage.setItem("appVersion", latestVersion);
      } else {
        console.log("Versione aggiornata, nessuna azione necessaria");
      }
    } catch (err) {
      console.error("Errore durante il controllo della versione:", err);
    }
  });
}
