import toast from "./toast.js";

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

function checkBibleBook() {
  const originalInput = document.getElementById("search-input").value.trim();
  if (!originalInput) {
    toast(
      "Inserisci un riferimento biblico valido (es. Genesi 1:1 o Genesi 1 1)."
    );
    return;
  }

  const parts = originalInput.split(/[\s:]+/); // Dividi su spazio o ":"
  const bookInput = parts[0].trim(); // Libro
  const chapterInput = parts[1]?.trim(); // Capitolo (se presente)

  // Normalizzazione dell'input
  const sanitizedInput = bookInput.toLowerCase().replace(/\s+/g, "");
  const matches = bibleBooks.filter((book) =>
    book.toLowerCase().replace(/\s+/g, "").startsWith(sanitizedInput)
  );

  if (sanitizedInput === "") {
    toast(
      "Digita il libro biblico ed eventualmente il capitolo nel campo in basso a destra."
    );
    return;
  }

  if (matches.length === 1 || sanitizedInput === "salmo") {
    const bookName = sanitizedInput === "salmo" ? "Salmi" : matches[0];

    // Salvataggio del nome del libro nel sessionStorage
    sessionStorage.setItem("selectedBook", bookName);

    // Salvataggio del numero del libro nel sessionStorage (per riferimento futuro)
    const bookIndex = bibleBooks.indexOf(bookName);
    sessionStorage.setItem("selectedBook", bibleBooks[bookIndex]);

    // Se c'è il capitolo, reindirizza a notes.html
    if (chapterInput && !isNaN(chapterInput)) {
      sessionStorage.setItem("selectedChapter", parseInt(chapterInput));
      window.location.href = "notes.html";
    } else {
      // Se solo il libro, reindirizza a chapters.html
      window.location.href = "chapters.html";
    }
  } else if (matches.length > 1) {
    toast(
      `Il testo fornito non è univoco. Forse intendevi: ${matches.join(" - ")}`
    );
  } else {
    toast(
      "Il libro non è stato trovato. Verifica di aver scritto correttamente il nome."
    );
  }
}

// Event listener per il bottone "Cerca"
document
  .getElementById("search-button")
  .addEventListener("click", checkBibleBook);

// Permette la ricerca premendo "Invio"
document.addEventListener("keypress", (event) => {
  if (
    event.key === "Enter" &&
    document.activeElement === document.getElementById("search-input")
  ) {
    checkBibleBook();
  }
});
