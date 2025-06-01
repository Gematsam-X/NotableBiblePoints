import Backendless from "backendless";
import { getValue, deleteValue, setValue } from "./indexedDButils.js";
import toast from "./toast.js";
import { isOnline, onNetworkOnline } from "./isOnline.js";
import { logoutUser } from "./logoutAndDelete.js";

const refreshBtn = document.querySelector(".refreshNotes");

async function startNetworkSync() {
  /**
   * 🔁 Sincronizza i dati locali con Backendless
   */
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
        if (error.message.toLowerCase().includes("relogin user")) logoutUser();
        toast(
          `Errore nel recupero delle tue note dal cloud. Continueremo a provare. Non chiudere o ricaricare l'app. Dettagli: ${error}`,
          4500
        );
        window.setTimeout(syncWithServer, 3000);
        return false;
      }

      if (!serverRecord?.NotablePoints) {
        toast(
          "Errore: database non trovato. Non riproveremo. Rivolgiti allo sviluppatore.",
          3500
        );
        throw new Error("Record o campo NotablePoints mancante.");
      }

      const serverNotes = serverRecord.NotablePoints;

      // Rimuovi note eliminate
      let updatedNotes = serverNotes.filter(
        (note) => !deletedNotes.some((deleted) => deleted.id === note.id)
      );

      // Aggiungi nuove note locali
      const newNotes = userNotes.filter(
        (localNote) =>
          !serverNotes.some((serverNote) => serverNote.id === localNote.id)
      );
      updatedNotes.push(...newNotes);

      // Risolvi conflitti sulle note condivise
      updatedNotes = updatedNotes.map((note) => {
        const localNote = userNotes.find((n) => n.id === note.id);
        const serverNote = serverNotes.find(
          (n) => n.id === note.id && n.owner === note.owner
        );

        if (!localNote || !serverNote) return note;

        const localTime = localNote.updatedAt;
        const serverTime = serverNote.updatedAt;

        if (!localTime && !serverTime) return serverNote;
        if (localTime && !serverTime) return localNote;
        if (!localTime && serverTime) return serverNote;

        return localTime > serverTime ? localNote : serverNote;
      });

      // Salva tutto
      serverRecord.NotablePoints = updatedNotes;
      await Backendless.Data.of("NotableBiblePoints").save(serverRecord);

      // Aggiorna locale
      await deleteValue("deletedNotes");
      await setValue("userNotes", updatedNotes);

      console.log("✅ Sincronizzazione completata!");
      toast("Sincronizzazione completata!", 2000);
      return true;
    } catch (error) {
      console.error("❌ Errore durante la sincronizzazione:", error);
      window.setTimeout(syncWithServer, 1500);
      return false;
    }
  }

  /**
   * 🔂 Avvia la sincronizzazione se non è già stata fatta in questa sessione
   */
  async function onOnlineHandler() {
    if (sessionStorage.getItem("hasSynced") === "true") {
      console.log("🔁 Sync già eseguita in questa sessione.");
      return;
    }

    console.log("📶 Online: avvio sincronizzazione...");
    toast("Sincronizzazione in corso. Non chiudere l'app!", 2000);
    sessionStorage.setItem("canRefresh", "false");
    refreshBtn?.classList.add("disabled");

    const success = await syncWithServer();

    if (success) {
      sessionStorage.setItem("hasSynced", "true");
      sessionStorage.setItem("canRefresh", "true");
      refreshBtn?.classList.remove("disabled");
    }
  }

  /**
   * 🧠 Controlla se serve sincronizzare subito all'avvio
   */
  const wasOfflineBefore =
    localStorage.getItem("lastNetworkStatus") === "offline";
  const nowOnline = await isOnline();

  if (wasOfflineBefore && nowOnline) {
    await onOnlineHandler(); // all’avvio: se eravamo offline e ora online, sync
  }

  // 🔌 Rimani in ascolto: se torni online mentre usi l’app ➜ sync
  await onNetworkOnline(onOnlineHandler);
}

startNetworkSync();
