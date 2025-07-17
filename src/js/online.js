import backendlessRequest from "./backendlessRequest.js";
import { deleteValue, getValue, setValue } from "/src/js/indexedDButils.js";
import toast from "/src/js/toast.js";

const refreshBtn = document.querySelector(".refreshNotes");

let isSyncing = false;
let syncRetries = 0;
const maxRetries = 3;

/**
 * Sincronizza le note locali con il server Backendless.
 * Gestisce conflitti, note eliminate e aggiunte.
 * Limita i retry e impedisce chiamate sovrapposte.
 */
async function syncWithServer() {
  if (!navigator.onLine) {
    console.log("Offline: sync non eseguita");
    return false;
  }

  if (isSyncing) {
    console.log("Sync già in corso, salto la chiamata.");
    return false;
  }

  if (syncRetries >= maxRetries) {
    console.warn("Raggiunto limite massimo di tentativi di sincronizzazione.");
    toast("Impossibile sincronizzare, riprova più tardi.", 3000);
    return false;
  }

  isSyncing = true;
  syncRetries++;

  try {
    const userEmail = localStorage.getItem("userEmail");
    const userToken = localStorage.getItem("userToken");

    if (!userEmail || !userToken) {
      throw new Error("Utente non autenticato correttamente.");
    }

    const userNotes = (await getValue("userNotes")) || [];
    const locallyDeletedNotes = (await getValue("deletedNotes")) || [];

    if (userNotes.length === 0 && locallyDeletedNotes.length === 0) {
      console.log("Nessuna nota da sincronizzare.");
      toast("Sincronizzazione completata!", 2000);
      syncRetries = 0;
      return true;
    }

    // Recupera record dal server
    let serverRecord;
    try {
      serverRecord = await backendlessRequest(
        "notes:get",
        { email: userEmail },
        userToken
      );
    } catch (error) {
      console.error("Errore nel recupero del record dal server:", error);
      toast(
        `Errore nel recupero delle tue note dal cloud, continueremo a provare. Non chiudere o ricaricare l'app. Dettagli: ${error}`,
        4500
      );
      setTimeout(() => {
        if (syncRetries < maxRetries) syncWithServer();
      }, 3000);
      return false;
    }

    if (!serverRecord || !Array.isArray(serverRecord)) {
      toast(
        "Errore: record del database non valido. Contatta lo sviluppatore.",
        3000
      );
      throw new Error("Record del server non valido.");
    }

    // --- PREPARA ARRAY DI ID DA ELIMINARE (da inviare a notes:delete)
    const idsToDelete = locallyDeletedNotes.map((note) => note.id);

    // --- UNISCI NOTE LOCALI E SERVER, RISOLVI CONFLITTI UPDATEDAT
    const allNotes = [...userNotes, ...serverRecord];
    const mergedNotesMap = new Map();

    for (const note of allNotes) {
      const existing = mergedNotesMap.get(note.id);
      const currentUpdatedAt = parseInt(note.updatedAt ?? "0", 10);

      if (!existing) {
        mergedNotesMap.set(note.id, note);
      } else {
        const existingUpdatedAt = parseInt(existing.updatedAt ?? "0", 10);
        if (currentUpdatedAt > existingUpdatedAt) {
          mergedNotesMap.set(note.id, note);
        }
      }
    }

    // --- RIMUOVI LE NOTE ELIMINATE DALLA MAPPA
    for (const id of idsToDelete) {
      mergedNotesMap.delete(id);
    }

    // --- ARRAY FINALE DI NOTE DA AGGIORNARE/INSERIRE
    const notesToSave = Array.from(mergedNotesMap.values());

    // --- ESEGUI LA CHIAMATA DI DELETE SE CI SONO NOTE DA ELIMINARE
    if (idsToDelete.length > 0)
      await backendlessRequest(
        "notes:delete",
        {
          email: userEmail,
          ids: idsToDelete, // array di stringhe ID
        },
        userToken
      );

    // --- ESEGUI LA CHIAMATA DI ADD OR UPDATE SE CI SONO NOTE DA SALVARE
    if (notesToSave.length > 0)
      await backendlessRequest(
        "notes:addOrUpdate",
        {
          email: userEmail,
          note: notesToSave, // array di note
        },
        userToken
      );

    // --- AGGIORNA DATI LOCALI DOPO LA SINCRONIZZAZIONE
    await deleteValue("deletedNotes");
    await setValue("userNotes", notesToSave);

    toast("Sincronizzazione completata!", 2000);
    console.log("Sincronizzazione completata con successo!");

    syncRetries = 0;
    return true;
  } catch (err) {
    console.error("Errore durante la sincronizzazione:", err);
    if (syncRetries < maxRetries) {
      setTimeout(syncWithServer, 1500);
    } else {
      toast(
        "Errore persistente nella sincronizzazione. Riprova più tardi.",
        3000
      );
    }
    return false;
  } finally {
    isSyncing = false;
  }
}

// Quando torna online, avvia sync periodica e blocca bottone fino a fine sync
window.addEventListener("online", () => {
  console.log("Connessione ripristinata. Sincronizzo i dati...");
  toast("Sincronizzazione in corso. Non chiudere o ricaricare l'app.", 2000);

  sessionStorage.setItem("canRefresh", "false");
  if (!refreshBtn?.classList.contains("disabled"))
    refreshBtn?.classList.add("disabled");

  const syncInterval = window.setInterval(async () => {
    let syncSuccess;

    if (syncRetries < maxRetries) syncSuccess = await syncWithServer();
    else {
      clearInterval(syncInterval);
      return;
    }

    if (syncSuccess) {
      sessionStorage.setItem("canRefresh", "true");
      refreshBtn?.classList.remove("disabled");
      clearInterval(syncInterval);
    }
  }, 3000);
});
