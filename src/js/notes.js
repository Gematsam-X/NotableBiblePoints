import Choices from "choices.js";
import "choices.js/public/assets/styles/choices.min.css";
import backendlessRequest from "/src/js/backendlessRequest.js";
import { deleteValue, getValue, setValue } from "/src/js/indexedDButils.js"; // Importiamo le funzioni IndexedDB
import { isDarkTheme } from "/src/js/isDarkTheme.js";
import { hideGif, showGif } from "/src/js/loadingGif.js";
import { logoutUser } from "/src/js/logoutAndDelete.js"; // Importa la funzione di logout
import toast from "/src/js/toast.js";

const refreshBtn = document.querySelector(".refreshNotes");

// Recupera il libro e il capitolo selezionati dal sessionStorage
const selectedBook = sessionStorage.getItem("selectedBook");
const selectedChapter = parseInt(sessionStorage.getItem("selectedChapter"));

// Imposta il titolo della pagina
const pageTitle = document.querySelector(".notes-page-title");
if (pageTitle)
  pageTitle.textContent = `Note del capitolo ${selectedChapter} di ${selectedBook}`;
window.document.title = `${selectedBook} ${selectedChapter} - NotableBiblePoints`;

// Funzione per controllare se bisogna usare il server
export default async function shouldUseServer() {
  if (!navigator.onLine) return false;
  else if (await getValue("userNotes")) return false;
  else if (!(await getValue("userNotes"))) return true;
}

const modal = document.querySelector(".modal");

// Funzione per aprire la modale
document.querySelector(".openModal")?.addEventListener("click", async () => {
  editingNoteId = null; // RESET!

  // Pulisci input testuali
  document.querySelector("#noteTitle").value = "";
  document.querySelector("#verseNumber").value = "";
  document.querySelector("#noteContent").value = "";

  // Pulisci select tags di Choices.js
  if (typeof tagChoices !== "undefined") tagChoices.removeActiveItems();

  await refreshTagChoices();

  // Mostra la modale
  modal.style.display = "block";
});

// Funzione per chiudere la modale
document.querySelector(".closeModal")?.addEventListener("click", () => {
  document.querySelector("#noteContent").value = "";
  document.querySelector("#noteTitle").value = "";
  document.querySelector("#verseNumber").value = "";
  modal.style.display = "none";
});

// Funzione per caricare le note dal database o da IndexedDB
async function loadNotes() {
  const notesContainer = document.querySelector(".notesContainer");
  if (!notesContainer) return;

  notesContainer.innerHTML = "<p>Caricamento in corso...</p>";
  refreshBtn.classList.add("disabled");

  try {
    // Prendo email criptata e token da localStorage
    const userEmail = localStorage.getItem("userEmail");
    const userToken = localStorage.getItem("userToken");

    // ☁️ Prendo note da backend o IndexedDB (a seconda di shouldUseServer)
    const allRecords = (await shouldUseServer())
      ? await backendlessRequest("notes:get", { email: userEmail }, userToken)
      : await getValue("userNotes");

    if (!Array.isArray(allRecords)) {
      toast("Errore: i dati non sono in formato corretto.");
      notesContainer.innerHTML = "<p>Errore nei dati delle note.</p>";
      return;
    }

    // Estraggo note vere filtrando per id valido
    const userNotes = allRecords.filter(
      (item) => typeof item === "object" && item?.id
    );

    // Aggiorno IndexedDB con note pulite
    await setValue("userNotes", userNotes);

    notesContainer.innerHTML = "";
    let notesFound = false;
    let allNotes = [];

    if (userNotes.length > 0) {
      if (await shouldUseServer()) await setValue("userNotes", userNotes);

      userNotes.forEach(
        ({
          book,
          chapter,
          verse,
          title = "",
          content,
          id: noteId,
          tags = [],
        }) => {
          if (book === selectedBook && chapter === selectedChapter) {
            notesFound = true;
            allNotes.push({ verse, title, content, noteId, tags });
          }
        }
      );

      allNotes.sort((a, b) => a.verse - b.verse);

      allNotes.forEach(({ verse, title, content, noteId, tags }) => {
        const noteElement = document.createElement("div");
        noteElement.classList.add("note");
        noteElement.setAttribute("data-id", noteId);
        if (tags.length > 0) {
          noteElement.setAttribute("data-tags", JSON.stringify(tags));
        }

        const tagsHtml = tags
          .map((tag) => `<span class="tag-pill">${tag}</span>`)
          .join("");

        const deleteImageSrc = isDarkTheme
          ? "/src/assets/notes/delete/dark.webp"
          : "/src/assets/notes/delete/light.webp";
        const editImageSrc = isDarkTheme
          ? "/src/assets/notes/edit/dark.webp"
          : "/src/assets/notes/edit/light.webp";
        const shareImageSrc = isDarkTheme
          ? "/src/assets/notes/share/dark.webp"
          : "/src/assets/notes/share/light.webp";

        noteElement.innerHTML = `
          <div class="verse-number">
            <h4>Versetto ${verse}</h4>
            <div class="tags-container">${tagsHtml}</div>
          </div>
          <div class="note-body">
            <h2 class="note-title">${title}</h2>
            <h3>${content}</h3>
          </div>
          <div class="note-action-buttons">
            <button class="delete">
              <img class="deleteNote_img" src="${deleteImageSrc}" width="40" height="40">
            </button>
            <button class="edit">
              <img class="edit_img" src="${editImageSrc}" width="40" height="40">
            </button>
            <button class="share">
              <img class="share_img" src="${shareImageSrc}" width="40" height="40">
            </button>
          </div>
        `;

        notesContainer.appendChild(noteElement);
      });
    }

    if (!notesFound) {
      notesContainer.innerHTML =
        "<p>Non hai salvato nessuna nota per questo capitolo. Creane una usando il pulsante in basso a destra con l'icona '+'.</p>";
    }
  } catch (error) {
    if (error.message.toLowerCase().includes("not existing user token")) {
      toast("Sessione scaduta. Effettua nuovamente il login per continuare.");
      logoutUser();
    } else if (error.message.toLowerCase().includes("requests per minute"))
      toast("Si è verificato un errore tecnico.");
    else {
      console.error("Errore nel recupero delle note:", error);
      toast(`Errore: ${error.message}`);
    }
    notesContainer.innerHTML = `<p>Errore nel caricamento delle note. Riprova più tardi.<br>Dettagli: ${error.message}</p>`;
    return;
  } finally {
    document.querySelector("#noteContent").value = "";
    document.querySelector("#noteTitle").value = "";
    document.querySelector("#verseNumber").value = "";
    refreshBtn.classList.remove("disabled");
  }
}

// Carica le note al caricamento della pagina
window.addEventListener("load", loadNotes);

let tagChoices;
let tagChoicesArray = [];

(async () => {
  /**
   * Ricostruisce da zero il dropdown:
   * - Svuota tutte le choices
   * - Ripristina tutte le opzioni globali
   * - Riapplica la selezione per nascondere i tag già scelti
   */
  function updateChoicesDropdown() {
    const selected = tagChoices.getValue(true); // tag già selezionati
    tagChoices.clearChoices(); // svuota tutte le opzioni
    tagChoices.setChoices(tagChoicesArray, "value", "label", true); // rimetti tutto
    tagChoices.setValue(selected); // riapplica la selezione
  }

  // 1️⃣ Prendo il <select> dal DOM
  const tagSelect = document.getElementById("noteTags");
  if (!tagSelect) return;

  // 2️⃣ Recupero email utente
  const currentUserEmail = localStorage.getItem("userEmail");
  if (!currentUserEmail) {
    console.warn("⚠️ Nessuna email utente trovata nel localStorage!");
    return;
  }

  // 3️⃣ Carico le note (server o local)
  const res = (await shouldUseServer())
    ? await backendlessRequest(
        "notes:get",
        { email: currentUserEmail },
        localStorage.getItem("userToken")
      )
    : await getValue("userNotes");
  const allPoints = Array.isArray(res) ? res : res[0]?.NotablePoints || [];

  // 4️⃣ Costruisco il Set di tag unici e popolo tagChoicesArray
  const tagSet = new Set();
  for (const point of allPoints) {
    if (Array.isArray(point.tags)) {
      point.tags.forEach((t) => {
        if (t && typeof t === "string") tagSet.add(t.trim());
      });
    }
  }
  tagChoicesArray = Array.from(tagSet).map((tag) => ({
    value: tag,
    label: tag,
  }));

  // 5️⃣ Inizializzo Choices.js
  tagChoices = new Choices(tagSelect, {
    choices: tagChoicesArray,
    removeItemButton: true,
    duplicateItemsAllowed: false,
    placeholderValue: "Aggiungi o seleziona tag...",
    searchEnabled: true,
    shouldSort: false,
    position: "auto",
    itemSelectText: "Seleziona",
    noChoicesText:
      "Hai selezionato tutti i tag disponibili, o non hai ancora creato nessun tag. Creane uno scrivendolo qui.",
    paste: true,
    addItems: false, // gestiamo l’aggiunta manualmente
    allowHTML: true,
  });

  // 6️⃣ Controlla se un tag esiste già tra quelli selezionati
  function tagExists(val) {
    const v = val.toLowerCase().trim();
    return tagChoices.getValue(true).some((t) => t.toLowerCase() === v);
  }

  // 7️⃣ Evento di ricerca: filtra + opzione “Crea nuovo”
  tagSelect.addEventListener("search", (e) => {
    const q = e.detail.value.trim().toLowerCase();
    if (!q) {
      updateChoicesDropdown();
      tagChoices.hideDropdown();
      return;
    }
    const filtered = tagChoicesArray.filter((c) =>
      c.value.toLowerCase().startsWith(q)
    );
    if (q && !tagExists(q)) {
      filtered.unshift({
        value: `__add__${q}`,
        label: `Crea nuovo tag: <strong>"${q}"</strong>`,
        custom: true,
      });
    }
    tagChoices.setChoices(filtered, "value", "label", true);
    tagChoices.showDropdown();
  });

  // 8️⃣ Evento di aggiunta: nuovo tag o selezione esistente
  tagSelect.addEventListener("addItem", (e) => {
    const v = e.detail.value;
    if (v.startsWith("__add__")) {
      const newTag = v.replace("__add__", "").trim();
      tagChoices.removeActiveItemsByValue(v);
      if (!tagExists(newTag)) {
        // aggiungo al globale e seleziono
        tagChoicesArray.push({ value: newTag, label: newTag });
        const sel = [...tagChoices.getValue(true), newTag];
        updateChoicesDropdown();
        tagChoices.setChoiceByValue(sel);
      } else {
        updateChoicesDropdown();
      }
    } else {
      // selezione di un tag già esistente
      updateChoicesDropdown();
    }
    tagSelect.value = "";
    tagChoices.clearInput();
  });

  // 9️⃣ Evento di rimozione: rimetti il tag nel dropdown
  tagSelect.addEventListener("removeItem", () => {
    updateChoicesDropdown();
  });
})();

async function refreshTagChoices() {
  const currentUserEmail = localStorage.getItem("userEmail");
  if (!currentUserEmail) return;

  const res = (await shouldUseServer())
    ? await backendlessRequest(
        "notes:get",
        { email: currentUserEmail },
        localStorage.getItem("userToken")
      )
    : await getValue("userNotes");

  const allPoints = Array.isArray(res) ? res : res[0]?.NotablePoints || [];

  const tagSet = new Set();
  for (const point of allPoints) {
    if (Array.isArray(point.tags)) {
      point.tags.forEach((tag) => {
        if (tag && typeof tag === "string") tagSet.add(tag.trim());
      });
    }
  }

  const newChoices = Array.from(tagSet).map((tag) => ({
    value: tag,
    label: tag,
  }));

  // Aggiorna choices nel tagChoices (Choices.js)
  tagChoices.setChoices(newChoices, "value", "label", true);
}

// Async function to save or update a note
async function saveNote() {
  const noteTitle = document.querySelector("#noteTitle").value.trim();
  const verseNumber = parseInt(document.querySelector("#verseNumber").value);
  const noteContent = document.querySelector("#noteContent").value.trim();
  const selectedTags = tagChoices.getValue(true);

  if (isNaN(verseNumber) || !noteContent) {
    toast("Compila tutti i campi correttamente!");
    return;
  }

  modal.style.display = "none";
  showGif();

  try {
    const userEmail = localStorage.getItem("userEmail");

    // Recupera il record dal database che contiene tutte le note
    let notes =
      (navigator.onLine
        ? await backendlessRequest(
            "notes:get",
            { email: userEmail },
            localStorage.getItem("userToken")
          )
        : await getValue("userNotes")) || [];

    let newNote,
      noteIndex = null;

    if (editingNoteId) {
      noteIndex = notes.findIndex((note) => note.id === editingNoteId);
      if (noteIndex === -1) {
        toast("Errore: impossibile trovare la nota da modificare.");
        console.warn("[saveNote] Nota da modificare NON trovata!");
        return;
      }

      notes[noteIndex] = {
        ...notes[noteIndex],
        ...(noteTitle && { title: noteTitle }),
        verse: verseNumber,
        updatedAt: Date.now().toString(),
        content: noteContent,
        tags: selectedTags,
      };
    } else {
      newNote = {
        id: Date.now().toString(),
        title: noteTitle || " ",
        verse: verseNumber,
        content: noteContent,
        chapter: parseInt(sessionStorage.getItem("selectedChapter")),
        book: sessionStorage.getItem("selectedBook"),
        owner: await backendlessRequest("decrypt", {
          ciphertext: localStorage.getItem("userEmail"),
        }),
        tags: selectedTags,
      };

      notes.push(newNote);
    }

    if (navigator.onLine)
      await backendlessRequest(
        "notes:addOrUpdate",
        {
          note: newNote || notes[noteIndex],
          email: userEmail,
        },
        localStorage.getItem("userToken")
      );
    else await setValue("userNotes", notes);

    editingNoteId = null;
    modal.style.display = "none";

    if (navigator.onLine) await deleteValue("userNotes");

    await loadNotes();
  } catch (error) {
    console.error("[saveNote] Errore durante salvataggio/modifica:", error);
    toast("Errore durante il salvataggio. Riprova più tardi.");
  } finally {
    document.querySelector("#noteContent").value = "";
    document.querySelector("#noteTitle").value = "";
    document.querySelector("#verseNumber").value = "";

    if (typeof tagChoices !== "undefined") {
      tagChoices.removeActiveItems(); // reset visivo
    }

    await refreshTagChoices();
    hideGif();
  }
}

document.querySelector("#saveNote")?.addEventListener("click", saveNote);

let shouldEnterFullscreen = true;

document.addEventListener("click", (event) => {
  // Controlla se il click è su un tag
  const tagElement = event.target.closest(".tag-pill");

  if (!tagElement) return; // Se non è un tag, esci
  event.stopPropagation();
  shouldEnterFullscreen = false;

  // Prendi il testp del tag
  const tagText = tagElement.textContent.trim();

  if (tagText != sessionStorage.getItem("filteringTag")) {
    sessionStorage.setItem("filteringTag", tagText);
    window.location.href = "/src/html/notesByTag.html";
  }
});

document.addEventListener("click", (event) => {
  const closestNote = event.target.closest(".note");
  if (closestNote && shouldEnterFullscreen) {
    closestNote.id = "clicked-note";
    closestNote.requestFullscreen();
  }
});

document.addEventListener("fullscreenchange", () => {
  const fullscreenElement = document.fullscreenElement;
  if (fullscreenElement && fullscreenElement.id === "clicked-note") {
    return;
  } else {
    document.querySelector("#clicked-note").id = "";
  }
});

document
  .querySelector(".notesContainer")
  ?.addEventListener("click", (event) => {
    const closestNote = event.target.closest(".note");

    if (closestNote) {
      // Gestione del bottone "Elimina"
      if (event.target.classList.contains("delete")) {
        deleteNote(closestNote);
      }

      // Gestione del bottone "Condividi"
      if (event.target.classList.contains("share")) {
        shareNote(closestNote);
      }

      // Gestione del bottone "Modifica"
      if (event.target.classList.contains("edit")) {
        editNote(closestNote);
      }
    }
  });

/**
 * Elimina una nota sia da Backendless che localmente da IndexedDB.
 * Rimuove anche l'elemento dal DOM.
 * @param {HTMLElement} noteElement - L'elemento HTML della nota da eliminare, con attributo data-id
 */
async function deleteNote(noteElement) {
  // Conferma da parte dell'utente
  if (!confirm("Sei sicuro di voler eliminare questa nota?")) return;

  // Mostra GIF di caricamento e chiude la modale
  showGif();
  modal.style.display = "none";

  try {
    // Prende l'ID della nota dall'attributo HTML
    const noteId = noteElement.getAttribute("data-id");

    if (!noteId) {
      toast("Errore: impossibile trovare l'ID della nota.");
      return;
    }

    const userEmail = localStorage.getItem("userEmail");
    const userToken = localStorage.getItem("userToken");

    // 1. Elimina la nota da Backendless (tramite funzione serverless)
    if (navigator.onLine)
      await backendlessRequest(
        "notes:delete",
        { ids: noteId, email: userEmail },
        userToken
      );

    // 2. Segna la nota come eliminata localmente
    let deletedNotes = (await getValue("deletedNotes")) || [];
    deletedNotes.push({ id: noteId });
    await setValue("deletedNotes", deletedNotes);

    // 3. Aggiorna le userNotes rimuovendo la nota eliminata
    const allNotes = (await getValue("userNotes")) || [];

    const updatedNotes = allNotes.filter((note) => note.id !== noteId);

    await setValue("userNotes", updatedNotes);

    // 4. Rimuove visivamente la nota dal DOM
    noteElement.remove();

    // 5. Messaggio di successo
    toast("Nota eliminata con successo!");
  } catch (error) {
    console.error("Errore durante l'eliminazione:", error);
    toast("Errore durante l'eliminazione della nota. Riprova più tardi.");
  } finally {
    hideGif();
  }
}

function shareNote(noteElement) {
  const noteTitle = noteElement.querySelector(".note-title").textContent;
  const noteContent = noteElement.querySelector(".note-body h3").textContent;
  const verseNumber = noteElement
    .querySelector(".verse-number h4")
    .textContent.replace("Versetto ", "")
    .trim();

  const shareText = `Ho trovato un punto notevole interessante in ${selectedBook} ${selectedChapter}:${verseNumber}: ${noteContent}`;

  if (navigator.share) {
    navigator
      .share({
        title: `Punto notevole: ${noteTitle}`,
        text: shareText,
      })
      .catch((error) =>
        console.error("Errore durante la condivisione:", error)
      );
  } else {
    copyToClipboard(shareText);
  }
}

// Metodo alternativo per copiare negli appunti
function copyToClipboard(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  navigator.clipboard.writeText();
  document.body.removeChild(textarea);

  toast("Il testo della nota è stato copiato negli appunti!");
}

function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

document.addEventListener("keypress", (event) => {
  if (
    event.key === "Enter" &&
    event.target.id === "noteContent" &&
    !isMobile()
  ) {
    event.preventDefault();
    saveNote();
  }
});

let editingNoteId = null; // Variabile globale per sapere se stiamo modificando

async function editNote(noteElement) {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  }

  // Salva l'ID della nota che stiamo modificando
  editingNoteId = noteElement.getAttribute("data-id");

  const noteTitle = noteElement.querySelector(".note-title").textContent.trim();
  const noteContent = noteElement
    .querySelector(".note-body h3")
    .textContent.trim();
  const verseNumber = noteElement
    .querySelector(".verse-number h4")
    .textContent.replace("Versetto ", "")
    .trim();

  document.querySelector("#noteTitle").value = noteTitle;
  document.querySelector("#verseNumber").value = verseNumber;
  document.querySelector("#noteContent").value = noteContent;

  // Pulisce prima i tag precedenti (visivamente)
  if (typeof tagChoices !== "undefined") {
    tagChoices.removeActiveItems();
    await refreshTagChoices();

    // Prendi i tag dal data-attribute e settali nel select
    const tagString = noteElement.getAttribute("data-tags");
    if (tagString) {
      try {
        const tagArray = JSON.parse(tagString);
        tagArray.forEach((tag) => {
          tagChoices.setChoiceByValue(tag); // seleziona i tag esistenti
        });
      } catch (err) {
        console.warn("⚠️ Errore parsing tag:", err);
      }
    }
  }

  // Mostra la modale
  modal.style.display = "block";
}

// Eventi per chiudere la modale
document.addEventListener("keydown", function escHandler(event) {
  if (event.key === "Escape") {
    modal.style.display = "none";
    editingNoteId = null;
    document.removeEventListener("keydown", escHandler);
  }
});

const observer = new MutationObserver(() => {
  window.setTimeout(() => {
    if (document.querySelector(".notesContainer").children.length === 0)
      document.querySelector(".notesContainer").innerHTML =
        "<p>Non hai salvato nessuna nota per questo capitolo. Creane una usando il pulsante in basso a destra con l'icona '+'.</p>";
  }, 500);
});

// Configura l'osservatore per rilevare aggiunte e rimozioni di nodi
if (document.querySelector(".notesContainer"))
  observer.observe(document.querySelector(".notesContainer"), {
    childList: true,
  });

refreshBtn?.addEventListener("click", async () => {
  if (
    sessionStorage.getItem("canRefresh") != "false" ||
    sessionStorage.getItem("canRefresh") != false
  ) {
    if (navigator.onLine) await deleteValue("userNotes");
    loadNotes(); // Ricarica le note (ora il server verrà usato solo se l'utente è online)
  }
});

// Sezione sul reindirizzamento alla Traduzione del Nuovo Mondo

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

const link = document.querySelector("#readChapter") || null;

link?.addEventListener("click", () => {
  // Ottieni il libro selezionato
  const selectedBook = sessionStorage.getItem("selectedBook");
  const selectedChapter = sessionStorage.getItem("selectedChapter");

  // Cerca l'indice del libro selezionato nell'array bibleBooks
  const bookIndex = bibleBooks.indexOf(selectedBook); // Restituisce l'indice del libro, o -1 se non trovato

  if (bookIndex !== -1) {
    // Converte l'indice in due cifre (ad esempio, 01 per il primo libro)
    const bookCode = (bookIndex + 1).toString().padStart(2, "0");

    // Costruisce il codice del riferimento (ad esempio, 01001001 per Genesi 1:1)
    const referenceCode = `${bookCode}${selectedChapter.padStart(
      3,
      "0"
    )}000-${bookCode}${selectedChapter.padStart(3, "0")}999}`;

    // Costruisce l'URL con il riferimento completo
    link.href = `https://www.jw.org/finder?wtlocale=I&prefer=lang&bible=${referenceCode}&pub=nwtsty`;
  } else
    toast(
      "C'è stato un errore nel reindirizzamento. Si prega di riprovare più tardi."
    );
});

// Funzione per aggiungere il listener al singolo h4
function attachClickListenerToVerse(verseElement, noteElement) {
  verseElement.addEventListener("click", () => {
    if (!document.fullscreenElement) return;

    const selectedBook = sessionStorage.getItem("selectedBook");
    const selectedChapter = sessionStorage.getItem("selectedChapter");
    const bookIndex = bibleBooks.indexOf(selectedBook);

    if (bookIndex === -1) {
      toast("Libro non trovato");
      return;
    }

    // Ricava il numero del versetto cliccato
    const verseNumber = verseElement.textContent
      .trim()
      .replace("Versetto ", "")
      .padStart(3, "0");

    const bookCode = (bookIndex + 1).toString().padStart(2, "0");
    const chapterCode = selectedChapter.padStart(3, "0");
    const referenceCode = `${bookCode}${chapterCode}${verseNumber}`;
    
    window.location.href = `https://www.jw.org/finder?wtlocale=I&prefer=lang&bible=${referenceCode}&pub=nwtsty`;
  });
}

// Funzione che cerca tutti gli h4 dentro .verse-number e aggiunge il listener
function applyListenersToAllVerses() {
  document.querySelectorAll(".verse-number h4").forEach((e) => {
    // Evita di aggiungere due volte lo stesso listener (optional)
    if (!e.dataset.listenerAttached) {
      attachClickListenerToVerse(e);
      e.dataset.listenerAttached = "true";
    }
  });
}

// Applichiamo i listener iniziali
applyListenersToAllVerses();

// Creiamo un observer per tenere d'occhio il DOM
const verseObserver = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    // Per ogni nodo aggiunto al DOM
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Se è proprio un h4 dentro .verse-number
        if (node.matches && node.matches(".verse-number h4")) {
          attachClickListenerToVerse(node);
        } else {
          // Oppure se dentro ci sono elementi del genere
          node.querySelectorAll?.(".verse-number h4").forEach((child) => {
            attachClickListenerToVerse(child);
          });
        }
      }
    });
  }
});

verseObserver.observe(document.body, {
  childList: true,
  subtree: true,
});
