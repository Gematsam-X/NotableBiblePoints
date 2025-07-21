import { Share } from "@capacitor/share";
import Backendless from "backendless";
import { deleteValue, getValue, setValue } from "./indexedDButils.js";
import { isDarkTheme } from "./isDarkTheme.js";
import { isOnline } from "./isOnline.js";
import { hideGif, showGif } from "./loadingGif.js";
import { logoutUser } from "./logoutAndDelete.js";
import Choices from "choices.js";
import "choices.js/public/assets/styles/choices.min.css";
import toast from "./toast.js";

const refreshBtn = document.querySelector(".refreshNotes");

// Recupera il libro e il capitolo selezionati dal sessionStorage
const selectedBook = sessionStorage.getItem("selectedBook");
const chapter = parseInt(sessionStorage.getItem("selectedChapter"));

// Imposta il titolo della pagina
const pageTitle = document.querySelector(".notes-page-title");
const title = `Punti notevoli di ${selectedBook} ${chapter}`;

if (pageTitle) {
  pageTitle.textContent = title;
  window.document.title = `${selectedBook} ${chapter} - NotableBiblePoints`;
}

// Funzione per controllare se bisogna usare il server
async function shouldUseServer() {
  if (!(await isOnline())) return false;
  else if (await getValue("userNotes")) return false;
  else if (!(await getValue("userNotes"))) return true;
}

const modal = document.querySelector(".modal");

// Funzione per aprire la modale
document.querySelector(".openModal")?.addEventListener("click", async () => {
  // Pulisci select tags di Choices.js
  if (typeof tagChoices !== "undefined") {
    tagChoices.removeActiveItems();
  }

  editingNoteId = null; // RESET!

  // Pulisci input testuali
  document.querySelector("#noteTitle").value = "";
  document.querySelector("#verseNumber").value = "";
  document.querySelector("#noteContent").value = "";

  await refreshTagChoices();
  modal.style.display = "block";
});

// Funzione per chiudere la modale
document.querySelector(".closeModal").addEventListener("click", () => {
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
    const userEmail = localStorage.getItem("userEmail");

    // Ottieni i dati dal server o IndexedDB
    const allRecords = (await shouldUseServer())
      ? (await Backendless.Data.of("NotableBiblePoints").findFirst())
          .NotablePoints
      : await getValue("userNotes");

    console.log(allRecords, "allRecords");

    // Verifica che allRecords sia un array
    if (!Array.isArray(allRecords)) {
      toast("Errore: i dati non sono in formato corretto.");
      notesContainer.innerHTML = "<p>Errore nei dati delle note.</p>";
      return;
    }

    const notesArray = Object.values(allRecords).filter(
      (item) => typeof item === "object" && item.id
    );
    const userNotes = notesArray.filter((note) => note.owner === userEmail);

    console.log(allRecords, notesArray, userNotes);

    // Salvataggio delle note locali in IndexedDB (aspettiamo il completamento)
    await setValue("userNotes", userNotes);

    // Popola il contenitore con le note
    notesContainer.innerHTML = ""; // Svuota il contenitore
    let notesFound = false;
    let allNotes = [];

    if (Array.isArray(userNotes) && userNotes.length > 0) {
      if (await shouldUseServer()) await setValue("userNotes", userNotes);

      // Filtra e ordina le note
      userNotes.forEach((noteObj) => {
        if (
          noteObj.book === selectedBook &&
          noteObj.chapter === chapter &&
          noteObj.owner === userEmail
        ) {
          notesFound = true;
          const { verse, title = "", content, id: noteId, tags = [] } = noteObj;
          allNotes.push({ verse, title, content, noteId, tags });
        }
      });

      // Ordina per versetto
      allNotes.sort((a, b) => a.verse - b.verse);

      // Aggiungi le note al contenitore
      allNotes.forEach(({ verse, title, content, noteId, tags }) => {
        const noteElement = document.createElement("div");
        noteElement.classList.add("note");
        noteElement.setAttribute("data-id", noteId);
        if (tags?.length > 0) {
          noteElement.setAttribute("data-tags", JSON.stringify(tags));
        }

        // Costruzione tag HTML visivi
        const tagsHtml = tags
          .map((tag) => `<span class="tag-pill">${tag}</span>`)
          .join("");

        const deleteImageSrc = isDarkTheme
          ? "../assets/notes/delete/dark.webp"
          : "../assets/notes/delete/light.webp";
        const editImageSrc = isDarkTheme
          ? "../assets/notes/edit/dark.webp"
          : "../assets/notes/edit/light.webp";
        const shareImageSrc = isDarkTheme
          ? "../assets/notes/share/dark.webp"
          : "../assets/notes/share/light.webp";

        noteElement.innerHTML = `
          <div class="verse-number">
            <h4>Versetto ${verse}</h4>
          <div class="tags-container">${tagsHtml}</div>
          </div>
        <span class="close-note">&times;</span>
          <div class="note-body">
            <h2 class="note-title">${title}</h2>
            <h3>${content}</h3>
          </div>

          <div class="note-action-buttons">
            <button class="delete">
              <img class="deleteNote_img" src="${deleteImageSrc}" width="40px" height="40px">
            </button>
            <button class="edit">
              <img class="edit_img" src="${editImageSrc}" width="40px" height="40px">
            </button>
            <button class="share">
              <img class="share_img" src="${shareImageSrc}" width="40px" height="40px">
            </button>
          </div>
        `;

        notesContainer.appendChild(noteElement);
      });
    }

    // Messaggio se non ci sono note
    if (!notesFound) {
      notesContainer.innerHTML =
        "<p>Non hai salvato nessun punto notevole per questo capitolo. Creane uno usando il pulsante in basso a destra con l'icona '+'.</p>";
    }
  } catch (error) {
    if (error.message.toLowerCase().includes("not existing user token")) {
      toast("Sessione scaduta. Effettua nuovamente il login per continuare.");
      logoutUser(true, true);
      return;
    }
    console.error("Errore nel recupero delle note:", error);
    toast(`Errore: ${error.message}`);
    notesContainer.innerHTML = `<p>Errore nel caricamento delle note. Riprova più tardi.<br>Dettagli: ${error.message}</p>`;
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
let tagChoicesArray = []; // lista globale di tutti i tag disponibili

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
  if (!tagSelect) {
    console.warn("⚠️ Campo #noteTags non trovato nel DOM!");
    return;
  }

  // 2️⃣ Recupero email utente
  const currentUserEmail = localStorage.getItem("userEmail");
  if (!currentUserEmail) {
    console.warn("⚠️ Nessuna email utente trovata nel localStorage!");
    return;
  }

  // 3️⃣ Carico le note (server o local)
  const res = (await shouldUseServer())
    ? await Backendless.Data.of("NotableBiblePoints").findFirst()
    : await getValue("userNotes");
  const allPoints = Array.isArray(res) ? res : res?.NotablePoints || [];
  const userPoints = allPoints.filter((p) => p.owner === currentUserEmail);

  // 4️⃣ Costruisco il Set di tag unici e popolo tagChoicesArray
  const tagSet = new Set();
  for (const point of userPoints) {
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

    // Recupera il primo (e unico) record dal database che contiene tutte le note
    let userNotes = (await isOnline())
      ? await Backendless.Data.of("NotableBiblePoints").findFirst()
      : await getValue("userNotes");

    // Se non esiste un record, creiamo uno vuoto con un array di note
    if (!userNotes) {
      userNotes = { NotablePoints: [] };
    }

    let notes = (await isOnline()) ? userNotes.NotablePoints : userNotes;

    // Se stai modificando una nota
    if (editingNoteId) {
      const noteIndex = notes.findIndex((note) => note.id === editingNoteId);
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
      const newNote = {
        id: Date.now().toString(),
        title: noteTitle || " ",
        verse: verseNumber,
        content: noteContent,
        chapter: parseInt(sessionStorage.getItem("selectedChapter")),
        book: sessionStorage.getItem("selectedBook"),
        owner: userEmail,
        tags: selectedTags,
      };

      notes.push(newNote);
    }

    // Aggiorna il record principale
    userNotes.NotablePoints = notes;

    if (await isOnline()) {
      await Backendless.Data.of("NotableBiblePoints").save(userNotes);
      console.log("Nota salvata con successo sul server!");
    } else {
      await setValue(
        "userNotes",
        notes.filter((note) => note.owner === userEmail)
      );
      console.log("Nota salvata con successo in locale!");
    }

    // Resetta lo stato di editing
    editingNoteId = null;
    modal.style.display = "none";

    if (await isOnline()) await deleteValue("userNotes");

    loadNotes();
  } catch (error) {
    console.error("Errore durante il salvataggio/modifica:", error);
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

document.querySelector("#saveNote").addEventListener("click", saveNote);

let shouldEnterFullscreen = true; // Variabile per controllare l'entrata in fullscreen

document.addEventListener("click", (event) => {
  // Controlla se il click è su un tag-pill o su un suo discendente
  const tagElement = event.target.closest(".tag-pill");

  if (!tagElement) return; // Se non è un tag, esci subito
  event.stopPropagation();
  shouldEnterFullscreen = false;

  // Qui dentro c'è il tag pill cliccato, prendi il testo del tag (senza spazi inutili)
  const tagText = tagElement.textContent.trim();

  if (tagText != sessionStorage.getItem("filteringTag")) {
    sessionStorage.setItem("filteringTag", tagText);
    window.location.href = "./notesByTag.html";
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

document.querySelector(".notesContainer").addEventListener("click", (event) => {
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

    if (event.target.classList.contains("close-note")) {
      document.exitFullscreen();
    }
  }
});

// Funzione per eliminare una nota
async function deleteNote(noteElement) {
  if (!confirm("Sei sicuro di voler eliminare questa nota?")) return;

  showGif();
  modal.style.display = "none";

  try {
    const noteId = noteElement.getAttribute("data-id");

    if (!noteId) {
      toast("Errore: impossibile trovare l'ID della nota.");
      return;
    }

    // Recupera le note
    let userNotes = (await isOnline())
      ? await Backendless.Data.of("NotableBiblePoints").findFirst()
      : await getValue("userNotes");

    console.log(userNotes);

    if (
      ((await isOnline()) && !userNotes.NotablePoints) ||
      (!(await isOnline()) && !userNotes)
    ) {
      toast("Errore: impossibile trovare le note dell'utente.");
      return;
    }

    // Filtra le note eliminando quella con l'id corrispondente
    const updatedNotes = (await isOnline())
      ? userNotes.NotablePoints.filter((note) => note.id !== noteId)
      : userNotes.filter((note) => note.id !== noteId);

    // Aggiorna l'oggetto
    (await isOnline())
      ? (userNotes.NotablePoints = updatedNotes)
      : (userNotes = updatedNotes);

    let deletedNotes = (await getValue("deletedNotes")) || [];
    const noteToDelete = { id: noteId };
    deletedNotes.push(noteToDelete);
    await setValue("deletedNotes", deletedNotes);

    await setValue(
      "userNotes",
      updatedNotes.filter(
        (note) => note.owner === localStorage.getItem("userEmail")
      )
    );

    // Salva di nuovo
    if (await isOnline()) {
      await Backendless.Data.of("NotableBiblePoints").save(userNotes);
    }

    // Rimuove dal DOM
    noteElement.remove();

    toast("Nota eliminata con successo!");
  } catch (error) {
    console.error("Errore durante l'eliminazione:", error);
    toast("Errore durante l'eliminazione della nota. Riprova più tardi.");
  } finally {
    hideGif();
  }
}

async function shareNote(noteElement) {
  const noteTitle = noteElement.querySelector(".note-title").textContent;
  const noteContent = noteElement.querySelector(".note-body h3").textContent;
  const verseNumber = noteElement
    .querySelector(".verse-number h4")
    .textContent.replace("Versetto ", "")
    .trim();

  const shareText = `Ho trovato un punto notevole interessante in ${selectedBook} ${chapter}:${verseNumber}: ${noteContent}`;

  try {
    await Share.share({
      title: `Punto notevole: ${noteTitle}`,
      text: shareText,
      dialogTitle: "Condividi con",
    });
  } catch (err) {
    console.error("Errore durante la condivisione:", err);
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
    if (document.querySelector(".notesContainer").children.length === 0) {
      console.log("Tutte le note sono state eliminate");
      document.querySelector(".notesContainer").innerHTML =
        "<p>Non hai salvato nessun punto notevole per questo capitolo. Creane uno usando il pulsante in basso a destra con l'icona '+'.</p>";
    }
  }, 500);
});

// Configura l'osservatore per rilevare aggiunte e rimozioni di nodi
observer.observe(document.querySelector(".notesContainer"), {
  childList: true,
});

refreshBtn?.addEventListener("click", async () => {
  if (sessionStorage.getItem("canRefresh") !== "false") {
    if (await isOnline()) await deleteValue("userNotes");
    loadNotes(); // Ricarica le note (ora il server verrà usato solo se l'utente è online)
  }
});

// Funzione per aggiornare Choices.js con i tag freschi
async function refreshTagChoices() {
  const userEmail = localStorage.getItem("userEmail");
  const res = (await shouldUseServer())
    ? await Backendless.Data.of("NotableBiblePoints").findFirst()
    : await getValue("userNotes");

  const allNotes = Array.isArray(res) ? res : res?.NotablePoints || [];
  const userNotes = allNotes.filter((n) => n.owner === userEmail);

  const tagSet = new Set();
  userNotes.forEach((note) => {
    if (Array.isArray(note.tags)) {
      note.tags.forEach((t) => tagSet.add(t.trim()));
    }
  });

  const choicesArray = Array.from(tagSet).map((tag) => ({
    value: tag,
    label: tag,
  }));
  tagChoices?.setChoices(choicesArray, "value", "label", true);
}

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
  // Cerca l'indice del libro selezionato nell'array bibleBooks
  const bookIndex = bibleBooks.indexOf(selectedBook); // Restituisce l'indice del libro, o -1 se non trovato

  if (bookIndex !== -1) {
    // Converte l'indice in due cifre (ad esempio, 01 per il primo libro)
    const bookCode = (bookIndex + 1).toString().padStart(2, "0");

    // Costruisce il codice del riferimento (ad esempio, 01001001 per Genesi 1:1)
    const referenceCode = `${bookCode}${chapter.padStart(
      3,
      "0"
    )}000-${bookCode}${chapter.padStart(3, "0")}999}`;

    // Costruisce l'URL con il riferimento completo
    link.href = `https://www.jw.org/finder?wtlocale=I&prefer=lang&bible=${referenceCode}&pub=nwtsty`;
  } else {
    // Se il libro non è trovato, puoi gestire l'errore
    toast(
      "C'è stato un errore nel reindirizzamento. Si prega di riprovare più tardi."
    );
  }
});
