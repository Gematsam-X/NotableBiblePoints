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
  console.log("Nel listener di DOMCONTENTLOADED del click sul libro");
  const booksCells = document.querySelectorAll(".periodic-table td");
  console.log("booksCells:", booksCells);
  console.log("booksCells è lungo:", booksCells.length);

  booksCells.forEach((cell) => {
    console.log("nel foreach delle bookscell. Cella attuale:", cell);
    cell.addEventListener("click", () => {
      console.log("Cliccato sulla cella:", cell);
      try {
        toast("Libro selezionato: " + cell.dataset.name);
        const bookName = cell.dataset.name; // Prendiamo il nome dal data-name
        sessionStorage.setItem("selectedBook", bookName); // Salviamo in sessionStorage
        console.log("Ecco l'interno sessionStorage:", sessionStorage);
        console.log(
          "Ed ecco quello che si ottiene provando a prendere il selecetedBook:",
          sessionStorage.getItem("selectedBook")
        );
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
