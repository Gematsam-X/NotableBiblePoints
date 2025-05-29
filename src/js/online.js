import { getValue, deleteValue, setValue } from "./indexedDButils.js";
import toast from "./toast.js";
import { isOnline, onNetworkOnline } from "./isOnline.js";

const refreshBtn = document.querySelector(".refreshNotes");

async function startNetworkSync() {
  // Funzione per sincronizzare con il server
  async function syncWithServer() {
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
        toast(
          "Errore: database non trovato. Non riproveremo. Rivolgiti allo sviluppatore se il problema persiste.",
          3500
        );
        throw new Error(
          "Nessun record trovato nel database, o campo NotablePoints inesistente."
        );
      }

      const serverNotes = serverRecord.NotablePoints;

      // Rimuovi note eliminate
      let updatedNotes = serverNotes.filter(
        (note) => !deletedNotes.some((deleted) => deleted.id === note.id)
      );

      // Aggiungi note nuove locali
      const newNotes = userNotes.filter(
        (localNote) =>
          !serverNotes.some((serverNote) => serverNote.id === localNote.id)
      );
      updatedNotes.push(...newNotes);

      // Confronta note condivise
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

      // Salva nel server
      serverRecord.NotablePoints = updatedNotes;
      await Backendless.Data.of("NotableBiblePoints").save(serverRecord);

      // Aggiorna locale
      await deleteValue("deletedNotes");
      await setValue("userNotes", updatedNotes);

      console.log("Sincronizzazione completata con successo!");
      toast("Sincronizzazione completata!", 2000);
      return true;
    } catch (error) {
      console.error("Errore durante la sincronizzazione:", error);
      window.setTimeout(syncWithServer, 1500);
      return false;
    }
  }

  // Funzione chiamata quando torni online
  async function onOnlineHandler() {
    console.log("Connessione ripristinata. Sincronizzo i dati...");
    toast("Sincronizzazione in corso. Non chiudere o ricaricare l'app.", 2000);
    sessionStorage.setItem("canRefresh", "false");

    if (!refreshBtn?.classList.contains("disabled")) {
      refreshBtn?.classList.add("disabled");
    }

    const success = await syncWithServer();

    if (success) {
      sessionStorage.setItem("canRefresh", "true");
      refreshBtn?.classList.remove("disabled");
      console.log("Sincronizzazione completata con successo!");
    } else {
      console.log(
        "Sincronizzazione fallita, riprovo al prossimo evento online."
      );
    }
  }

  // Check iniziale se già online: se sì, sync subito
  if (await isOnline()) {
    await onOnlineHandler();
  }

  // Ascolta evento di ritorno online con onNetworkOnline(callback)
  onNetworkOnline(onOnlineHandler);
}

// Avvia tutto
startNetworkSync();
