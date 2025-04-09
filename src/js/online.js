import { getValue, deleteValue, setValue } from "./indexedDButils.js";

async function syncWithServer() {
  if (!navigator.onLine) return;

  try {
    const userNotes = (await getValue("userNotes")) || [];
    const deletedNotes = (await getValue("deletedNotes")) || [];

    if (userNotes.length === 0 && deletedNotes.length === 0) {
      console.log("Nessuna nota da sincronizzare.");
      return;
    }

    let serverRecord;
    try {
      serverRecord = await Backendless.Data.of(
        "NotableBiblePoints"
      ).findFirst();
    } catch (error) {
      console.error("Errore nel recupero del record dal server:", error);
      return;
    }

    if (!serverRecord || !serverRecord.NotablePoints) {
      console.log("Nessun record o punti notevoli trovati nel database.");
      return;
    }

    const serverNotes = serverRecord.NotablePoints;

    // STEP 1: Rimuovi le note eliminate
    let updatedNotes = serverNotes.filter(
      (note) => !deletedNotes.some((deleted) => deleted.id === note.id)
    );

    // STEP 2: Trova note solo locali (non esistono nel server)
    const newNotes = userNotes.filter(
      (localNote) =>
        !serverNotes.some((serverNote) => serverNote.id === localNote.id)
    );

    updatedNotes.push(...newNotes);

    // STEP 3: Confronta ogni nota condivisa
    updatedNotes = updatedNotes.map((note) => {
      const localNote = userNotes.find((n) => n.id === note.id);
      const serverNote = serverNotes.find((n) => n.id === note.id);

      if (!localNote || !serverNote) return note;

      const localHasTime = localNote.updatedAt !== undefined;
      const serverHasTime = serverNote.updatedAt !== undefined;

      // Nessuna delle due è mai stata modificata
      if (!localHasTime && !serverHasTime) return serverNote;

      // Solo la locale è stata modificata
      if (localHasTime && !serverHasTime) return localNote;

      // Solo la server è stata modificata
      if (!localHasTime && serverHasTime) return serverNote;

      // Entrambe modificate → prendi la più recente
      return localNote.updatedAt > serverNote.updatedAt
        ? localNote
        : serverNote;
    });

    // STEP 4: Salva nel server
    serverRecord.NotablePoints = updatedNotes;
    await Backendless.Data.of("NotableBiblePoints").save(serverRecord);

    // STEP 5: Aggiorna il locale
    await deleteValue("deletedNotes");
    await setValue("userNotes", updatedNotes);

    console.log("Sincronizzazione completata con successo!");
  } catch (error) {
    console.error("Errore durante la sincronizzazione:", error);
    toast("Errore nella sincronizzazione. Riprova più tardi.");
  }
}

// Aggiungi un event listener per rilevare quando l'app torna online
window.addEventListener("online", () => {
  console.log("Connessione ripristinata. Sincronizzo i dati...");
  window.setTimeout(syncWithServer, 3000);
});
