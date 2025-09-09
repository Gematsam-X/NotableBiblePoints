import "/src/drawer.css";
import "/src/icons.css";
import checkVersion from "/src/js/checkVersion.js";
import "/src/styles.css";
import toast from "/src/js/toast.js";

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
      try {
        toast("Libro selezionato: " + cell.dataset.name);
        const bookName = cell.dataset.name; // Prendiamo il nome dal data-name
        sessionStorage.setItem("selectedBook", bookName); // Salviamo in sessionStorage
        window.location.href = "/src/html/chapters.html"; // Reindirizziamo alla pagina dei capitoli
      } catch (e) {
        console.error("Errore durante la selezione del libro:", e);
      }
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
