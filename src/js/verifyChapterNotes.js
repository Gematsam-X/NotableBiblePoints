function verifyChapterNotes() {
  let userNotes = [];

  try {
    // Recupera i dati da localStorage
    const storedData = localStorage.getItem("userNotes");

    // Controlla che i dati non siano nulli e siano in formato JSON valido
    if (storedData) {
      const parsedData = JSON.parse(storedData);

      // Verifica che parsedData sia un array e abbia almeno un elemento
      if (
        Array.isArray(parsedData) &&
        parsedData.length > 0 &&
        parsedData[0].NotablePoints
      ) {
        userNotes = parsedData[0].NotablePoints;
      } else {
        console.warn("Dati in formato errato, ripristino array vuoto.");
      }
    }
  } catch (error) {
    console.error("Errore nel parsing di userNotes:", error);
    return; // Evitiamo di eseguire il resto della funzione se i dati sono corrotti
  }

  if (userNotes.length === 0) {
    console.warn("Nessuna nota trovata.");
    return;
  }

  const userEmail = localStorage.getItem("userEmail");

  for (const note of userNotes) {
    if (
      note.owner === userEmail &&
      note.book === sessionStorage.getItem("selectedBook")
    ) {
      const chapter = note.chapter;
      document.querySelectorAll(".chapter").forEach((ch) => {
        if (ch.textContent == chapter) {
          ch.classList.add("hasNotes");
        }
      });
    }
  }
}

window.addEventListener("load", verifyChapterNotes);
