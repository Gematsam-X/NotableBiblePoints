import toast from "./toast.js";

const selectedBook = sessionStorage.getItem("selectedBook");
const bookTitle = document.getElementById("book-title");
const chaptersContainer = document.getElementById("chapters-container");

if (bookTitle) {
  const title = `Capitoli di ${selectedBook}`;
  bookTitle.textContent = title;
  window.document.title = title + " - NotableBiblePoints";
}

const chaptersByBook = {
  Genesi: 50,
  Esodo: 40,
  Levitico: 27,
  Numeri: 36,
  Deuteronomio: 34,
  Giosuè: 24,
  Giudici: 21,
  Rut: 4,
  "1 Samuele": 31,
  "2 Samuele": 24,
  "1 Re": 22,
  "2 Re": 25,
  "1 Cronache": 29,
  "2 Cronache": 36,
  Esdra: 10,
  Neemia: 13,
  Ester: 10,
  Giobbe: 42,
  Salmi: 150,
  Proverbi: 31,
  Ecclesiaste: 12,
  "Cantico dei Cantici": 8,
  Isaia: 66,
  Geremia: 52,
  Lamentazioni: 5,
  Ezechiele: 48,
  Daniele: 12,
  Osea: 14,
  Gioele: 3,
  Amos: 9,
  Abdia: 1,
  Giona: 4,
  Michea: 7,
  Naum: 3,
  Abacuc: 3,
  Sofonia: 3,
  Aggeo: 2,
  Zaccaria: 14,
  Malachia: 4,
  Matteo: 28,
  Marco: 16,
  Luca: 24,
  Giovanni: 21,
  Atti: 28,
  Romani: 16,
  "1 Corinti": 16,
  "2 Corinti": 13,
  Galati: 6,
  Efesini: 6,
  Filippesi: 4,
  Colossesi: 4,
  "1 Tessalonicesi": 5,
  "2 Tessalonicesi": 3,
  "1 Timoteo": 6,
  "2 Timoteo": 4,
  Tito: 3,
  Filemone: 1,
  Ebrei: 13,
  Giacomo: 5,
  "1 Pietro": 5,
  "2 Pietro": 3,
  "1 Giovanni": 5,
  "2 Giovanni": 1,
  "3 Giovanni": 1,
  Giuda: 1,
  Rivelazione: 22,
};

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

const chaptersNum = chaptersByBook[selectedBook]; // Default 1 se non trovato

// Funzione per creare i quadrati dei capitoli
function createSquares(num) {
  for (let i = 1; i <= num; i++) {
    const square = document.createElement("div");
    square.classList.add("chapter");
    square.textContent = i;
    square.addEventListener("click", () => {
      sessionStorage.setItem("selectedChapter", i);
      window.location.href = "notes.html";
    });
    if (chaptersContainer) chaptersContainer.appendChild(square);
  }
}

createSquares(chaptersNum);

const link = document.querySelector("#readBook") || null;

// Aggiunge un listener per il click
link?.addEventListener("click", () => {
  // Ottieni il libro selezionato
  const selectedBook = sessionStorage.getItem("selectedBook");

  // Cerca l'indice del libro selezionato nell'array bibleBooks
  const bookIndex = bibleBooks.indexOf(selectedBook);

  if (bookIndex !== -1) {
    const bookCode = (bookIndex + 1).toString().padStart(2, "0");

    // Costruisce l'URL con il riferimento completo
    link.href = `https://www.jw.org/finder?wtlocale=I&prefer=lang&book=${bookCode}&pub=nwtsty`;
  } else {
    // Se il libro non è trovato, puoi gestire l'errore
    console.error("Libro non trovato!");
    toast(
      "C'è stato un errore nel reindirizzamento. Si prega di riprovare più tardi."
    );
  }
});
