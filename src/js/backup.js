import backendlessRequest from "/src/js/backendlessRequest.js";
import { getValue, setValue } from "/src/js/indexedDButils.js"; // Importiamo le funzioni per IndexedDB
import { hideGif, showGif } from "/src/js/loadingGif.js";
import shouldUseServer from "/src/js/notes.js";
import toast from "/src/js/toast.js";

async function findUserRecords() {
  const userEmail = localStorage.getItem("userEmail");
  let fullRecord = [];
  try {
    // Recupera le note
    fullRecord =
      ((await shouldUseServer())
        ? await backendlessRequest(
            "notes:get",
            {
              email: userEmail,
            },
            localStorage.getItem("userToken")
          )
        : await getValue("userNotes")) || [];
  } catch (err) {
    console.error("Errore durante il recupero:", err.message);
  }

  if (!fullRecord) {
    toast("Errore: dati non trovati.");
    return [];
  }
  return fullRecord;
}

export async function createBackup() {
  showGif();
  const databaseEntry = await findUserRecords();

  if (!databaseEntry.length) {
    toast("Non hai ancora salvato nessun punto notevole.");
    hideGif();
    return;
  }

  const userEmail = localStorage.getItem("userEmail");

  let jsonString = JSON.stringify(databaseEntry, null, 4);
  let blob = new Blob([jsonString], { type: "application/json" });
  let url = URL.createObjectURL(blob);

  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  let fileName = `NotableBiblePointsBACKUP_${day}-${month}-${year}.nbp`;

  let a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  hideGif();

  toast(
    "Backup scaricato con successo. Tienilo in un posto sicuro: non è possibile recuperarlo se lo perdi."
  );
}

let jsonData = null;

export async function restoreBackup() {
  const inputFile = document.getElementById("fileInput");

  if (!inputFile) {
    toast("Elemento di input file non trovato.");
    return;
  }

  inputFile.accept = ".nbp";

  // ✅ Rimuovi eventuali listener precedenti per evitare duplicati
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
        if (navigator.onLine)
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
        console.error("Errore nel parsing del file JSON:", err);
        toast("Errore nel file di backup. Assicurati che sia un .nbp valido.");
      } finally {
        hideGif();
      }
    };

    reader.readAsText(file);
  });

  newInput.click();
}
