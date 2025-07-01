import { hideGif, showGif } from "./loadingGif.js";
import toast from "./toast.js";
import { getValue, setValue } from "./indexedDButils.js"; // Importiamo le funzioni per IndexedDB
import Backendless from "backendless";

async function findUserRecords() {
  const databaseEntry =
    (
      await Backendless.Data.of("NotableBiblePoints").findFirst()
    ).NotablePoints.filter(
      (entry) => entry.owner == localStorage.getItem("userEmail")
    ) || (await getValue("userNotes"));

  if (!databaseEntry) {
    toast("Errore: dati non trovati.");
    return [];
  }

  console.log("Dati attuali:", databaseEntry);
  return databaseEntry;
}

export async function createBackup() {
  showGif();
  const databaseEntry = await findUserRecords();

  if (!databaseEntry.length) {
    toast("Non hai ancora salvato nessun punto notevole.");
    hideGif();
    return;
  }

  const userEmail = localStorage.getItem("userEmail"); // Otteniamo l'email dall'IndexedDB

  if (!databaseEntry.length) {
    toast("Nessun dato disponibile per l'utente corrente.");
    hideGif();
    return;
  }

  let jsonString = JSON.stringify(databaseEntry, null, 4);
  let blob = new Blob([jsonString], { type: "application/json" });
  let url = URL.createObjectURL(blob);

  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  let fileName = `NotableBiblePointsBACKUP_${userEmail}_${day}-${month}-${year}.nbp`;

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

  inputFile.addEventListener("change", async function (event) {
    const file = event.target.files[0];

    if (!file) {
      toast("Per favore, seleziona un file JSON.");
      return;
    }

    showGif();

    const reader = new FileReader();

    reader.onload = async function (e) {
      try {
        jsonData = JSON.parse(e.target.result);

        if (!Array.isArray(jsonData)) {
          toast("Il file di backup è corrotto. Non è possibile ripristinarlo.");
          return;
        }

        const userEmail = localStorage.getItem("userEmail");

        if (!userEmail) {
          toast("Utente non autenticato.");
          return;
        }

        // Recupera il primo (e unico) record dal database che contiene tutte le note
        let userNotes = navigator.onLine
          ? await Backendless.Data.of("NotableBiblePoints").findFirst()
          : await getValue("userNotes");

        if (!userNotes) {
          userNotes = { NotablePoints: [] };
        }

        let notes = navigator.onLine ? userNotes.NotablePoints : userNotes;

        // Aggiungi i nuovi record o aggiorna quelli esistenti
        for (const newRecord of jsonData) {
          // Cerca se esiste già un record con lo stesso id
          const existingRecordIndex = notes.findIndex(
            (note) => note.id === newRecord.id
          );

          if (existingRecordIndex !== -1) {
            // Se il record esiste, aggiornalo
            notes[existingRecordIndex] = {
              ...notes[existingRecordIndex],
              ...newRecord, // Aggiorna solo i campi modificati
              updatedAt: Date.now().toString(),
            };
          } else {
            // Se il record non esiste, aggiungilo
            notes.push({
              ...newRecord,
              owner: userEmail, // Associa il nuovo record all'utente
            });
          }
        }

        // Salva i dati nel database
        userNotes.NotablePoints = notes;

        if (navigator.onLine) {
          await Backendless.Data.of("NotableBiblePoints").save(userNotes);
          console.log("Backup ripristinato con successo sul server!");
        } else {
          await setValue(
            "userNotes",
            notes.filter((note) => note.owner === userEmail)
          );
          console.log("Backup ripristinato con successo in locale!");
        }

        // Resetta lo stato
        toast("Backup ripristinato con successo.");
      } catch (e) {
        console.error("Errore nel parsing del file JSON:", e);
        toast(
          "Errore nel parsing del file di backup. Assicurati che il file sia valido."
        );
      } finally {
        hideGif();
      }
    };

    reader.readAsText(file);
  });

  inputFile.click();
}
