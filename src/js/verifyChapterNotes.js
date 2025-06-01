import Backendless from 'backendless';
import { getValue, setValue } from "./indexedDButils.js";

async function verifyChapterNotes() {
  let userNotes = [];

  try {
    // Recupera i dati da IndexedDB
    let data = await getValue("userNotes");

    if (!data) {
      data = (
        await Backendless.Data.of("NotableBiblePoints").findFirst()
      ).NotablePoints.filter(
        (n) => n.owner === localStorage.getItem("userEmail")
      );
      await setValue("userNotes", data); // Salva i dati in IndexedDB
    }

    if (data) {
      let parsedData = data;

      console.log(parsedData, typeof parsedData);

      // Verifica che i dati siano un array valido
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        userNotes = parsedData; // Usa direttamente l'array
      } else {
        console.warn("Dati in formato errato, ripristino array vuoto.");
      }
    }
  } catch (error) {
    console.error("Errore nel recupero dei dati:", error);
    return; // Evita di proseguire con dati corrotti
  }

  if (userNotes.length === 0) {
    console.warn("Nessuna nota trovata.");
    return;
  }

  const userEmail = localStorage.getItem("userEmail");
  const selectedBook = sessionStorage.getItem("selectedBook");

  if (!userEmail || !selectedBook) {
    console.warn("Dati utente o libro selezionato mancanti.");
    return;
  }

  for (const note of userNotes) {
    if (
      note.owner === userEmail &&
      note.book === selectedBook &&
      note.chapter != null
    ) {
      const chapter = String(note.chapter).trim(); // Assicura che sia stringa

      document.querySelectorAll(".chapter").forEach((ch) => {
        if (ch.textContent.trim() === chapter) {
          ch.classList.add("hasNotes");
        }
      });
    }
  }
}

// Avvia la funzione al caricamento della pagina
window.addEventListener("load", verifyChapterNotes);
