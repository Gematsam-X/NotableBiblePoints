import backendlessRequest from "/src/js/backendlessRequest.js";
import { getValue, setValue } from "/src/js/indexedDButils.js";

async function verifyChapterNotes() {
  let userNotes = [];

  try {
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
    if (error.message.toLowerCase().includes("not existing user token")) {
      toast("Sessione scaduta. Effettua nuovamente il login per continuare.");
      logoutUser();
    } else if (error.message.toLowerCase().includes("429"))
      toast("Si è verificato un errore tecnico. Riprova tra un minuto.");
    else {
      console.error("Errore nel recupero delle note:", error);
      toast(`Errore: ${error.message}`);
    }
    notesContainer.innerHTML = `<p>Errore nel caricamento delle note. Riprova più tardi.<br>Dettagli: ${error.message}</p>`;
    return;
  }
}

window.addEventListener("load", verifyChapterNotes);
