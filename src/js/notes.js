import { isDarkTheme } from "./isDarkTheme.js";

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
    // Recupera l'utente corrente
    const currentUser = await Backendless.UserService.getCurrentUser();
    const userEmail = currentUser.email;

    // Carica le note associate all'utente per il libro e capitolo selezionato
    const notes = await Backendless.Data.of("NotableBiblePoints").find({
      condition: `NotablePoints LIKE '%${userEmail}%'`,
    });

    notesContainer.innerHTML = ""; // Svuota il contenitore
    let notesFound = false;

    // Se ci sono note, le visualizza
    if (notes.length > 0) {
      notes.forEach((note) => {
        let parsedNote = note.NotablePoints;

        // Verifica che la nota corrisponda al capitolo e libro selezionati
        if (
          parsedNote &&
          parsedNote.book === selectedBook &&
          parsedNote.chapter === chapter
        ) {
          notesFound = true;

          // Recupera le informazioni dalla nota
          const verse = parsedNote.verse;
          const title = parsedNote.title;
          const content = parsedNote.content;
          const noteId = note.objectId; // Recupera l'ID della nota

          // Crea un elemento HTML per la nota e aggiungi l'ID come attributo
          const noteElement = document.createElement("div");
          noteElement.classList.add("note");
          noteElement.setAttribute("data-id", noteId); // Aggiungi l'ID della nota al div

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

          notesContainer.appendChild(noteElement); // Aggiungi la nota al contenitore
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
    alert(error.message);
    notesContainer.innerHTML = `<p>Errore nel caricamento delle note. Riprova più tardi. Dettagli dell'errore: ${error.message}</p>`;
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
  if (!noteTitle || isNaN(verseNumber) || !noteContent) {
    alert("Compila tutti i campi correttamente!");
    return;
  }

  try {
    const userEmail = localStorage.getItem("userEmail");

    const noteData = {
      NotablePoints: JSON.stringify({
        title: noteTitle,
        verse: verseNumber,
        content: noteContent,
        chapter: chapter,
        book: selectedBook,
        author: userEmail,
      }),
    };

    await Backendless.Data.of("NotableBiblePoints").save(noteData);
    alert("Punto notevole salvato con successo.");
    document.querySelector(".modal").style.display = "none";

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

    // Aggiorna le immagini delle note esistenti
    document.querySelectorAll(".note").forEach((noteElement) => {
      const deleteImg = noteElement.querySelector(".deleteNote_img");
      const editImg = noteElement.querySelector(".edit_img");
      const shareImg = noteElement.querySelector(".share_img");

      deleteImg.src = deleteImageSrc;
      console.log("isDarkTheme?", isDarkTheme, deleteImg.src);
      editImg.src = editImageSrc;
      console.log(editImg.src);
      shareImg.src = shareImageSrc;
      console.log(shareImg.src);
    });
    loadNotes();
  } catch (error) {
    console.error("Errore durante il salvataggio:", error);
    alert(
      "Errore durante il salvataggio del punto notevole. Riprova più tardi."
    );
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

async function deleteNote(noteElement) {
  if (!confirm("Sei sicuro di voler eliminare questa nota?")) return;

  try {
    const noteId = noteElement.getAttribute("data-id"); // Prendi l'ID della nota

    if (!noteId) {
      alert("Errore: impossibile trovare l'ID della nota.");
      return;
    }

    await Backendless.Data.of("NotableBiblePoints").remove(noteId);

    noteElement.remove(); // Rimuove la nota dal DOM
    alert("Nota eliminata con successo!");
  } catch (error) {
    console.error("Errore durante l'eliminazione:", error);
    alert("Errore durante l'eliminazione della nota. Riprova più tardi.");
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

  alert("Il testo della nota è stato copiato negli appunti!");
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
    const updatedTitle = document.querySelector("#noteTitle").value.trim();
    const updatedVerse = parseInt(document.querySelector("#verseNumber").value);
    const updatedContent = document.querySelector("#noteContent").value.trim();

    // Controllo di validità dei campi
    if (!updatedTitle || isNaN(updatedVerse) || !updatedContent) {
      alert("Compila tutti i campi correttamente!");
      return;
    }

    try {
      const currentUser = await Backendless.UserService.getCurrentUser();
      const userEmail = currentUser.email;

      const updatedNoteData = {
        NotablePoints: JSON.stringify({
          title: updatedTitle,
          verse: updatedVerse,
          content: updatedContent,
          chapter: chapter,
          book: selectedBook,
          author: userEmail,
        }),
      };

      await Backendless.Data.of("NotableBiblePoints").save({
        objectId: noteId,
        ...updatedNoteData,
      });

      alert("Nota modificata con successo.");
      document.querySelector(".modal").style.display = "none";
      loadNotes(); // Aggiorna la lista delle note
    } catch (error) {
      console.error("Errore durante la modifica:", error);
      alert("Errore durante la modifica della nota. Riprova più tardi.");
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
