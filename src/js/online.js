import { getValue, deleteValue, setValue } from "./indexedDButils.js";
import toast from "./toast.js";
import isOnline from "./isOnline.js";

const refreshBtn = document.querySelector(".refreshNotes");

// Funzione principale per sincronizzare i dati con il server
async function syncWithServer() {
  // Controlla se siamo online prima di tentare la sincronizzazione

  try {
    // Recupera le note utente e le note eliminate dal local storage
    const userNotes = (await getValue("userNotes")) || [];
    const deletedNotes = (await getValue("deletedNotes")) || [];

    // Se non ci sono note da sincronizzare, termina la funzione
    if (userNotes.length === 0 && deletedNotes.length === 0) {
      console.log("Nessuna nota da sincronizzare.");
      toast("Sincronizzazione completata!", 2000);
      return true; // Restituisce true quando la sincronizzazione è completata
    }

    // Recupera il record dal server
    let serverRecord;
    try {
      serverRecord = await Backendless.Data.of(
        "NotableBiblePoints"
      ).findFirst();
    } catch (error) {
      console.error("Errore nel recupero del record dal server:", error);
      toast(
        `Errore nel recupero delle tue note dal cloud, continueremo a provare. Non chiudere o ricaricare l'app. Dettagli: ${error}`,
        4500
      );
      window.setTimeout(syncWithServer, 3000); // Riprova la sincronizzazione
      return false; // Restituisce false in caso di errore
    }

    if (!serverRecord || !serverRecord.NotablePoints) {
      console.log("Nessun record o punti notevoli trovati nel database.");
      toast(
        "Errore: database non trovato. Non riproveremo. Rivolgiti allo sviluppatore se il problema persiste.",
        3500
      );
      throw new Error(
        "Nessun record trovato nel database, o campo NotablePoints inesistente."
      );
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
      const serverNote = serverNotes.find(
        (n) => n.id === note.id && n.owner === note.owner
      );

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
    toast("Sincronizzazione completata!", 2000);
    return true;
  } catch (error) {
    console.error("Errore durante la sincronizzazione:", error);
    window.setTimeout(syncWithServer, 1500); // Riprova la sincronizzazione
  }
}

// Funzione che fa il controllo continuo di stato online/offline
function monitorOnlineAndSync() {
  let wasOnline = false; // stato precedente

  setInterval(async () => {
    const currentlyOnline = await isOnline();

    // Se eravamo offline e ora siamo online -> partiamo con la sincronizzazione
    if (!wasOnline && currentlyOnline) {
      console.log("Connessione ripristinata. Sincronizzo i dati...");
      toast(
        "Sincronizzazione in corso. Non chiudere o ricaricare l'app.",
        2000
      );
      sessionStorage.setItem("canRefresh", "false");

      if (!refreshBtn.classList.contains("disabled")) {
        refreshBtn.classList.add("disabled");
      }

      // Aspettiamo la sincronizzazione con il server
      const syncSuccess = await syncWithServer();

      if (syncSuccess) {
        sessionStorage.setItem("canRefresh", "true");
        refreshBtn.classList.remove("disabled");
        console.log("Sincronizzazione completata con successo!");
      } else {
        console.log("Sincronizzazione fallita, riprovo al prossimo ciclo.");
      }
    }

    // Aggiorna lo stato per il prossimo controllo
    wasOnline = currentlyOnline;
  }, 3000); // ogni 3 secondi
}

// Avvia il monitoraggio
monitorOnlineAndSync();
