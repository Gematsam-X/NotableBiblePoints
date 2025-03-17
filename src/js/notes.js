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

// Funzione per aprire la modale
document.querySelector(".openModal").addEventListener("click", () => {
  document.querySelector(".modal").style.display = "block";
});

// Funzione per chiudere la modale
document.querySelector(".closeModal").addEventListener("click", () => {
  document.querySelector(".modal").style.display = "none";
});

// Funzione per caricare le note dal database
async function loadNotes() {
  const notesContainer = document.querySelector(".notesContainer");
  if (!notesContainer) return;

  // Inizialmente mostra un messaggio di caricamento
  notesContainer.innerHTML = "<p>Caricamento in corso...</p>";

  try {
    const userEmail = localStorage.getItem("userEmail");

    // Recupera tutte le note dell'autore (email dell'utente) dal database
    const userNotes = await Backendless.Data.of("NotableBiblePoints").find({
      condition: `owner = '${userEmail}'`, // Usa il campo "owner" per la ricerca
    });

    console.log("Note di", userEmail);

    notesContainer.innerHTML = ""; // Svuota il contenitore
    let notesFound = false;

    // Se ci sono note, le visualizza
    if (Array.isArray(userNotes) && userNotes.length > 0) {
      userNotes.forEach((noteObj) => {
        if (noteObj.NotablePoints && Array.isArray(noteObj.NotablePoints)) {
          noteObj.NotablePoints.forEach((note) => {
            // Verifica che la nota corrisponda al capitolo e libro selezionati
            if (
              note.book === selectedBook &&
              note.chapter === chapter &&
              note.owner == userEmail
            ) {
              notesFound = true;

              // Recupera le informazioni dalla nota
              const { verse, title = "", content, id: noteId } = note;

              // Crea un elemento HTML per la nota e aggiungi l'ID come attributo
              const noteElement = document.createElement("div");
              noteElement.classList.add("note");
              noteElement.setAttribute("data-id", noteId);

              // Cambia le immagini in base al tema
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
            }
          });
        }
      });
    }

    // Se non sono state trovate note per questo capitolo
    if (!notesFound) {
      notesContainer.innerHTML =
        "<p>Non hai salvato nessun punto notevole per questo capitolo. Creane uno usando il pulsante in basso a destra con l'icona '+'.</p>";
    }
  } catch (error) {
    // Gestione degli errori
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

// Funzione per salvare un nuovo punto notevole
async function saveNote() {
  const noteTitle = document.querySelector("#noteTitle").value.trim();
  const verseNumber = parseInt(document.querySelector("#verseNumber").value);
  const noteContent = document.querySelector("#noteContent").value.trim();

  // Controllo di validità dei campi
  if (isNaN(verseNumber) || !noteContent) {
    toast(
      "Inserisci il numero del versetto e il contenuto della nota per continuare.",
      2300
    );
    return;
  }

  console.log(verseNumber, noteContent);

  showGif();

  try {
    const userEmail = localStorage.getItem("userEmail");

    if (!userEmail) {
      console.error("Nessuna email trovata in localStorage.");
      return;
    }

    // Cerca nel database un record dell'utente
    let userNotesArray = await Backendless.Data.of("NotableBiblePoints").find({
      condition: `owner = '${userEmail}'`, // Usa il campo "owner" per identificare l'utente
    });

    let userNotes;

    if (userNotesArray.length > 0) {
      userNotes = userNotesArray[0]; // Usa il record esistente
    } else {
      // Nessun record trovato → Creiamo un nuovo record per l'utente
      userNotes = {
        owner: userEmail,
        NotablePoints: [], // Inizializza un array vuoto
      };

      // Salva il nuovo record nel database e ottieni l'ID
      userNotes = await Backendless.Data.of("NotableBiblePoints").save(
        userNotes
      );
    }

    // Assicurati che NotablePoints sia un array
    if (!Array.isArray(userNotes.NotablePoints)) {
      userNotes.NotablePoints = [];
    }

    // Crea la nuova nota
    const newNote = {
      id: Date.now().toString(),
      ...(noteTitle && { title: noteTitle }), // Aggiunge "title" solo se noteTitle esiste
      verse: verseNumber,
      content: noteContent,
      chapter: chapter,
      book: selectedBook,
      owner: userEmail, // Associa l'email dell'utente come autore
    };

    // Aggiunge la nuova nota e salva
    userNotes.NotablePoints.push(newNote);

    // Salva le modifiche nel database
    await Backendless.Data.of("NotableBiblePoints").save(userNotes);

    toast("Punto notevole salvato con successo.");
    document.querySelector(".modal").style.display = "none";
    loadNotes();
  } catch (error) {
    console.error("Errore durante il salvataggio:", error);
    toast(
      "Errore durante il salvataggio del punto notevole. Riprova più tardi."
    );
  } finally {
    hideGif();
  }
}

// Assegna l'evento al bottone di salvataggio
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

// Funzione per modificare una nota
async function editNote(noteElement) {
  document.exitFullscreen();
  const noteId = noteElement.getAttribute("data-id");
  const noteTitle = noteElement.querySelector(".note-title").textContent;
  const noteContent = noteElement.querySelector(".note-body h3").textContent;
  const verseNumber = noteElement
    .querySelector(".verse-number h4")
    .textContent.replace("Versetto ", "")
    .trim();

  if (!document.querySelector("#noteTitle").matches(":focus")) {
    document.querySelector("#noteTitle").value = noteTitle;
  }
  if (!document.querySelector("#verseNumber").matches(":focus")) {
    document.querySelector("#verseNumber").value = verseNumber;
  }
  if (!document.querySelector("#noteContent").matches(":focus")) {
    document.querySelector("#noteContent").value = noteContent;
  }

  // Mostra la modale
  document.querySelector(".modal").style.display = "block";

  // Risoluzione del problema: rimuovere gli event listener precedenti
  const oldSaveButton = document.querySelector("#saveNote");
  const newSaveButton = oldSaveButton.cloneNode(true);
  oldSaveButton.parentNode.replaceChild(newSaveButton, oldSaveButton);

  // Aggiungi il nuovo event listener
  newSaveButton.addEventListener("click", async () => {
    const updatedTitle =
      document.querySelector("#noteTitle").value.trim() || " ";
    const updatedVerse = parseInt(document.querySelector("#verseNumber").value);
    const updatedContent = document.querySelector("#noteContent").value.trim();

    // Controllo di validità dei campi
    if (isNaN(updatedVerse) || !updatedContent) {
      toast("Compila tutti i campi correttamente!");
      return;
    }

    showGif();

    try {
      const userEmail = localStorage.getItem("userEmail");
      // Carica tutte le note dell'utente
      let userNotes = await Backendless.Data.of("NotableBiblePoints").findFirst(
        {
          condition: `email = '${userEmail}'`,
        }
      );

      if (!userNotes) {
        toast("Errore: impossibile trovare le note dell'utente.");
        return;
      }

      let notes = [];
      if (userNotes.NotablePoints) {
        notes = userNotes.NotablePoints;
      }

      const noteIndex = notes.findIndex((note) => note.id === noteId);

      if (noteIndex === -1) {
        toast("Errore: impossibile trovare la nota da modificare.");
        return;
      }

      notes[noteIndex] = {
        ...notes[noteIndex],
        ...(updatedTitle && { title: updatedTitle }),
        verse: updatedVerse,
        content: updatedContent,
      };

      userNotes.NotablePoints = JSON.stringify(notes);

      await Backendless.Data.of("NotableBiblePoints").save(userNotes);
      toast("Nota modificata con successo.");
      document.querySelector(".modal").style.display = "none";
      loadNotes(); // Aggiorna la lista delle note
    } catch (error) {
      console.error("Errore durante la modifica:", error);
      toast("Errore durante la modifica della nota. Riprova più tardi.");
    } finally {
      document.querySelector("#noteContent").value = "";
      document.querySelector("#noteTitle").value = "";
      document.querySelector("#verseNumber").value = "";
      hideGif();
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

document.querySelector(".refreshNotes").addEventListener("click", loadNotes);
