import backendlessRequest from "./backendlessRequest.js";
import { deleteValue, getValue, setValue } from "/src/js/indexedDButils.js";
import { isDarkTheme } from "/src/js/isDarkTheme.js";
import { hideGif, showGif } from "/src/js/loadingGif.js";
import toast from "/src/js/toast.js";
import Choices from "choices.js";
import "choices.js/public/assets/styles/choices.min.css";

let editingNoteId = null;
const modal = document.querySelector(".modal");
const refreshBtn = document.querySelector(".refreshNotes");
const notesContainer = document.querySelector(".notesContainer");

const filteringTag = sessionStorage.getItem("filteringTag");
const pageTitle = document.querySelector(".notes-page-title");
if (pageTitle) pageTitle.textContent = `Note con tag "${filteringTag}"`;

// Funzione che decide se usare il server o no (server solo se online e IndexedDB vuoto)
async function shouldUseServer() {
  if (!navigator.onLine) return false;
  else if (await getValue("userNotes")) return false;
  else return true;
}

// 🔁 Carica solo le note che contengono il filteringTag
async function loadNotesByTag(forceServer = false) {
  if (!notesContainer) return;

  notesContainer.innerHTML = "<p>Caricamento in corso...</p>";
  refreshBtn?.classList.add("disabled");
  if (!navigator.onLine) forceServer = false;

  try {
    const userEmail = localStorage.getItem("userEmail");

    // Prendo i dati da server o IndexedDB in base a shouldUseServer
    console.log(await shouldUseServer(), forceServer);
    const allRecords =
      forceServer || (await shouldUseServer())
        ? (
            await backendlessRequest(
              "getData",
              {},
              { table: "NotableBiblePoints" }
            )
          )[0]?.NotablePoints || []
        : await getValue("userNotes");

    const globalUserNotes = allRecords.filter(
      (note) => note?.owner === userEmail
    );

    // Filtro le note in base all'owner e al tag filtrante
    const filteredNotes = globalUserNotes.filter((note) =>
      note?.tags?.includes(filteringTag)
    );

    // Salvo nel DB locale filtered subset (campo userNotesByTag)
    await setValue("userNotesByTag", filteredNotes);
    await setValue("userNotes", globalUserNotes);

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

      // Tags come pillole cliccabili
      const tagsHtml = note.tags
        .map((tag) => `<span class='tag-pill'>${tag}</span>`)
        .join("");

      // Icone adattate a tema scuro o chiaro
      const deleteImg = isDarkTheme
        ? "/src/assets/notes/delete/dark.webp"
        : "/src/assets/notes/delete/light.webp";
      const editImg = isDarkTheme
        ? "/src/assets/notes/edit/dark.webp"
        : "/src/assets/notes/edit/light.webp";
      const shareImg = isDarkTheme
        ? "/src/assets/notes/share/dark.webp"
        : "/src/assets/notes/share/light.webp";

      // HTML interno della nota
      noteElement.innerHTML = `
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
  if (!noteElement) return;

  // Se clicchi su pulsanti azione
  if (event.target.closest(".delete")) return deleteNote(noteElement);
  if (event.target.closest(".share")) return shareNote(noteElement);
  if (event.target.closest(".edit")) return editNote(noteElement);

  // 🖱️ Se clicchi sulla nota stessa, fullscreen SOLO per la nota e stile evidenziato
  try {
    if (document.fullscreenElement) {
      noteElement.id = "";
      await document.exitFullscreen();
    }
    noteElement.id = "clicked-note";
    await noteElement.requestFullscreen();
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
async function deleteNote(noteElement) {
  if (!confirm("Vuoi davvero eliminare questa nota?")) return;

  try {
    showGif();
    const id = noteElement.getAttribute("data-id");
    const userEmail = localStorage.getItem("userEmail");

    const online = navigator.onLine;

    let data = online
      ? (
          await backendlessRequest(
            "getData",
            {},
            { table: "NotableBiblePoints" }
          )
        )[0]
      : await getValue("userNotes");

    const notes = online ? data.NotablePoints : data;

    if (!Array.isArray(notes)) {
      toast("Errore interno: lista note non valida");
      console.error("[deleteNote] Errore: notes non è un array");
      hideGif();
      return;
    }

    const updated = notes.filter((note) => note.id !== id);

    if (online) {
      data.NotablePoints = updated;
      await backendlessRequest("saveData", data, {
        table: "NotableBiblePoints",
      });
    }

    await setValue(
      "userNotesByTag",
      updated.filter(
        (n) => n.owner === userEmail && n.tags?.includes(filteringTag)
      )
    );

    noteElement.remove();
    toast("Nota eliminata.");
  } catch (error) {
    console.error("[deleteNote] Errore durante eliminazione:", error);
    toast("Errore durante l'eliminazione della nota.");
  } finally {
    hideGif();
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

    // Carica il record contenente TUTTE le note
    let userNotes = navigator.onLine
      ? (
          await backendlessRequest(
            "getData",
            {},
            { table: "NotableBiblePoints" }
          )
        )[0]
      : await getValue("userNotes");

    if (!userNotes) userNotes = { NotablePoints: [] };

    // Tutte le note del DB o dal localStorage
    let allNotes = navigator.onLine ? userNotes.NotablePoints : userNotes;

    // Filtra solo le note dell'utente
    let userNotesOnly = allNotes.filter((note) => note.owner === userEmail);

    // Cerca la nota da modificare tra le tue
    const noteIndex = userNotesOnly.findIndex(
      (note) => note.id === editingNoteId
    );
    if (noteIndex === -1) {
      toast("Errore: impossibile trovare la nota da modificare.");
      console.warn("[saveNote] Nota da modificare NON trovata!");
      return;
    }

    // Aggiorna la nota
    userNotesOnly[noteIndex] = {
      ...userNotesOnly[noteIndex],
      ...(noteTitle && { title: noteTitle }),
      verse: verseNumber,
      updatedAt: Date.now().toString(),
      content: noteContent,
      tags: selectedTags,
    };

    if (navigator.onLine) {
      // Ricostruisci l'array completo con le tue note aggiornate + le altre intatte
      userNotes.NotablePoints = [
        ...allNotes.filter((n) => n.owner !== userEmail),
        ...userNotesOnly,
      ];

      await backendlessRequest("saveData", userNotes, {
        table: "NotableBiblePoints",
      });
    } else {
      // Offline: salva solo le tue
      await setValue("userNotes", userNotesOnly);
    }

    editingNoteId = null;
    modal.style.display = "none";

    if (navigator.onLine) await deleteValue("userNotes");

    navigator.onLine ? await loadNotesByTag(true) : await loadNotesByTag();
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

// Bottone refresh: se online elimina cached userNotesByTag per forzare reload server, poi carica le note
refreshBtn?.addEventListener("click", async () => {
  if (navigator.onLine) await deleteValue("userNotesByTag");
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
    ? await backendlessRequest("getData", {}, { table: "NotableBiblePoints" })
    : await getValue("userNotes");
  const allPoints = Array.isArray(res) ? res : res[0]?.NotablePoints || [];
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

// Funzione per aggiornare Choices.js con i tag freschi
async function refreshTagChoices() {
  const userEmail = localStorage.getItem("userEmail");
  const res = (await shouldUseServer())
    ? await backendlessRequest("getData", {}, { table: "NotableBiblePoints" })
    : await getValue("userNotes");

  const allNotes = Array.isArray(res) ? res : res[0]?.NotablePoints || [];
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
