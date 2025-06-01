import { Network } from "@capacitor/network"; // Plugin Network di Capacitor
import { deleteValue, getValue, setValue } from "./indexedDButils.js";
import toast from "./toast.js";

const refreshBtn = document.querySelector(".refreshNotes");

// Variabile per tenere traccia dello stato offline precedente
let wasOffline = false;

// Funzione principale per sincronizzare i dati con il server
async function syncWithServer() {
  if (!navigator.onLine) return false;

  try {
    const userNotes = (await getValue("userNotes")) || [];
    const deletedNotes = (await getValue("deletedNotes")) || [];

    if (userNotes.length === 0 && deletedNotes.length === 0) {
      console.log("Nessuna nota da sincronizzare.");
      toast("Sincronizzazione completata!", 2000);
      return true;
    }

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
      window.setTimeout(syncWithServer, 3000);
      return false;
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

    // STEP 2: Aggiungi le nuove note locali
    const newNotes = userNotes.filter(
      (localNote) =>
        !serverNotes.some((serverNote) => serverNote.id === localNote.id)
    );
    updatedNotes.push(...newNotes);

    // STEP 3: Confronta le note con lo stesso ID
    updatedNotes = updatedNotes.map((note) => {
      const localNote = userNotes.find((n) => n.id === note.id);
      const serverNote = serverNotes.find(
        (n) => n.id === note.id && n.owner === note.owner
      );

      if (!localNote || !serverNote) return note;

      const localHasTime = localNote.updatedAt !== undefined;
      const serverHasTime = serverNote.updatedAt !== undefined;

      if (!localHasTime && !serverHasTime) return serverNote;
      if (localHasTime && !serverHasTime) return localNote;
      if (!localHasTime && serverHasTime) return serverNote;

      return localNote.updatedAt > serverNote.updatedAt
        ? localNote
        : serverNote;
    });

    // STEP 4: Salva sul server
    serverRecord.NotablePoints = updatedNotes;
    await Backendless.Data.of("NotableBiblePoints").save(serverRecord);

    // STEP 5: Aggiorna localmente
    await deleteValue("deletedNotes");
    await setValue("userNotes", updatedNotes);

    console.log("Sincronizzazione completata con successo!");
    toast("Sincronizzazione completata!", 2000);
    return true;
  } catch (error) {
    console.error("Errore durante la sincronizzazione:", error);
    window.setTimeout(syncWithServer, 1500);
  }
}

/**
 * Funzione per gestire il ritorno online con Capacitor Network plugin.
 */
function setupCapacitorOnlineListener() {
  // Inizializza lo stato offline all'avvio
  Network.getStatus().then((status) => {
    wasOffline = !status.connected;
  });

  Network.addListener("networkStatusChange", (status) => {
    const isNowOnline = status.connected;

    // Se ERI offline e ORA sei online -> esegui sincronizzazione
    if (wasOffline && isNowOnline) {
      triggerSyncProcess();
    }

    // Aggiorna lo stato per la prossima volta
    wasOffline = !isNowOnline;
  });
}

/**
 * Gestisce il processo di sincronizzazione con feedback UI.
 */
function triggerSyncProcess() {
  console.log("Connessione ripristinata. Sincronizzo i dati...");
  toast("Sincronizzazione in corso. Non chiudere o ricaricare l'app.", 2000);
  sessionStorage.setItem("canRefresh", "false");

  if (!refreshBtn?.classList.contains("disabled")) {
    refreshBtn.classList.add("disabled");
  }

  const syncInterval = setInterval(async () => {
    const syncSuccess = await syncWithServer();

    if (syncSuccess) {
      sessionStorage.setItem("canRefresh", "true");
      refreshBtn.classList.remove("disabled");
      clearInterval(syncInterval);
    }
  }, 3000);
}

// Attiva listener online/offline con Capacitor
setupCapacitorOnlineListener();
