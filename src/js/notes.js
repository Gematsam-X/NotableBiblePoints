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

    // Se ci sono note, le visualizza
    if (notes.length > 0) {
      notes.forEach((note) => {
        let parsedNote = note.NotablePoints;

        // Se c'è un errore nella nota (ad esempio, se non è valida)
        if (!parsedNote) {
          console.error("Nota non valida:", note);
          parsedNote = {}; // Imposta un oggetto vuoto in caso di errore
        }

        // Verifica che la nota corrisponda al capitolo e libro selezionati
        if (
          parsedNote.book === selectedBook &&
          parsedNote.chapter === chapter
        ) {
          // Recupera le informazioni dalla nota
          const verse = parsedNote.verse;
          const title = parsedNote.title;
          const content = parsedNote.content;

          // Crea un elemento HTML per la nota
          const noteElement = document.createElement("div");
          noteElement.classList.add("note");
          noteElement.innerHTML = `
            <h2>Versetto ${verse}</h2>
            <h3><u>${title}</u></h3>
            <p>${content}</p>
          `;

          notesContainer.appendChild(noteElement); // Aggiungi la nota al contenitore
        }
      });
    } else {
      // Se non ci sono note, mostra un messaggio di avviso
      notesContainer.innerHTML =
        "<p>Nessuna nota disponibile per questo capitolo.</p>";
    }
  } catch (error) {
    // Gestione degli errori
    console.error("Errore nel recupero delle note:", error);
    alert(error.message);
    notesContainer.innerHTML =
      "<p>Errore nel caricamento delle note. Riprova più tardi.</p>";
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
    const currentUser = await Backendless.UserService.getCurrentUser();
    const userEmail = currentUser.email;

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
    loadNotes(); // Aggiorna la lista delle note
  } catch (error) {
    console.error("Errore durante il salvataggio:", error);
    alert(
      "Errore durante il salvataggio del punto notevole. Riprova più tardi."
    );
  }
}

// Assegna l'evento al bottone di salvataggio
document.querySelector("#saveNote").addEventListener("click", saveNote);
