import checkVersion from "./checkVersion.js";

document
  .querySelector(".help")
  .addEventListener("click", () => (window.location.href = "onboarding.html"));

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

checkVersion();
