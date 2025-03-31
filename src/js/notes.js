import { isDarkTheme } from "./isDarkTheme.js";
import { hideGif, showGif } from "./loadingGif.js";
import toast from "./toast.js";

// Recupera il libro e il capitolo selezionati dal sessionStorage
const selectedBook = sessionStorage.getItem("selectedBook");
const chapter = parseInt(sessionStorage.getItem("selectedChapter"));

// Imposta il titolo della pagina
const pageTitle = document.querySelector(".notes-page-title");
const title = `Punti notevoli del capitolo ${chapter} di ${selectedBook}`;

if (pageTitle) {
  pageTitle.textContent = title;
  window.document.title = `${title} - NotableBiblePoints`;
}

// Funzione per controllare se bisogna usare il server
function shouldUseServer() {
  const localNotes = localStorage.getItem("userNotes");
  return !localNotes || localNotes === "null"; // Se non ci sono dati locali, usa il server
}

// Funzione per aprire la modale
document.querySelector(".openModal").addEventListener("click", () => {
  document.querySelector(".modal").style.display = "block";
});

// Funzione per chiudere la modale
document.querySelector(".closeModal").addEventListener("click", () => {
  document.querySelector("#noteContent").value = "";
  document.querySelector("#noteTitle").value = "";
  document.querySelector("#verseNumber").value = "";
  document.querySelector(".modal").style.display = "none";
});

// Funzione per caricare le note dal database o dal localStorage
async function loadNotes() {
  const notesContainer = document.querySelector(".notesContainer");
  if (!notesContainer) return;

  notesContainer.innerHTML = "<p>Caricamento in corso...</p>";

  try {
    const userEmail = localStorage.getItem("userEmail");

    const allRecords = shouldUseServer()
      ? (await Backendless.Data.of("NotableBiblePoints").findFirst()).NotablePoints
      : JSON.parse(localStorage.getItem("userNotes"));

    if (!allRecords) {
      toast("Errore: dati non trovati.");
      hideGif();
      return;
    }

    console.log("Dati attuali:", allRecords);

    // Filtra i dati per rimuovere quelli dell'utente
    console.log(allRecords);
    const userNotes = allRecords.filter(
      (entry) => entry.owner == userEmail
    );

    console.log("Dati aggiornati:", userNotes);

    localStorage.setItem("userNotes", JSON.stringify(userNotes));

    console.log("Note di", userEmail);

    notesContainer.innerHTML = ""; // Svuota il contenitore
    let notesFound = false;
    let allNotes = [];

    if (Array.isArray(userNotes) && userNotes.length > 0) {
      if (shouldUseServer()) {
        localStorage.setItem("userNotes", JSON.stringify(userNotes)); // Salva nel localStorage
      }

      userNotes.forEach((noteObj) => {
        if (noteObj) {
          if (
            noteObj.book === selectedBook &&
            noteObj.chapter === chapter &&
            noteObj.owner === userEmail
          ) {
            notesFound = true;
            const { verse, title = "", content, id: noteId } = noteObj;
            allNotes.push({ verse, title, content, noteId });
          }
        }
      });

      allNotes.sort((a, b) => a.verse - b.verse);

      allNotes.forEach(({ verse, title, content, noteId }) => {
        const noteElement = document.createElement("div");
        noteElement.classList.add("note");
        noteElement.setAttribute("data-id", noteId);

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
          </div>
          <div class="note-body">
            <h2 class="note-title">${title}</h2>
            <h3>${content}</h3>
          </div>
          <button class="delete"><img class="deleteNote_img" src="${deleteImageSrc}" width="40px" height="40px"></button>
          <button class="edit"><img class="edit_img" src="${editImageSrc}" width="40px" height="40px"></button>
          <button class="share"><img class="share_img" src="${shareImageSrc}" width="40px" height="40px"></button>
        `;

        notesContainer.appendChild(noteElement);
      });
    }

    if (!notesFound) {
      notesContainer.innerHTML =
        "<p>Non hai salvato nessun punto notevole per questo capitolo. Creane uno usando il pulsante in basso a destra con l'icona '+'.</p>";
    }
  } catch (error) {
    console.error("Errore nel recupero delle note:", error);
    toast(`Errore: ${error.message}`);
    notesContainer.innerHTML = `<p>Errore nel caricamento delle note. Riprova più tardi.<br>Dettagli: ${error.message}</p>`;
  } finally {
    document.querySelector("#noteContent").value = "";
    document.querySelector("#noteTitle").value = "";
    document.querySelector("#verseNumber").value = "";
  }
}

// Carica le note al caricamento della pagina
window.addEventListener("load", loadNotes);

async function saveNote() {
  const noteTitle = document.querySelector("#noteTitle").value.trim();
  const verseNumber = parseInt(document.querySelector("#verseNumber").value);
  const noteContent = document.querySelector("#noteContent").value.trim();

  if (isNaN(verseNumber) || !noteContent) {
    toast("Compila tutti i campi correttamente!");
    return;
  }

  showGif();

  try {
    const userEmail = localStorage.getItem("userEmail");
    let userNotes = await Backendless.Data.of("NotableBiblePoints").findFirst({
      condition: `email = '${userEmail}'`,
    });

    if (!userNotes) {
      userNotes = { owner: userEmail, NotablePoints: "[]" };
    }

    let notes = [];
    try {
      notes = userNotes.NotablePoints || [];
    } catch (err) {
      console.error("Errore nel parsing delle note:", err);
      notes = [];
    }

    if (editingNoteId) {
      // ✏️ MODIFICA NOTA ESISTENTE
      const noteIndex = notes.findIndex((note) => note.id === editingNoteId);
      if (noteIndex === -1) {
        toast("Errore: impossibile trovare la nota da modificare.");
        return;
      }

      notes[noteIndex] = {
        ...notes[noteIndex],
        ...(noteTitle && { title: noteTitle }),
        verse: verseNumber,
        content: noteContent,
      };
    } else {
      // ➕ CREAZIONE NUOVA NOTA
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

    // Salva le note aggiornate
    userNotes.NotablePoints = JSON.stringify(notes);
    await Backendless.Data.of("NotableBiblePoints").save(userNotes);

    // Pulisce lo stato di modifica
    editingNoteId = null;
    document.querySelector(".modal").style.display = "none";
    localStorage.removeItem("userNotes");
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

// 🚀 Assegna un solo event listener fisso al pulsante SALVA
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

  try {
    const noteId = noteElement.getAttribute("data-id"); // Prendi l'ID della nota

    if (!noteId) {
      toast("Errore: impossibile trovare l'ID della nota.");
      return;
    }

    const userEmail = localStorage.getItem("userEmail");

    // Carica tutte le note dell'utente
    let userNotes = await Backendless.Data.of("NotableBiblePoints").findFirst({
      condition: `email = '${userEmail}'`,
    });

    if (!userNotes) {
      toast("Errore: impossibile trovare le note dell'utente.");
      return;
    }

    let notes = [];
    if (userNotes.NotablePoints) {
      notes = userNotes.NotablePoints;
    }

    const updatedNotes = notes.filter((note) => note.id !== noteId);

    userNotes.NotablePoints = JSON.stringify(updatedNotes);

    await Backendless.Data.of("NotableBiblePoints").save(userNotes);

    noteElement.remove(); // Rimuove la nota dal DOM
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

  const shareText = `Ho trovato un punto notevole interessante al versetto ${verseNumber} del capitolo ${chapter} di ${selectedBook}: ${noteContent}`;

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

document.addEventListener("keypress", (event) => {
  if (event.key === "Enter" && event.target.id === "noteContent") {
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
  const modal = document.querySelector(".modal");
  modal.style.display = "block";

  // Eventi per chiudere la modale
  document.addEventListener("keydown", function escHandler(event) {
    if (event.key === "Escape") {
      modal.style.display = "none";
      editingNoteId = null;
      document.removeEventListener("keydown", escHandler);
    }
  });

  modal.addEventListener("click", function outsideClickHandler(event) {
    if (event.target === modal) {
      modal.style.display = "none";
      editingNoteId = null;
      modal.removeEventListener("click", outsideClickHandler);
    }
  });
}

const observer = new MutationObserver(() => {
  if (document.querySelector(".notesContainer").children.length === 0) {
    console.log("Tutte le note sono state eliminate");
    document.querySelector(".notesContainer").innerHTML =
      "<p>Non hai salvato nessun punto notevole per questo capitolo. Creane uno usando il pulsante in basso a destra con l'icona '+'.</p>";
  }
});

// Configura l'osservatore per rilevare aggiunte e rimozioni di nodi
observer.observe(document.querySelector(".notesContainer"), {
  childList: true,
});

document.querySelector(".refreshNotes").addEventListener("click", () => {
  localStorage.removeItem("userNotes"); // Elimina le note salvate in locale
  loadNotes(); // Ricarica le note (ora il server verrà usato)
});
