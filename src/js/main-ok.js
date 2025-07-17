import "/src/drawer.css";
import "/src/icons.css";
import checkVersion from "/src/js/checkVersion.js";
import "/src/styles.css";

document
  .querySelector(".help")
  .addEventListener(
    "click",
    () => (window.location.href = "/src/html/onboarding.html")
  );

document.addEventListener("DOMContentLoaded", () => {
  const booksCells = document.querySelectorAll(".periodic-table td");

  booksCells.forEach((cell) => {
    cell.addEventListener("click", () => {
      const bookName = cell.dataset.name; // Prendiamo il nome dal data-name
      sessionStorage.setItem("selectedBook", bookName); // Salviamo in sessionStorage
      window.location.href = "/src/html/chapters.html"; // Reindirizziamo alla pagina dei capitoli
    });
  });
});

// Controllo se il browser supporta i service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/serviceWorker.js").catch((error) => {
      console.error("Errore nella registrazione del service worker:", error);
    });
  });
}

checkVersion();
