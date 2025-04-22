import checkVersion from "./checkVersion.js";

document
  .querySelector(".account")
  .addEventListener("click", () => (window.location.href = "account.html"));
document.addEventListener("DOMContentLoaded", () => {
  const booksCells = document.querySelectorAll(".periodic-table td");

  booksCells.forEach((cell) => {
    cell.addEventListener("click", () => {
      const bookName = cell.dataset.name; // Prendiamo il nome dal data-name
      sessionStorage.setItem("selectedBook", bookName); // Salviamo in sessionStorage
      window.location.href = "chapters.html"; // Reindirizziamo alla pagina dei capitoli
    });
  });
});

// Controllo se il browser supporta i service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("../../service-worker.js")
      .then((registration) => {
        console.log("Service Worker registrato con successo: ", registration);
      })
      .catch((error) => {
        console.log("Errore nella registrazione del Service Worker: ", error);
      });
  });
}

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

checkVersion();
