import backendlessRequest from "/src/js/backendlessRequest.js";
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

/**
 * Verifica se sei davvero online controllando il file ping.txt
 * @returns {Promise<boolean>}
 */
async function checkRealInternetConnection() {
  try {
    const response = await fetch(
      "https://gematsam-x.github.io/NotableBiblePoints/ping.txt",
      {
        method: "GET",
        cache: "no-store",
      }
    );
    return response.ok;
  } catch (err) {
    console.warn("⚠️ Errore nel controllo della rete:", err);
    return false;
  }
}

let syncInterval = null;
let wasFakeOffline = false; // Se l'evento offline era falso
let lastWentOffline = false; // Se abbiamo avuto un evento offline recente
let isCurrentlyOffline = !navigator.onLine; // Stato reale della connessione al momento

window.addEventListener("offline", () => {
  console.log("🚫 Evento offline ricevuto... controllo se è vero.");

  isCurrentlyOffline = true;
  lastWentOffline = true;

  // Aspetta un attimo poi verifica davvero se siamo offline
  setTimeout(async () => {
    const stillOnline = await checkRealInternetConnection();

    if (stillOnline) {
      console.log("🟡 Falso offline: la rete è ancora attiva!");
      wasFakeOffline = true;
    } else {
      console.log("🔌 Connessione persa davvero.");
      wasFakeOffline = false;
    }
  }, 3000);
});

window.addEventListener("online", () => {
  console.log(
    "⚡ Evento online rilevato. Verifico la connessione reale tra 3000 ms..."
  );

  // Se già eravamo online, ignoro per evitare sync inutili
  if (!isCurrentlyOffline) {
    console.log("🟢 Già online, ignoro evento online fantasma.");
    return;
  }

  setTimeout(async () => {
    const reallyOnline = await checkRealInternetConnection();

    // Se offline era falso oppure rete instabile → blocco sync
    if ((lastWentOffline && wasFakeOffline) || !reallyOnline) {
      console.warn("❌ Sync bloccata: offline fasullo o rete instabile.");
      wasFakeOffline = false;
      lastWentOffline = false;
      return;
    }

    console.log(
      "🌐 Connessione confermata con il server! Sincronizzo i dati..."
    );
    toast("Sincronizzazione in corso. Non chiudere o ricaricare l'app.", 2000);

    sessionStorage.setItem("canRefresh", "false");
    refreshBtn?.classList.add("disabled");

    if (syncInterval !== null) {
      console.warn("⏱️ Sync già in corso, evito duplicazioni.");
      return;
    }

    isCurrentlyOffline = false; // Aggiorna stato offline

    syncInterval = setInterval(async () => {
      if (syncRetries >= maxRetries) {
        clearInterval(syncInterval);
        syncInterval = null;
        return;
      }

      const syncSuccess = await syncWithServer();

      if (syncSuccess) {
        sessionStorage.setItem("canRefresh", "true");
        refreshBtn?.classList.remove("disabled");
        clearInterval(syncInterval);
        syncInterval = null;
      }
    }, 3000);

    wasFakeOffline = false;
    lastWentOffline = false;
  }, 3000);
});
