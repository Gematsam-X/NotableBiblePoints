const selectedBook = sessionStorage.getItem("selectedBook");
const chapter = sessionStorage.getItem("selectedChapter");
const pageTitle = document.querySelector(".notes-page-title");

const title = `Punti notevoli del capitolo ${chapter} di ${selectedBook}`;

if (pageTitle) {
  pageTitle.textContent = title;
  window.document.title = title + " - NotableBiblePoints";
}

// Funzione per aprire la modale
document.querySelector(".openModal").addEventListener("click", () => {
  document.querySelector(".modal").style.display = "block";
});

// Funzione per chiudere la modale
document.querySelector(".closeModal").addEventListener("click", () => {
  document.querySelector(".modal").style.display = "none";
});

// Funzione per salvare il punto notevole
async function saveNote() {
  const noteTitle = document.querySelector("#noteTitle").value;
  const verseNumber = document.querySelector("#verseNumber").value;
  
  if (!noteTitle || !verseNumber) {
    alert("Compila tutti i campi!");
    return;
  }

  const noteData = {
    book: selectedBook,
    chapter: chapter,
    title: noteTitle,
    verse: verseNumber
  };

  Backendless.Data.of("NotableBiblePoints").save(noteData)
  .then(() => {
    alert("Nota salvata con successo!");
    document.querySelector(".modal").style.display = "none";
  })
  .catch(error => {
    console.error("Errore:", error);
    alert("Errore nel salvataggio.");
  });
}

// Assegna l'evento al bottone di salvataggio
document.querySelector("#saveNote").addEventListener("click", saveNote);
