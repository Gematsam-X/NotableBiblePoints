import Backendless from "backendless";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { deleteValue, getValue, setValue } from "./indexedDButils.js"; // Importiamo le funzioni per IndexedDB
import { isOnline } from "./isOnline.js";
import { hideGif, showGif } from "./loadingGif.js";
import toast from "./toast.js";

async function findUserRecords() {
  return (
    (
      await Backendless.Data.of("NotableBiblePoints").findFirst()
    ).NotablePoints.filter(
      (entry) => entry.owner == localStorage.getItem("userEmail")
    ) ||
    (await getValue("userNotes")) ||
    []
  );
}

export async function createBackup() {
  showGif();

  const databaseEntry = await findUserRecords();
  if (!databaseEntry.length) {
    toast("Nessun punto notevole da salvare.");
    hideGif();
    return;
  }

  const userEmail = localStorage.getItem("userEmail") || "utente";

  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  const fileName = `NotableBiblePointsBACKUP_${userEmail}_${day}-${month}-${year}.txt`;

  const fileData = JSON.stringify(databaseEntry, null, 4);

  try {
    // 🔥 Scriviamo il file nella directory Cache
    await Filesystem.writeFile({
      path: fileName,
      data: fileData,
      directory: Directory.Cache,
      encoding: "utf8",
    });

    // ✅ Otteniamo URI per la condivisione
    const fileUriResult = await Filesystem.getUri({
      directory: Directory.Cache,
      path: fileName,
    });

    const uri = fileUriResult.uri;
    hideGif();

    // 📤 Condividiamo!
    await Share.share({
      title: "Backup NotableBiblePoints",
      text: "Ecco il backup dei tuoi punti notevoli.",
      url: uri,
      dialogTitle: "Condividi il backup",
    });

    toast("Backup creato e condiviso con successo!");
  } catch (err) {
    console.error("Errore nel salvataggio o nella condivisione del file:", err);
    if (err.message.toLowerCase().includes("share canceled")) return;
    else toast(`Errore durante il backup: ${err.message || err}`);
  }
}

let restoreListenerSet = false;

export async function restoreBackup() {
  const inputFile = document.getElementById("fileInput");

  if (!inputFile) {
    toast("Elemento fileInput non trovato nel DOM.");
    return;
  }

  inputFile.accept = ".txt";

  if (!restoreListenerSet) {
    restoreListenerSet = true;

    inputFile.addEventListener("change", async function (event) {
      const file = event.target.files[0];
      if (!file) {
        toast("Nessun file selezionato.");
        return;
      }

      showGif();

      const reader = new FileReader();
      reader.onload = async function (e) {
        try {
          const jsonData = JSON.parse(e.target.result);

          if (!Array.isArray(jsonData)) {
            toast("Il file di backup è corrotto.");
            return;
          }

          const userEmail = localStorage.getItem("userEmail");
          if (!userEmail) {
            toast("Utente non autenticato.");
            return;
          }

          const online = await isOnline();

          let userNotes = online
            ? await Backendless.Data.of("NotableBiblePoints").findFirst()
            : await getValue("userNotes");

          if (!userNotes) userNotes = { NotablePoints: [] };

          const allNotes = online ? userNotes.NotablePoints : userNotes;

          // 🔥 FILTRIAMO tutte le note tranne quelle dell'utente corrente
          const otherUsersNotes = allNotes.filter((n) => n.owner !== userEmail);

          // 🔄 AGGIUNGIAMO/SOSTITUIAMO tutte quelle del backup (che sono SOLO dell'utente)
          const updatedNotes = [
            ...otherUsersNotes,
            ...jsonData.map((note) => ({
              ...note,
              owner: userEmail,
              updatedAt: Date.now().toString(),
            })),
          ];

          await deleteValue("userNotes");

          // Salviamo!
          if (online) {
            await Backendless.Data.of("NotableBiblePoints").save({
              ...userNotes,
              NotablePoints: updatedNotes,
            });
          } else {
            await setValue(
              "userNotes",
              updatedNotes.filter((n) => n.owner === userEmail)
            );
          }

          toast("Backup ripristinato con successo.");
        } catch (err) {
          console.error("Errore nel parsing del file:", err);
          toast("Errore nel file di backup.");
        } finally {
          hideGif();
        }
      };

      reader.readAsText(file);
    });
  }

  inputFile.click();
}
