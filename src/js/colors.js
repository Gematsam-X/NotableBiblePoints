import "/src/icons.css";
import "/src/styles.css";
import Choices from "choices.js";
import "choices.js/public/assets/styles/choices.min.css";
import backendlessRequest from "/src/js/backendlessRequest.js";
import { deleteValue, getValue, setValue } from "/src/js/indexedDButils.js";
import { hideGif, showGif } from "/src/js/loadingGif.js";
import shouldUseServer from "/src/js/shouldUseServer.js";
import toast from "/src/js/toast.js";

let editingNoteId = null;
const modal = document.querySelector(".modal");
const refreshBtn = document.querySelector(".refreshNotes");
const notesContainer = document.querySelector(".notesContainer");
const selectedColorContainer = document.querySelector(
  "#selectedColorContainer"
);

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

const lightThemeColors = [
  "#FF8A8050",
  "#66CC6650",
  "#0066CC33",
  "#33D6B250",
  "#9900B330",
  "#CC660030",
];

const darkThemeColors = [
  "#FF334455",
  "#06E91150",
  "#42A4F550",
  "#00FFBF50",
  "#D900FF50",
  "#FF990050",
];

const colors = document.body.classList.contains("dark-theme")
  ? darkThemeColors
  : lightThemeColors;

const userEmail = localStorage.getItem("userEmail");
const userToken = localStorage.getItem("userToken");

const colorsContainer = document.querySelector("#colorsContainer");
const hiddenInput = document.getElementById("noteColorInput");
const editColor = document.querySelector("#colorSelector");
let selectedEditColorIndex = null;

colors.forEach((color, index) => {
  const circle = document.createElement("div");
  circle.classList.add("color-circle");
  circle.style.backgroundColor = color;
  circle.dataset.index = index; // salva l’indice, NON il colore!

  circle.addEventListener("click", () => {
    if (selectedEditColorIndex === index) return; // già selezionato

    // Deseleziona tutti
    editColor
      .querySelectorAll(".color-circle")
      .forEach((c) => c.classList.remove("selected"));

    // Seleziona questo
    circle.classList.add("selected");

    // Aggiorna valori
    hiddenInput.value = index;
    selectedEditColorIndex = index;
  });

  editColor.appendChild(circle);
});

// Prende tutti i pallini (dopo il rendering)
const circles = editColor.querySelectorAll(".color-circle");

function setColor(colorIndex) {
  const colorIndexInt = parseInt(colorIndex);
  // Salvo l’indice nell’input nascosto
  hiddenInput.value = colorIndexInt;
  // Aggiorno variabile globale
  selectedEditColorIndex = colorIndexInt;
  // Rimuovo la classe "selected" da tutti i cerchi
  circles.forEach((circle) => circle.classList.remove("selected"));
  // Controllo i cerchi uno per uno
  circles.forEach((circle) => {
    const index = parseInt(circle.getAttribute("data-index"));
    if (index === colorIndexInt) {
      circle.classList.add("selected");
    }
  });
}

// Resetta la selezione colore
function resetColor() {
  hiddenInput.value = "";
  selectedEditColorIndex = null;
  circles.forEach((circle) => circle.classList.remove("selected"));
}

// Quando l’utente clicca su "Nessun colore"
document
  .querySelector(".no-color-label")
  ?.addEventListener("click", resetColor);

let notes = [];
let allColors = [];
let selectedColorIndex = null;

// === CARICA COLORI E NOTE ===
async function loadColors(forceServer = false) {
  try {
    if (!navigator.onLine) forceServer = false;
    if (!selectedColorContainer.innerHTML.trim()) selectedColorIndex = null;
    selectedColorContainer.innerHTML = "";
    notesContainer.innerText = "Caricamento in corso...";

    if (forceServer || (await shouldUseServer())) {
      // Richiesta al server Backendless
      notes = await backendlessRequest(
        "notes:get",
        { email: userEmail },
        userToken
      ); // Log per debug
    } else {
      // Prendiamo le note salvate localmente in IndexedDB
      notes = await getValue("userNotes"); // Log per debug
    }

    await setValue("userNotes", notes);

    const theme = localStorage.getItem("theme") === "dark" ? "dark" : "light";
    allColors = theme === "dark" ? darkThemeColors : lightThemeColors;

    renderColors();
  } catch (error) {
    if (error.message.toLowerCase().includes("not existing user token")) {
      toast("Sessione scaduta. Effettua nuovamente il login per continuare.");
      logoutUser();
    } else if (error.message.toLowerCase().includes("429")) {
      toast("Si è verificato un errore tecnico. Riprova tra un minuto.");
    } else {
      console.error("Errore:", error);
      toast(`Errore: ${error.message}`);
    }
  }
}

// === RENDER COLORI ===
function renderColors() {
  colorsContainer.innerHTML = "";
  colorsContainer.style.display = "flex";
  colorsContainer.style.justifyContent = "center";
  colorsContainer.style.flexWrap = "wrap";
  colorsContainer.style.gap = "10px";
  colorsContainer.style.width = "100%";

  allColors.forEach((color, index) => {
    const colorEl = document.createElement("div");
    colorEl.className = "color-circle";
    colorEl.style.backgroundColor = color;
    colorEl.dataset.index = index;
    colorsContainer.appendChild(colorEl);
  });
}

// === MOSTRA NOTE PER COLORE ===
function showNotesForColor(colorIndex) {
  selectedColorIndex = colorIndex;

  const notesFound = notes.filter((n) => n.colorIndex === colorIndex);
  notesContainer.innerHTML = "";

  // HTML del cerchio selezionato
  if (notesFound.length === 0) {
    selectedColorContainer.innerHTML = `
      <div class="selectedColorIconBtn">
        <div class="color-circle selected" id="filteringColorElement" 
             style="user-select: none; cursor: not-allowed;"></div>
        <button id="removeColorBtn" class="colorActionBtn">Elimina colore da tutte le note</button>
      </div>
      <br><br>
      <h3>Non hai ancora salvato nessuna nota con questo colore</h3>
    `;

    document.getElementById("removeColorBtn").onclick = async () => {
      toast("Nessuna nota da aggiornare ");
    };
  } else {
    selectedColorContainer.innerHTML = `
      <div class="selectedColorIconBtn">
        <div class="color-circle selected" id="filteringColorElement" 
             style="user-select: none; cursor: not-allowed;"></div>
        <button id="removeColorBtn" class="colorActionBtn">Elimina colore da tutte le note</button>
      </div>
      <br><br>
      <h3>Note con questo colore (${notesFound.length})</h3>
    `;
  }

  const circle = document.getElementById("filteringColorElement");
  if (circle) {
    circle.style.backgroundColor = colors[Number(colorIndex)];
  } else {
    console.warn("⚠️ Cerchio non trovato! Controlla l'ID o l'HTML.");
  }

  // Render note
  notesFound.forEach((note) => {
    const noteElement = document.createElement("div");
    noteElement.classList.add("note");
    noteElement.setAttribute("data-id", note.id);
    if (note.tags?.length) {
      noteElement.setAttribute("data-tags", JSON.stringify(note.tags));
    }
    noteElement.setAttribute("data-book", note.book);
    noteElement.setAttribute("data-chapter", JSON.stringify(note.chapter));

    if (
      note.colorIndex !== null &&
      Number.isInteger(note.colorIndex) &&
      note.colorIndex >= 0
    ) {
      noteElement.setAttribute("data-colorIndex", note.colorIndex);
      noteElement.style.backgroundColor = colors[note.colorIndex];
    } else {
      noteElement.style.backgroundColor = "inherit";
    }

    const tagsHtml =
      note.tags
        ?.map((tag) => `<span class='tag-pill'>${tag}</span>`)
        .join("") || "";

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
        <button class="delete"><span class="fi-sr-delete"></span></button>
        <button class="edit"><span class="fi-sr-edit"></span></button>
        <button class="share"><span class="fi-sr-share"></span></button>
      </div>
    `;

    notesContainer.appendChild(noteElement);
  });

  // 🔹 Listener click sulle note (aggiunto una volta sola)
  if (!notesContainer._listenerAdded) {
    notesContainer.addEventListener("click", async (event) => {
      const tagClicked = event.target.closest(".tag-pill");
      if (tagClicked) {
        const newTag = tagClicked.textContent.toLowerCase().trim();
        sessionStorage.setItem("filteringTag", newTag);
        window.location.href = "/src/html/notesByTag.html";
        return;
      }

      const noteElement = event.target.closest(".note");
      if (!noteElement || noteElement.id) return;

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

      document
        .querySelectorAll(".note")
        .forEach((el) => el.removeAttribute("id"));
      noteElement.id = "clicked-note";
    });
    notesContainer._listenerAdded = true;
  }

  // click rimuovi colore
  const removeBtn = document.getElementById("removeColorBtn");
  if (removeBtn) {
    removeBtn.onclick = async () => {
      showGif();
      const updatedNotes = notes.map((note) =>
        note.colorIndex === colorIndex ? { ...note, colorIndex: null } : note
      );
      try {
        await setValue("userNotes", updatedNotes);
        await backendlessRequest(
          "notes:addOrUpdate",
          { email: userEmail, note: updatedNotes },
          userToken
        );
        notes = updatedNotes;
        toast("Colore rimosso da tutte le note ✅");
        showNotesForColor(colorIndex);
      } catch (error) {
        console.error("Errore:", error);
        if (error.message.toLowerCase().includes("not existing user token")) {
          toast(
            "Sessione scaduta. Effettua nuovamente il login per continuare."
          );
          logoutUser();
        } else if (error.message.toLowerCase().includes("429")) {
          toast("Si è verificato un errore tecnico. Riprova tra un minuto.");
        } else {
          toast(`Errore: ${error.message}`);
        }
      } finally {
        hideGif();
      }
    };
  }
}

// === EVENTI ===
// click sui colori
document.addEventListener("click", (event) => {
  const colorEl = event.target.closest(".color-circle");
  if (!colorEl) return;
  const index = parseInt(colorEl.dataset.index);
  showNotesForColor(index);
});

// refresh manuale
refreshBtn.addEventListener("click", async () => {
  await loadColors(true);
  if (selectedColorIndex !== null) showNotesForColor(selectedColorIndex);
});

// Caricamento iniziale
window.addEventListener("load", async () => {
  await loadColors();
});

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
  const noteColorIndex = noteElement.getAttribute("data-colorindex");

  const tagString = noteElement.getAttribute("data-tags");

  // Metto i valori dentro la modale
  document.querySelector("#noteTitle").value = title;
  document.querySelector("#noteContent").value = content;
  document.querySelector("#verseNumber").value = verse;
  setColor(noteColorIndex);
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

let tagChoices;
let tagChoicesArray = []; // lista globale di tutti i tag disponibili

(async () => {
  try {
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
          if (t && typeof t === "string") tagSet.add(t.toLowerCase().trim());
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
      shouldSort: true,
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
      return tagChoices
        .getValue(true)
        .some((t) => t.toLowerCase().trim() === v);
    }

    // 7️⃣ Evento di ricerca: filtra + opzione “Crea nuovo”
    tagSelect.addEventListener("search", (e) => {
      const q = e.detail.value.toLowerCase().trim();
      if (!q) {
        updateChoicesDropdown();
        tagChoices.hideDropdown();
        return;
      }
      const filtered = tagChoicesArray.filter((c) =>
        c.value.toLowerCase().trim().startsWith(q)
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
        const newTag = v.replace("__add__", "").toLowerCase().trim();
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

    const inputEl = document.querySelector(".choices__inner input");

    // Event listener: trasforma in minuscolo mentre si scrive
    inputEl.addEventListener("input", () => {
      const cursorPos = inputEl.selectionStart; // Salviamo posizione del cursore
      inputEl.value = inputEl.value.toLowerCase(); // Trasformiamo in minuscolo
      inputEl.setSelectionRange(cursorPos, cursorPos); // Ripristiniamo posizione
    });

    inputEl.addEventListener("paste", (e) => {
      e.preventDefault(); // Impedisce l'incollaggio di default

      const clipboardText = (e.clipboardData || window.clipboardData).getData(
        "text"
      );
      const lowercaseText = clipboardText.toLowerCase();

      const start = inputEl.selectionStart;
      const end = inputEl.selectionEnd;

      const currentValue = inputEl.value;
      const newValue =
        currentValue.substring(0, start) +
        lowercaseText +
        currentValue.substring(end);

      inputEl.value = newValue;

      // Riposiziona il cursore dopo il testo incollato
      const newCursorPos = start + lowercaseText.length;
      inputEl.setSelectionRange(newCursorPos, newCursorPos);
    });
  } catch (error) {
    if (error.message.toLowerCase().includes("not existing user token")) {
      toast("Sessione scaduta. Effettua nuovamente il login per continuare.");
      logoutUser();
    } else if (error.message.toLowerCase().includes("429")) {
      toast("Si è verificato un errore tecnico. Riprova tra un minuto.");
    } else {
      console.error("Errore:", error);
      toast(`Errore: ${error.message}`);
    }
  }
})();

// Funzione per aggiornare Choices.js con i tag freschi
async function refreshTagChoices() {
  try {
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
        note.tags.forEach((t) => tagSet.add(t.toLowerCase().trim()));
      }
    });

    const choicesArray = Array.from(tagSet).map((tag) => ({
      value: tag,
      label: tag,
    }));
    tagChoices.setChoices(choicesArray, "value", "label", true);
  } catch (error) {
    if (error.message.toLowerCase().includes("not existing user token")) {
      toast("Sessione scaduta. Effettua nuovamente il login per continuare.");
      logoutUser();
    } else if (error.message.toLowerCase().includes("429")) {
      toast("Si è verificato un errore tecnico. Riprova tra un minuto.");
    } else {
      console.error("Errore:", error);
      toast(`Errore: ${error.message}`);
    }
  }
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

  document.querySelectorAll(".note").forEach((el) => el.removeAttribute("id"));
});

const observer = new MutationObserver(() => {
  window.setTimeout(() => {
    if (document.querySelector(".notesContainer").children.length === 0)
      document.querySelector(".notesContainer").innerHTML = `<br>`;
  }, 500);
});

// Configura l'osservatore per rilevare aggiunte e rimozioni di nodi
observer.observe(document.querySelector(".notesContainer"), {
  childList: true,
});

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

    // Crea il codice JW.org: es. "20 005 004"
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

document
  .querySelector(".notesContainer")
  ?.addEventListener("click", (event) => {
    const closestNote = event.target.closest(".note");

    function clickedButton(btnClass) {
      return (
        event.target.classList.contains(btnClass) ||
        event.target.classList.contains(`fi-sr-${btnClass}`)
      );
    }

    if (closestNote) {
      // Gestione del bottone "Elimina"
      if (clickedButton("delete")) deleteNote(closestNote);

      // Gestione del bottone "Condividi"
      if (clickedButton("share")) shareNote(closestNote);

      // Gestione del bottone "Modifica"
      if (clickedButton("edit")) editNote(closestNote);

      if (clickedButton("close-note")) document.exitFullscreen();
    }
  });

// Listener per il salvataggio della nota modificata
document.querySelector("#saveNote").addEventListener("click", saveNote);

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
      colorIndex: selectedEditColorIndex,
      tags: selectedTags,
    };

    if (navigator.onLine)
      await backendlessRequest(
        "notes:addOrUpdate",
        { email: localStorage.getItem("userEmail"), note: notes[noteIndex] },
        localStorage.getItem("userToken")
      );
    else await setValue("userNotes", notes);

    editingNoteId = null;
    modal.style.display = "none";

    if (navigator.onLine) await deleteValue("userNotes");

    hideGif();

    navigator.onLine ? await loadColors(true) : await loadColors();

    showNotesForColor(selectedColorIndex);
  } catch (error) {
    if (error.message.toLowerCase().includes("not existing user token")) {
      toast("Sessione scaduta. Effettua nuovamente il login per continuare.");
      logoutUser();
    } else if (error.message.toLowerCase().includes("429")) {
      toast("Si è verificato un errore tecnico. Riprova tra un minuto.");
    } else {
      console.error("Errore:", error);
      toast(`Errore: ${error.message}`);
    }
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

    await loadColors();
    if (selectedColorIndex !== null) showNotesForColor(selectedColorIndex);
    // 5. Messaggio di successo
    toast("Nota eliminata con successo!");
  } catch (error) {
    // Controlla se l'errore riguarda token scaduto
    if (error.message.toLowerCase().includes("not existing user token")) {
      toast("Sessione scaduta. Effettua nuovamente il login per continuare.");
      logoutUser();
    }
    // Controlla se l'errore è un rate limit (429)
    else if (error.message.toLowerCase().includes("429")) {
      toast("Si è verificato un errore tecnico. Riprova tra un minuto.");
    }
    // Altri errori generici
    else {
      console.error("[deleteNote] Errore durante eliminazione:", error);
      toast(`Errore: ${error.message}`);
    }
  } finally {
    hideGif();
  }
}
