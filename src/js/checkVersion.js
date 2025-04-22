export default async function checkVersion() {
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
          await hardRefresh();
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