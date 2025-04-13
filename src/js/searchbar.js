import toast from "./toast.js";
import { getValue, setValue } from "./indexedDButils.js";
import { showGif, hideGif } from "./loadingGif.js";

const toggleSearchMode = document.getElementById("toggleSearchMode");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const resultsModal = document.getElementById("results-modal");
const resultsContent = document.getElementById("results-content");
const closeModalButton = document.getElementById("close-modal");

let notesData = await getValue("userNotes");

// Funzione principale di ricerca
async function handleSearch() {
  if (toggleSearchMode.checked) {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
      toast("Inserisci una parola o una frase da cercare.");
      resultsModal.style.display = "none";
      return;
    }

    // Prevent XSS attacks
    if (/[<>&"']/.test(searchTerm)) {
      toast("Inserisci un termine di ricerca valido.");
      resultsModal.style.display = "none";
      return;
    }
    const matches = await searchInJson(searchTerm); // Attende il risultato della ricerca
    if (matches.length) {
      // Se ci sono occorrenze
      resultsContent.innerHTML = `<h2>Occorrenze trovate:</h2>${matches.join(
        "<br>"
      )}`;
      searchInput.blur();
    } else {
      // Se non ci sono occorrenze
      toast(`Nessuna occorrenza trovata per "${searchTerm}".`);
      resultsModal.style.display = "none";
      return;
    }
  } else {
    checkBibleBook();
  }
}

// Funzione per cercare nel file JSON
async function searchInJson(searchTerm) {
  if (!notesData || !notesData.length) {
    if (navigator.onLine) {
      showGif();
      notesData = (
        await Backendless.Data.of("NotableBiblePoints").findFirst()
      ).NotablePoints.filter(
        (note) => note.owner === localStorage.getItem("userEmail")
      );
      await setValue("userNotes", notesData);
      console.log(await getValue("userNotes"));
      hideGif();
    } else {
      alert("Connettersi a Internet.");
      return [];
    }
  }

  const results = [];

  const searchTermEscaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const searchTermRegex = new RegExp(`\\b${searchTermEscaped}`, "gi");

  for (const entry of notesData) {
    // Match nel contenuto e nel titolo
    const contentMatches = [...entry.content.matchAll(searchTermRegex)];
    const titleMatches = [...entry.title.matchAll(searchTermRegex)];

    const contentCount = contentMatches.length;
    const titleCount = titleMatches.length;
    const totalMatches = contentCount + titleCount;

    if (totalMatches === 0) continue;

    const highlightedTitle = entry.title.replace(
      searchTermRegex,
      (match) => `<mark>${match}</mark>`
    );

    const matchedContexts = [];

    // Contesto se ci sono match nel contenuto
    if (contentCount > 0) {
      const lines = entry.content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (searchTermRegex.test(lines[i])) {
          const context = [
            lines[i - 2] || "",
            lines[i - 1] || "",
            lines[i].replace(
              searchTermRegex,
              (match) => `<mark>${match}</mark>`
            ),
            lines[i + 1] || "",
            lines[i + 2] || "",
          ]
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .join("<br>");
          matchedContexts.push(context);
        }
      }
    }

    // Anteprima se solo titolo matcha
    let contentPreview = "";
    if (matchedContexts.length === 0) {
      const previewLines = entry.content
        .split("\n")
        .slice(0, 5) // prime 3 righe
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join("<br>");
      contentPreview = `<div class="content-preview">${previewLines}</div>`;
    }

    // Costruzione HTML
    const resultHtml = `
      <div class="search-result">
        <a class="redirect-link" data-book="${entry.book}" data-chapter="${
      entry.chapter
    }" data-id="${entry.id}">
          <h2><strong>${entry.book} ${entry.chapter}:${
      entry.verse
    }</strong></h2>
        </a>
        <h3><strong>${highlightedTitle}</strong></h3><br>
        ${
          matchedContexts.length > 0
            ? `<div class="matched-contexts">${matchedContexts.join(
                "<br><hr class='dashed'><br>"
              )}</div>`
            : contentPreview
        }
      </div>
      <br><hr class="normal"><br>
    `;

    // Priorità
    let priority = 0;
    if (titleCount > 0 && contentCount > 0) priority = 2;
    else if (titleCount > 0) priority = 1;

    results.push({
      html: resultHtml,
      matchScore: totalMatches,
      priority: priority,
    });
  }

  results.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.matchScore - a.matchScore;
  });

  const matches = results.map((r) => r.html);
  resultsModal.style.display = "block";
  return matches;
}

function redirectToNote(book, chapter, id) {
  sessionStorage.setItem("selectedBook", book);
  sessionStorage.setItem("selectedChapter", chapter);
  sessionStorage.setItem("selectedNoteId", id);
  console.log(
    sessionStorage.getItem("selectedNoteId"),
    sessionStorage.getItem("selectedChapter")
  );
  window.location.href = "../html/notes.html";
}

// Osserva cambiamenti nel contenuto della modale
const observer = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
      // Aggiunge listener a tutti i nuovi link con classe .redirect-link
      document.querySelectorAll(".redirect-link").forEach((link) => {
        if (!link.dataset.listenerAdded) {
          link.addEventListener("click", () => {
            const book = link.dataset.book;
            const chapter = link.dataset.chapter;
            const id = link.dataset.id;
            redirectToNote(book, chapter, id);
          });
          link.dataset.listenerAdded = "true"; // Evita duplicazioni
        }
      });
    }
  }
});

// Avvia l'osservatore sulla modale dei risultati
observer.observe(resultsModal, { childList: true, subtree: true });

// Listener per il tasto di ricerca
searchButton.addEventListener("click", handleSearch);

const bibleBooks = [
  "Genesi",
  "Esodo",
  "Levitico",
  "Numeri",
  "Deuteronomio",
  "Giosuè",
  "Giudici",
  "Rut",
  "1 Samuele",
  "2 Samuele",
  "1 Re",
  "2 Re",
  "1 Cronache",
  "2 Cronache",
  "Esdra",
  "Neemia",
  "Ester",
  "Giobbe",
  "Salmi",
  "Proverbi",
  "Ecclesiaste",
  "Cantico dei Cantici",
  "Isaia",
  "Geremia",
  "Lamentazioni",
  "Ezechiele",
  "Daniele",
  "Osea",
  "Gioele",
  "Amos",
  "Abdia",
  "Giona",
  "Michea",
  "Naum",
  "Abacuc",
  "Sofonia",
  "Aggeo",
  "Zaccaria",
  "Malachia",
  "Matteo",
  "Marco",
  "Luca",
  "Giovanni",
  "Atti",
  "Romani",
  "1 Corinti",
  "2 Corinti",
  "Galati",
  "Efesini",
  "Filippesi",
  "Colossesi",
  "1 Tessalonicesi",
  "2 Tessalonicesi",
  "1 Timoteo",
  "2 Timoteo",
  "Tito",
  "Filemone",
  "Ebrei",
  "Giacomo",
  "1 Pietro",
  "2 Pietro",
  "1 Giovanni",
  "2 Giovanni",
  "3 Giovanni",
  "Giuda",
  "Rivelazione",
];

function checkBibleBook() {
  if (!searchInput) {
    toast(
      "Inserisci un riferimento biblico valido (es. Genesi 1:1 o Genesi 1 1)."
    );
    return;
  }

  const parts = searchInput.value.split(/[\s:]+/); // Dividi su spazio o ":"
  const bookInput = parts[0].trim(); // Libro
  const chapterInput = parts[1]?.trim(); // Capitolo (se presente)

  // Normalizzazione dell'input
  const sanitizedInput = bookInput.toLowerCase().replace(/\s+/g, "");
  const matches = bibleBooks.filter((book) =>
    book.toLowerCase().replace(/\s+/g, "").startsWith(sanitizedInput)
  );

  if (sanitizedInput === "") {
    toast(
      "Digita il libro biblico ed eventualmente il capitolo nel campo in basso a destra. Puoi anche digitare solo le iniziali del libro (es. 'Gen' per 'Genesi').",
      4800
    );
    return;
  }

  if (matches.length === 1 || sanitizedInput === "salmo") {
    const bookName = sanitizedInput === "salmo" ? "Salmi" : matches[0];

    // Salvataggio del nome del libro nel sessionStorage
    sessionStorage.setItem("selectedBook", bookName);

    // Salvataggio del numero del libro nel sessionStorage (per riferimento futuro)
    const bookIndex = bibleBooks.indexOf(bookName);
    sessionStorage.setItem("selectedBook", bibleBooks[bookIndex]);

    // Se c'è il capitolo, reindirizza a notes.html
    if (chapterInput && !isNaN(chapterInput)) {
      sessionStorage.setItem("selectedChapter", parseInt(chapterInput));
      window.location.href = "notes.html";
    } else {
      // Se solo il libro, reindirizza a chapters.html
      window.location.href = "chapters.html";
    }
  } else if (matches.length > 1) {
    toast(
      `Il testo fornito non è univoco. Forse intendevi: ${matches.join(" - ")}`
    );
  } else {
    toast(
      "Il libro non è stato trovato. Verifica di aver scritto correttamente il nome."
    );
  }
}

// Permette la ricerca premendo "Invio"
document.addEventListener("keypress", (event) => {
  if (
    event.key === "Enter" &&
    document.activeElement === document.getElementById("search-input")
  ) {
    handleSearch();
  }
});

// Cambia il placeholder in base alla modalità di ricerca
function addEventListenerToSwitch() {
  searchInput.placeholder = toggleSearchMode.checked
    ? "Cerca un'occorrenza nelle tue note..."
    : "Cerca un passo biblico...";

  toggleSearchMode.addEventListener("change", () => {
    searchInput.placeholder = toggleSearchMode.checked
      ? "Cerca un'occorrenza nelle tue note..."
      : "Cerca un passo biblico...";
  });
}

addEventListenerToSwitch();

// Funzione per aggiornare il placeholder dinamicamente
function updatePlaceholder() {
  searchInput.placeholder = toggleSearchMode.checked
    ? "Cerca un'occorrenza nelle tue note..."
    : "Cerca un passo biblico...";
}

// Imposta inizialmente il placeholder
updatePlaceholder();

// Aggiungi l'event listener per il cambio dello switch
toggleSearchMode.addEventListener("change", () => {
  updatePlaceholder();
  localStorage.setItem("searchMode", toggleSearchMode.checked);
});

// Ripristina modalità salvata da localStorage
const savedSearchMode = localStorage.getItem("searchMode");
if (savedSearchMode !== null) {
  toggleSearchMode.checked = savedSearchMode === "true";
  updatePlaceholder(); //Richiama dopo aver aggiornato lo stato
}
closeModalButton.addEventListener("click", () => {
  resultsModal.style.display = "none";
  searchInput.blur();
});
