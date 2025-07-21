import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { deleteValue, getValue, setValue } from "./indexedDButils.js"; // Importiamo le funzioni per IndexedDB
import { isOnline } from "./isOnline.js";
import { hideGif, showGif } from "./loadingGif.js";
import toast from "./toast.js";
import backendlessRequest from "./backendlessRequest.js";

async function findUserRecords() {
  return (
    (await backendlessRequest(
      "notes:get",
      { email: localStorage.getItem("userEmail") },
      localStorage.getItem("userToken")
    )) ||
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

  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  const now = Date.now().toString().slice(-6); // Ultimi 6 caratteri del timestamp

  const fileName = `NotableBiblePointsBACKUP_${day}-${month}-${year}_${now}.txt`;

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

    toast("Backup salvato con successo!");
  } catch (err) {
    console.error("Errore nel salvataggio o nella condivisione del file:", err);
    if (err.message.toLowerCase().includes("share canceled")) return;
    else toast(`Errore durante il backup: ${err.message || err}`);
  }
}

export async function restoreBackup() {
  const inputFile = document.getElementById("fileInput");

  if (!inputFile) {
    toast("Elemento di input file non trovato.");
    return;
  }

  inputFile.accept = ".txt";

  // Rimuovi eventuali listener precedenti per evitare duplicati
  const newInput = inputFile.cloneNode(true);
  inputFile.replaceWith(newInput);

  newInput.addEventListener("change", async function (event) {
    const file = event.target.files[0];
    if (!file) {
      toast("Seleziona un file .nbp valido.");
      return;
    }

    showGif();

    const reader = new FileReader();

    reader.onload = async function (e) {
      try {
        const jsonData = JSON.parse(e.target.result);

        if (!Array.isArray(jsonData)) {
          toast("Il file di backup è corrotto. Non è possibile ripristinarlo.");
          return;
        }

        const userEmail = localStorage.getItem("userEmail");
        if (!userEmail) {
          toast("Utente non autenticato.");
          return;
        }

        const existing = await getValue("userNotes");
        const notes = Array.isArray(existing) ? existing : [];

        for (const newRecord of jsonData) {
          const idx = notes.findIndex((note) => note.id === newRecord.id);

          const record = {
            ...newRecord,
            updatedAt: Date.now().toString(),
          };

          if (idx !== -1) {
            notes[idx] = { ...notes[idx], ...record };
          } else {
            notes.push(record);
          }
        }

        // Salva nel server o in locale
        if (await isOnline())
          await backendlessRequest(
            "notes:addOrUpdate",
            {
              email: userEmail,
              note: notes,
            },
            localStorage.getItem("userToken")
          );

        await setValue("userNotes", notes);

        toast("Backup ripristinato con successo!");
      } catch (err) {
        console.error("Errore nel parsing del file:", err);
        toast("Errore nel file di backup. Assicurati che sia valido.");
      } finally {
        hideGif();
      }
    };

    reader.readAsText(file);
  });

  newInput.click();
}
