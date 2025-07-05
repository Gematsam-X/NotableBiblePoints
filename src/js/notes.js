import backendlessRequest from "./backendlessRequest.js";
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
async function shouldUseServer() {
  if (!navigator.onLine) return false;
  else if (await getValue("userNotes")) return false;
  else if (!(await getValue("userNotes"))) return true;
}

const modal = document.querySelector(".modal");

// Funzione per aprire la modale
document.querySelector(".openModal").addEventListener("click", () => {
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
      ? (
          await backendlessRequest(
            "getData",
            {},
            { table: "NotableBiblePoints" }
          )
        )[0]?.NotablePoints || []
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
      if (await shouldUseServer()) {
        await setValue("userNotes", userNotes);
      }

      // Filtra e ordina le note
      userNotes.forEach((noteObj) => {
        if (noteObj) {
          if (
            noteObj.book === selectedBook &&
            noteObj.chapter === selectedChapter &&
            noteObj.owner === userEmail
          ) {
            notesFound = true;
            const { verse, title = "", content, id: noteId } = noteObj;
            allNotes.push({ verse, title, content, noteId });
          }
        }
      });

      // Ordina per versetto
      allNotes.sort((a, b) => a.verse - b.verse);

      // Aggiungi le note al contenitore
      allNotes.forEach(({ verse, title, content, noteId }) => {
        const noteElement = document.createElement("div");
        noteElement.classList.add("note");
        noteElement.setAttribute("data-id", noteId);

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
          </div>
          <div class="note-body">
            <h2 class="note-title">${title}</h2>
            <h3>${content}</h3>
          </div>

          <div class="note-action-buttons">
          <button class="delete"><img class="deleteNote_img" src="${deleteImageSrc}" width="40px" height="40px"></button>
          <button class="edit"><img class="edit_img" src="${editImageSrc}" width="40px" height="40px"></button>
          <button class="share"><img class="share_img" src="${shareImageSrc}" width="40px" height="40px"></button>
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
      logoutUser();
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

// Async function to save or update a note
async function saveNote() {
  const noteTitle = document.querySelector("#noteTitle").value.trim();
  const verseNumber = parseInt(document.querySelector("#verseNumber").value);
  const noteContent = document.querySelector("#noteContent").value.trim();

  if (isNaN(verseNumber) || !noteContent) {
    toast("Compila tutti i campi correttamente!");
    return;
  }
  modal.style.display = "none";
  showGif();

  try {
    const userEmail = localStorage.getItem("userEmail");

    // Recupera il record dal database che contiene tutte le note
    let userNotes = navigator.onLine
      ? (
          await backendlessRequest(
            "getData",
            {},
            { table: "NotableBiblePoints" }
          )
        )[0]
      : await getValue("userNotes");

    // Se non esiste un record, creiamo uno vuoto con un array di note
    if (!userNotes) {
      userNotes = { NotablePoints: [] };
    }

    let notes = navigator.onLine ? userNotes.NotablePoints : userNotes;

    // Se stai modificando una nota
    if (editingNoteId) {
      const noteIndex = notes.findIndex((note) => note.id === editingNoteId);
      if (noteIndex === -1) {
        toast("Errore: impossibile trovare la nota da modificare.");
        return;
      }

      notes[noteIndex] = {
        ...notes[noteIndex],
        ...(noteTitle && { title: noteTitle }),
        verse: verseNumber,
        updatedAt: Date.now().toString(),
        content: noteContent,
      };
    } else {
      // Se stai creando una nuova nota
      const newNote = {
        id: Date.now().toString(),
        title: noteTitle || " ",
        verse: verseNumber,
        content: noteContent,
        chapter: parseInt(sessionStorage.getItem("selectedChapter")),
        book: sessionStorage.getItem("selectedBook"),
        owner: userEmail,
      };

      notes.push(newNote);
    }

    // Aggiorna il record principale
    userNotes.NotablePoints = notes;

    if (navigator.onLine) {
      await backendlessRequest("saveData", userNotes, {
        table: "NotableBiblePoints",
      });

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

    if (navigator.onLine) {
      await deleteValue("userNotes");
      console.log("locale eliminato");
    }

    loadNotes();
  } catch (error) {
    console.error("Errore durante il salvataggio/modifica:", error);
    toast("Errore durante il salvataggio. Riprova più tardi.");
  } finally {
    document.querySelector("#noteContent").value = "";
    document.querySelector("#noteTitle").value = "";
    document.querySelector("#verseNumber").value = "";
    hideGif();
  }
}

document.querySelector("#saveNote").addEventListener("click", saveNote);

document.addEventListener("click", (event) => {
  const closestNote = event.target.closest(".note");
  if (closestNote) {
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
    console.log("Uscito dal fullscreen!");
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
    let userNotes = navigator.onLine
      ? (
          await backendlessRequest(
            "getData",
            {},
            { table: "NotableBiblePoints" }
          )
        )[0]
      : await getValue("userNotes");

    console.log(userNotes);

    if (
      (navigator.onLine && !userNotes.NotablePoints) ||
      (!navigator.onLine && !userNotes)
    ) {
      toast("Errore: impossibile trovare le note dell'utente.");
      return;
    }

    // Filtra le note eliminando quella con l'id corrispondente
    const updatedNotes = navigator.onLine
      ? userNotes.NotablePoints.filter((note) => note.id !== noteId)
      : userNotes.filter((note) => note.id !== noteId);

    // Aggiorna l'oggetto
    navigator.onLine
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
    if (navigator.onLine) {
      await backendlessRequest("saveData", userNotes, {
        table: "NotableBiblePoints",
      });
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
      .then(() => console.log("Condivisione avvenuta con successo!"))
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
  console.log("Editing note...");

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

refreshBtn.addEventListener("click", async () => {
  if (sessionStorage.getItem("canRefresh") !== "false") {
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
  } else {
    // Se il libro non è trovato, puoi gestire l'errore
    toast(
      "C'è stato un errore nel reindirizzamento. Si prega di riprovare più tardi."
    );
  }
});
