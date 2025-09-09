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

// Versione definitiva a prova di Safari e dinamica
window.addEventListener("load", () => {

  // Troviamo la tabella principale
  const table = document.querySelector(".periodic-table");
  if (!table) {
    console.error(
      "❌ Tabella non trovata! Controlla che ci sia un elemento con classe 'periodic-table'"
    );
    return;
  }

  // Event delegation: il click viene intercettato a livello di tabella
  table.addEventListener("click", (event) => {
    const cell = event.target.closest("td"); // Prendiamo la cella cliccata
    if (!cell) {
      return;
    }

    // Prendiamo il data-name
    const bookName = cell.dataset.name;
    if (!bookName) {
      console.warn("⚠️ La cella cliccata non ha l'attributo data-name");
      return;
    }

    try {
      sessionStorage.setItem("selectedBook", bookName);
      window.location.href = "/src/html/chapters.html";
    } catch (e) {
      console.error("❌ Errore durante la selezione del libro:", e);
    }
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
