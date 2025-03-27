import { hideGif, showGif } from "./loadingGif.js";
import toast from "./toast.js";

async function findUserRecords() {
  const databaseEntry = await Backendless.Data.of(
    "NotableBiblePoints"
  ).findFirst();

  if (!databaseEntry || !databaseEntry.NotablePoints) {
    toast("Errore: dati non trovati.");
    return [];
  }

  console.log("Dati attuali:", databaseEntry.NotablePoints);
  return databaseEntry;
}

export async function createBackup() {
  showGif();
  const databaseEntry = await findUserRecords();
  const previousRecords = databaseEntry.NotablePoints;
  if (!previousRecords.length) {
    toast("Non hai ancora salvato nessun punto notevole.");
    hideGif();
    return;
  }

  const exportingRecords = previousRecords.filter(
    (entry) => entry.owner == localStorage.getItem("userEmail")
  );

  if (!exportingRecords.length) {
    toast("Nessun dato disponibile per l'utente corrente.");
    hideGif();
    return;
  }

  let jsonString = JSON.stringify(exportingRecords, null, 4);
  let blob = new Blob([jsonString], { type: "application/json" });
  let url = URL.createObjectURL(blob);

  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  let fileName = `NotableBiblePointsBACKUP_${localStorage.getItem(
    "userEmail"
  )}_${day}-${month}-${year}.json`;

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
          toast("Il file JSON non contiene un array valido.");
          return;
        }

        const userEmail = localStorage.getItem("userEmail");

        if (!userEmail) {
          toast("Utente non autenticato.");
          return;
        }

        const databaseEntry = await Backendless.Data.of(
          "NotableBiblePoints"
        ).findFirst();

        if (!databaseEntry || !databaseEntry.NotablePoints) {
          toast("Nessun dato nel database da sostituire.");
          return;
        }

        // Filtra i record non appartenenti all'utente corrente
        const remainingRecords = databaseEntry.NotablePoints.filter(
          (entry) => entry.owner !== userEmail
        );

        // Aggiungi i nuovi record dal file JSON
        const newRecords = jsonData.map((entry) => ({
          ...entry,
          owner: userEmail, // Associa i nuovi record all'utente corrente
        }));

        // Combina i record rimanenti con i nuovi
        databaseEntry.NotablePoints = [...remainingRecords, ...newRecords];

        // Salva i dati aggiornati nel database
        await Backendless.Data.of("NotableBiblePoints").save(databaseEntry);
        localStorage.removeItem("userNotes");

        toast("Backup ripristinato con successo.");
      } catch (e) {
        console.error("Errore nel parsing del file JSON:", e);
        toast(
          "Errore nel parsing del file JSON. Controlla che sia un file JSON valido."
        );
      } finally {
        hideGif();
      }
    };

    reader.readAsText(file);
  });

  inputFile.click();
}
