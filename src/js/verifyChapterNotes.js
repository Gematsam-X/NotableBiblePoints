import backendlessRequest from "./backendlessRequest.js";
import { getValue, setValue } from "/src/js/indexedDButils.js";

async function verifyChapterNotes() {
  let userNotes = [];

  try {
    // Decripto l’email utente
    const userEmail = localStorage.getItem("userEmail");

    // Provo a prendere i dati da IndexedDB
    let data = await getValue("userNotes");

    if (!data || !Array.isArray(data) || data.length === 0) {
      // Se IndexedDB è vuoto o invalido, prendo dal backend
      const records = await backendlessRequest(
        "notes:get",
        {
          email: userEmail,
        },
        localStorage.getItem("userToken")
      );

      const firstRecord = Array.isArray(records) ? records : null;

      // Estraggo le note oppure array vuoto
      data = firstRecord || [];

      // Salvo i dati puliti in IndexedDB
      await setValue("userNotes", data);
    }

    if (data && Array.isArray(data) && data.length > 0) {
      userNotes = data;
    } else {
      console.warn("Dati in formato errato o nessuna nota trovata.");
      return;
    }

    const selectedBook = sessionStorage.getItem("selectedBook");

    if (!selectedBook) {
      console.warn("Libro selezionato mancante.");
      return;
    }

    for (const note of userNotes) {
      if (note.book === selectedBook && note.chapter != null) {
        const chapter = String(note.chapter).trim();

        document.querySelectorAll(".chapter").forEach((ch) => {
          if (ch.textContent.trim() === chapter) {
            ch.classList.add("hasNotes");
          }
        });
      }
    }
  } catch (error) {
    console.error("Errore nel recupero dati:", error);
  }
}

window.addEventListener("load", verifyChapterNotes);
