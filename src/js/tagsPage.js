import "/src/styles.css";
import backendlessRequest from "/src/js/backendlessRequest.js";
import shouldUseServer from "/src/js/shouldUseServer.js";
import { getValue, setValue } from "/src/js/indexedDButils.js";
import toast from "/src/js/toast.js";
import { showGif, hideGif } from "/src/js/loadingGif.js";

// Recupera l'email e il token dell'utente dal localStorage
const userEmail = localStorage.getItem("userEmail");
const userToken = localStorage.getItem("userToken");

// Contenitore dei tag e riferimento alla modale
const tagsContainer = document.querySelector("#userTags");
const modal = document.querySelector(".modal");
const modalBody = document.querySelector(".modal-content .modal-body");

let selectedTag = null;

// Funzione principale per caricare i tag
async function loadTags(forceServer = false) {
  // Se sei offline, forza l'uso dell'IndexedDB
  if (!navigator.onLine) forceServer = false;

  tagsContainer.innerText = "Caricamento in corso...";

  // Ottiene tutte le note o dal server o dal database locale
  const notes =
    forceServer || (await shouldUseServer())
      ? await backendlessRequest("notes:get", { email: userEmail }, userToken)
      : await getValue("userNotes");

  // Se abbiamo caricato dal server, salviamo una copia in locale
  if (forceServer) await setValue("userNotes", notes);

  // Estrai tutti i tag da tutte le note
  const allTags = new Set();
  notes.forEach((note) => {
    note.tags?.forEach((tag) => allTags.add(tag));
  });

  // Pulisci il contenitore dei tag e aggiungi quelli trovati
  tagsContainer.innerHTML = "";
  allTags.forEach((tag) => {
    const tagElement = document.createElement("span");
    tagElement.classList.add("tag-pill");
    tagElement.textContent = tag;
    tagsContainer.appendChild(tagElement);
  });
}

window.addEventListener("load", () => loadTags());

// Pulsante per aggiornare i tag forzando la richiesta al server
document.querySelector(".refreshNotes").addEventListener("click", async () => {
  await loadTags(true);
});

// Quando clicchi su un tag, apri la modale con le opzioni
document.addEventListener("click", (event) => {
  const tagElement = event.target.closest(".tag-pill");
  if (!tagElement) return;
  event.stopPropagation(); // Evita che l'evento si propaghi oltre
  selectedTag = tagElement.textContent.trim(); // Salva il tag selezionato
  showTagOptions(selectedTag); // Mostra la modale
});

// Mostra le opzioni disponibili per il tag selezionato
function showTagOptions(tag) {
  selectedTag = tag;

  // HTML iniziale: solo pulsanti, input nascosto
  modalBody.innerHTML = `
    <h2>Tag "<strong>${tag}</strong>"</h2>
    <button class="tagActionBtn" id="viewNotesBtn">
      <span class="fi-sr-eye"></span> Vedi tutte le note con questo tag
    </button>
    <button class="tagActionBtn" id="editTagBtn">
      <span class="fi-sr-edit"></span> Modifica tag
    </button>
    <div id="editTagInputWrapper">
      <label for="editTagInput">Rinomina tag:</label>
      <input type="text" id="editTagInput" value="${tag}" />
      <button id="saveTagBtn" class="tagActionBtn">
        <span class="fi-sr-edit"></span> Salva modifica
      </button>
    </div>
    <button class="tagActionBtn" id="deleteTagBtn">
      <span class="fi-sr-delete"></span> Rimuovi tag da tutte le note
    </button>
  `;

  modal.style.display = "block";

  // Event listener: "Vedi tutte le note"
  document.getElementById("viewNotesBtn").addEventListener("click", () => {
    sessionStorage.setItem("filteringTag", tag);
    window.location.href = "/src/html/notesByTag.html";
  });

  const inputEl = document.getElementById("editTagInput");

  // Event listener: mostra input + salva al click su "Modifica tag"
  document.getElementById("editTagBtn").addEventListener("click", () => {
    document.getElementById("editTagInputWrapper").style.display = "block";
    document.getElementById("editTagBtn").style.display = "none";
    // Metti focus e seleziona testo nell'input appena appare
    inputEl.focus();
    inputEl.select();
  });

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

  document.addEventListener("keydown", (e) => {
    // Se premi Esc, chiudi la modale
    if (e.key === "Escape") {
      document.getElementById("editTagInputWrapper").style.display = "none";
      modal.style.display = "none";
      selectedTag = null;
    }
    // Se premi Enter, salva la modifica del tag
    if (
      e.key === "Enter" &&
      document.getElementById("editTagInputWrapper").style.display === "block"
    ) {
      document.getElementById("saveTagBtn").click();
    }
  });

  // Event listener: salva modifica tag
  document.getElementById("saveTagBtn").addEventListener("click", async () => {
    const inputEl = document.getElementById("editTagInput");
    const newTag = inputEl.value.toLowerCase().trim();

    if (!newTag) {
      toast("Inserisci un valore valido per il tag.");
      return;
    }

    showGif();

    const notes = await getValue("userNotes");

    const allTags = new Set();
    notes.forEach((note) => {
      note.tags?.forEach((t) => allTags.add(t.toLowerCase().trim()));
    });

    if (
      allTags.has(newTag.toLowerCase().trim()) &&
      newTag.toLowerCase().trim() !== tag.toLowerCase().trim()
    ) {
      toast(`Esiste già un tag chiamato "${newTag}". Scegli un nome diverso.`);
      return;
    }

    notes.forEach((note) => {
      if (
        note.tags?.some(
          (t) => t.toLowerCase().trim() === tag.toLowerCase().trim()
        )
      ) {
        note.tags = note.tags.map((t) =>
          t.toLowerCase().trim() === tag.toLowerCase().trim()
            ? newTag.toLowerCase().trim()
            : t.toLowerCase().trim()
        );
        note.updatedAt = Date.now();
      }
    });

    await setValue("userNotes", notes);
    if (navigator.onLine)
      await backendlessRequest(
        "notes:addOrUpdate",
        { email: userEmail, note: notes },
        userToken
      );

    modal.style.display = "none";
    hideGif();
    loadTags();
  });

  // Event listener: elimina tag
  document
    .getElementById("deleteTagBtn")
    .addEventListener("click", async () => {
      const notes = await getValue("userNotes");
      notes.forEach((note) => {
        if (note.tags?.includes(tag)) {
          note.tags = note.tags.filter((t) => t !== tag);
          note.updatedAt = Date.now();
        }
      });

      await setValue("userNotes", notes);
      if (navigator.onLine) {
        await backendlessRequest(
          "notes:addOrUpdate",
          { email: userEmail, note: notes },
          userToken
        );
      }

      modal.style.display = "none";
      loadTags();
    });

  // Chiudi modale con la X
  document.getElementById("closeModalBtn").addEventListener("click", () => {
    document.getElementById("editTagInputWrapper").style.display = "none";
    modal.style.display = "none";
    selectedTag = null;
  });
}

// Chiudi la modale cliccando fuori dal contenuto
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});
