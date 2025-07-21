import Choices from "choices.js";
import { isOnline } from "./isOnline.js";
import "choices.js/public/assets/styles/choices.min.css";
import backendlessRequest from "./backendlessRequest.js";
import { deleteValue, getValue, setValue } from "./indexedDButils.js";
import { isDarkTheme } from "./isDarkTheme.js";
import { hideGif, showGif } from "./loadingGif.js";
import toast from "./toast.js";

let editingNoteId = null;
const modal = document.querySelector(".modal");
const refreshBtn = document.querySelector(".refreshNotes");
const notesContainer = document.querySelector(".notesContainer");

const filteringTag = sessionStorage.getItem("filteringTag");
const pageTitle = document.querySelector(".notes-page-title");
if (pageTitle) pageTitle.textContent = `Note con tag "${filteringTag}"`;

// Funzione che decide se usare il server o no (server solo se online e IndexedDB vuoto)
async function shouldUseServer() {
  if (!(await isOnline())) return false;
  else if (await getValue("userNotes")) return false;
  else return true;
}

// Carica solo le note che contengono il filteringTag
async function loadNotesByTag(forceServer = false) {
  if (!notesContainer) return;

  notesContainer.innerHTML = "<p>Caricamento in corso...</p>";
  refreshBtn?.classList.add("disabled");
  if (!(await isOnline())) forceServer = false;

  try {
    const userEmail = localStorage.getItem("userEmail");

    // Prendo i dati
    const allRecords =
      forceServer || (await shouldUseServer())
        ? (await backendlessRequest(
            "notes:get",
            { email: userEmail },
            localStorage.getItem("userToken")
          )) || []
        : await getValue("userNotes");

    // Filtro le note in base al tag filtrante
    const filteredNotes = allRecords.filter((note) =>
      note?.tags?.includes(filteringTag)
    );

    // Salvo nel DB locale filtered subset (campo userNotesByTag)
    await setValue("userNotesByTag", filteredNotes);
    await setValue("userNotes", allRecords);

    notesContainer.innerHTML = "";

    if (!filteredNotes.length) {
      notesContainer.innerHTML = `<p>Nessuna nota trovata con il tag "${filteringTag}".</p>`;
      return;
    }

    // Ordino le note per numero del versetto (verse)
    filteredNotes.sort((a, b) => a.verse - b.verse);

    // Creo l'HTML per ogni nota
    filteredNotes.forEach((note) => {
      const noteElement = document.createElement("div");
      noteElement.classList.add("note");
      noteElement.setAttribute("data-id", note.id);
      if (note.tags?.length) {
        noteElement.setAttribute("data-tags", JSON.stringify(note.tags));
      }
      noteElement.setAttribute("data-book", note.book);
      noteElement.setAttribute("data-chapter", JSON.stringify(note.chapter));

      // Tags come pillole cliccabili
      const tagsHtml = note.tags
        .map((tag) => `<span class='tag-pill'>${tag}</span>`)
        .join("");

      // Icone adattate a tema scuro o chiaro
      const deleteImg = isDarkTheme
        ? "../assets/notes/delete/dark.webp"
        : "../assets/notes/delete/light.webp";
      const editImg = isDarkTheme
        ? "../assets/notes/edit/dark.webp"
        : "../assets/notes/edit/light.webp";
      const shareImg = isDarkTheme
        ? "../assets/notes/share/dark.webp"
        : "../assets/notes/share/light.webp";

      // HTML interno della nota
      noteElement.innerHTML = `
        <span class="close-note">&times;</span>
        <div class="verse-number">
          <h4>${note.book} ${note.chapter}:${note.verse}</h4>
          <div class="tags-container">${tagsHtml}</div>
        </div>
        <div class="note-body">
          <h2 class="note-title">${note.title}</h2>
          <h3>${note.content}</h3>
        </div>
        <div class="note-action-buttons">
          <button class="delete"><img src="${deleteImg}" width="40"></button>
          <button class="edit"><img src="${editImg}" width="40"></button>
          <button class="share"><img src="${shareImg}" width="40"></button>
        </div>
      `;

      notesContainer.appendChild(noteElement);
    });
  } catch (err) {
    console.error("Errore nel caricamento:", err);
    toast("Errore durante il caricamento delle note.");
  } finally {
    refreshBtn?.classList.remove("disabled");
  }
}

// Al caricamento della pagina, carica le note
window.addEventListener("load", loadNotesByTag());

// Listener click dentro il contenitore delle note
notesContainer?.addEventListener("click", async (event) => {
  // Se clicchi su un tag-pill
  const tagClicked = event.target.closest(".tag-pill");
  if (tagClicked) {
    const newTag = tagClicked.textContent.trim();
    if (newTag !== filteringTag) {
      sessionStorage.setItem("filteringTag", newTag);
      location.reload(); // ricarica pagina con nuovo filtro
    }
    return;
  }

  // Se clicchi su una nota
  const noteElement = event.target.closest(".note");
  if (!noteElement || noteElement.id) return;

  // Se clicchi su pulsanti azione
  if (event.target.closest(".delete")) return deleteNote(noteElement);
  if (event.target.closest(".share")) return shareNote(noteElement);
  if (event.target.closest(".edit")) return editNote(noteElement);
  if (event.target.classList.contains("close-note")) {
    document.exitFullscreen();
  }
  try {
    if (
      !document.fullscreenElement &&
      !document.getElementById("clicked-note")
    ) {
      noteElement.id = "clicked-note";
      await noteElement.requestFullscreen();
    }
  } catch (err) {
    console.warn("Impossibile entrare in fullscreen:", err);
  }

  // Gestione uscita fullscreen: togli l'id e la classe
  document.addEventListener("fullscreenchange", () => {
    const fullscreenElement = document.fullscreenElement;
    if (fullscreenElement && fullscreenElement.id === "clicked-note") {
      return;
    } else {
      const prev = document.querySelector("#clicked-note");
      if (prev) prev.id = "";
    }
  });

  // Togli evidenziazione da tutte le note e aggiungila solo a quella cliccata
  document
    .querySelectorAll(".note")
    .forEach((el) => el.classList.remove("clicked-note"));
  noteElement.classList.add("clicked-note");
});

// Condivisione della nota tramite Web Share API o copia appunti
function shareNote(noteElement) {
  const title = noteElement.querySelector(".note-title").textContent;
  const content = noteElement.querySelector(".note-body h3").textContent;
  const verse = noteElement.querySelector(".verse-number h4").textContent;

  const shareText = `Nota: ${title} (${verse})\n${content}`;

  if (navigator.share) {
    navigator.share({ title: title, text: shareText });
  } else {
    navigator.clipboard.writeText(shareText);
    toast("Nota copiata negli appunti!");
  }
}

// Eliminazione nota con salvataggio online se possibile e sempre IndexedDB
/**
 * Elimina una nota, sia lato Backendless che localmente.
 * @param {HTMLElement} noteElement - L'elemento DOM della nota da eliminare.
 */
async function deleteNote(noteElement) {
  if (!confirm("Vuoi davvero eliminare questa nota?")) return;

  showGif(); // Mostra la gif di caricamento

  try {
    const id = noteElement.getAttribute("data-id");
    const userEmail = localStorage.getItem("userEmail");
    const userToken = localStorage.getItem("userToken");

    if (!id || !userEmail || !userToken) {
      toast("Errore: dati utente mancanti o ID non valido.");
      console.error("[deleteNote] ID o credenziali non trovate.");
      return;
    }

    const online = await isOnline();

    // Elimina la nota da Backendless se siamo online
    if (online) {
      await backendlessRequest(
        "notes:delete",
        { email: userEmail, ids: id },
        userToken
      );
    }

    // Prende le note salvate localmente
    const allNotes = (await getValue("userNotes")) || [];

    // Filtra le note rimuovendo quella con l'id corrispondente
    const updated = allNotes.filter((note) => note.id !== id);

    // Aggiorna sia l'array completo che quello filtrato per il tag attivo
    await setValue("userNotes", updated);
    await setValue(
      "userNotesByTag",
      updated.filter((n) => n.tags?.includes(filteringTag))
    );

    // Rimuove la nota dal DOM
    noteElement.remove();

    toast("Nota eliminata con successo.");
  } catch (error) {
    console.error("[deleteNote] Errore durante eliminazione:", error);
    toast("Errore durante l'eliminazione della nota.");
  } finally {
    hideGif(); // Nasconde la gif di caricamento in ogni caso
  }
}

// Funzione per aprire modale e caricare dati della nota da modificare
async function editNote(noteElement) {
  if (document.fullscreenElement) document.exitFullscreen();
  editingNoteId = noteElement.getAttribute("data-id");

  const title = noteElement.querySelector(".note-title").textContent.trim();
  const content = noteElement.querySelector(".note-body h3").textContent.trim();
  const fullVerseText = noteElement
    .querySelector(".verse-number h4")
    .textContent.trim();
  const match = fullVerseText.match(/:(\d+)$/);
  const verse = match ? parseInt(match[1], 10) : null;

  const tagString = noteElement.getAttribute("data-tags");

  // Metto i valori dentro la modale
  document.querySelector("#noteTitle").value = title;
  document.querySelector("#noteContent").value = content;
  document.querySelector("#verseNumber").value = verse;
  modal.style.display = "block";

  tagChoices.removeActiveItems();
  await refreshTagChoices();

  if (tagString) {
    try {
      const tags = JSON.parse(tagString);
      tags.forEach((tag) => tagChoices.setChoiceByValue(tag));
    } catch (e) {
      console.warn("Errore parsing tag:", e);
    }
  }
}

// Listener per il salvataggio della nota modificata
document.querySelector("#saveNote").addEventListener("click", saveNote);

// Funzione di salvataggio della nota modificata, con gestione server online e IndexedDB sempre
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
      ((await isOnline())
        ? await backendlessRequest(
            "notes:get",
            { email: userEmail },
            localStorage.getItem("userToken")
          )
        : await getValue("userNotes")) || [];

    // Cerca la nota da modificare tra le tue
    const noteIndex = notes.findIndex((note) => note.id === editingNoteId);
    if (noteIndex === -1) {
      toast("Errore: impossibile trovare la nota da modificare.");
      return;
    }

    // Aggiorna la nota
    notes[noteIndex] = {
      ...notes[noteIndex],
      ...(noteTitle && { title: noteTitle }),
      verse: verseNumber,
      updatedAt: Date.now().toString(),
      content: noteContent,
      tags: selectedTags,
    };

    if (await isOnline())
      await backendlessRequest(
        "notes:addOrUpdate",
        { email: localStorage.getItem("userEmail"), note: notes[noteIndex] },
        localStorage.getItem("userToken")
      );
    else await setValue("userNotes", notes);

    editingNoteId = null;
    modal.style.display = "none";

    if (await isOnline()) await deleteValue("userNotes");

    (await isOnline()) ? await loadNotesByTag(true) : await loadNotesByTag();
  } catch (error) {
    console.error("[saveNote] Errore durante modifica:", error);
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

// Bottone refresh: se online elimina cached userNotesByTag per forzare reload server, poi carica le note
refreshBtn?.addEventListener("click", async () => {
  if (await isOnline()) await deleteValue("userNotesByTag");
  loadNotesByTag(true);
});

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
    ? await backendlessRequest(
        "notes:get",
        {
          email: localStorage.getItem("userEmail"),
        },
        localStorage.getItem("userToken")
      )
    : await getValue("userNotes");
  const allPoints = Array.isArray(res) ? res : res || [];

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

// Funzione per aggiornare Choices.js con i tag freschi
async function refreshTagChoices() {
  const userEmail = localStorage.getItem("userEmail");
  const res = (await shouldUseServer())
    ? await backendlessRequest(
        "notes:get",
        {
          email: localStorage.getItem("userEmail"),
        },
        localStorage.getItem("userToken")
      )
    : await getValue("userNotes");

  const allNotes = Array.isArray(res) ? res : res || [];

  const tagSet = new Set();
  allNotes.forEach((note) => {
    if (Array.isArray(note.tags)) {
      note.tags.forEach((t) => tagSet.add(t.trim()));
    }
  });

  const choicesArray = Array.from(tagSet).map((tag) => ({
    value: tag,
    label: tag,
  }));
  tagChoices.setChoices(choicesArray, "value", "label", true);
}

// Gestione chiusura modale: reset editing, esce da fullscreen e toglie evidenziazioni
const closeModalBtn = document.querySelector(".closeModal");
closeModalBtn?.addEventListener("click", () => {
  modal.style.display = "none";
  editingNoteId = null;

  if (document.fullscreenElement) {
    document.exitFullscreen().catch((err) => {
      console.warn("Errore uscita fullscreen:", err);
    });
  }

  document
    .querySelectorAll(".note")
    .forEach((el) => el.classList.remove("clicked-note"));
});

const observer = new MutationObserver(() => {
  window.setTimeout(() => {
    if (document.querySelector(".notesContainer").children.length === 0)
      document.querySelector(
        ".notesContainer"
      ).innerHTML = `<p>Nessuna nota trovata con il tag "${sessionStorage.getItem(
        "filteringTag"
      )}".</p>`;
  }, 500);
});

// Configura l'osservatore per rilevare aggiunte e rimozioni di nodi
observer.observe(document.querySelector(".notesContainer"), {
  childList: true,
});

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

// Funzione per aggiungere il listener al singolo h4
function attachClickListenerToVerse(verseElement, noteElement) {
  verseElement.addEventListener("click", () => {
    // Blocca il click se non siamo in modalità fullscreen
    if (!document.fullscreenElement) return;

    // Ricava le info dal contenitore del versetto
    const selectedBook = noteElement.getAttribute("data-book");
    const selectedChapter = noteElement.getAttribute("data-chapter");
    const bookIndex = bibleBooks.indexOf(selectedBook);

    if (bookIndex === -1) {
      toast("Libro non trovato");
      return;
    }

    // Estrai il numero del versetto da "Proverbi 20:4"
    const text = verseElement.textContent.trim();
    const verseMatch = text.match(/:(\d+)$/); // Cattura il numero dopo i due punti

    if (!verseMatch) {
      toast("Versetto non riconosciuto");
      return;
    }

    const verseNumber = verseMatch[1].padStart(3, "0"); // es: "4" → "004"

    // Crea il codice
    const bookCode = (bookIndex + 1).toString().padStart(2, "0");
    const chapterCode = selectedChapter.padStart(3, "0");
    const referenceCode = `${bookCode}${chapterCode}${verseNumber}`;

    // Vai su jw.org al versetto specifico
    window.location.href = `https://www.jw.org/finder?wtlocale=I&prefer=lang&bible=${referenceCode}&pub=nwtsty`;
  });
}

// Funzione che cerca tutti gli h4 dentro .verse-number e aggiunge il listener
function applyListenersToAllVerses() {
  document.querySelectorAll(".verse-number h4").forEach((e) => {
    // Evita doppio listener
    if (!e.dataset.listenerAttached) {
      const noteElement = e.closest(".note"); // Cerca il contenitore più vicino
      if (noteElement) {
        attachClickListenerToVerse(e, noteElement);
        e.dataset.listenerAttached = "true";
      }
    }
  });
}

// Applica i listener iniziali ai versetti esistenti
applyListenersToAllVerses();

// Osserva il DOM per versetti aggiunti dinamicamente
const verseObserver = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.matches?.(".verse-number h4")) {
          const noteElement = node.closest(".note");
          if (noteElement) attachClickListenerToVerse(node, noteElement);
        } else {
          node.querySelectorAll?.(".verse-number h4").forEach((child) => {
            const noteElement = child.closest(".note");
            if (noteElement) attachClickListenerToVerse(child, noteElement);
          });
        }
      }
    });
  }
});

// Inizia l’osservazione del DOM
verseObserver.observe(document.body, {
  childList: true,
  subtree: true,
});
