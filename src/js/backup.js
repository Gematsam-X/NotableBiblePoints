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
  // 1. Recupera il file input esistente nella pagina
  const inputFile = document.getElementById("fileInput");

  // 2. Verifica se il file input è presente
  if (!inputFile) {
    toast("Elemento di input file non trovato.");
    return;
  }

  // 3. Aggiungi un evento per gestire il caricamento del file
  inputFile.addEventListener("change", async function (event) {
    const file = event.target.files[0]; // Ottieni il primo file selezionato

    if (!file) {
      toast("Per favore, seleziona un file JSON.");
      return;
    }

    showGif();

    const reader = new FileReader();

    reader.onload = async function (e) {
      try {
        // 4. Parsifica il contenuto JSON
        jsonData = JSON.parse(e.target.result);

        // 5. Verifica che il JSON sia un array
        if (!Array.isArray(jsonData)) {
          toast("Il file JSON non contiene un array valido.");
          return;
        }

        // 6. Recupera il record esistente nel database (NotableBiblePoints)
        const databaseEntry = await Backendless.Data.of(
          "NotableBiblePoints"
        ).findFirst();

        if (!databaseEntry || !databaseEntry.NotablePoints) {
          toast("Nessun dato nel database da unire.");
          return;
        }

        const previousRecords = databaseEntry.NotablePoints;

        // 7. Unisci i dati esistenti nel database con quelli caricati nel file JSON
        const mergedRecords = previousRecords.map((existingEntry) => {
          // Trova l'entry corrispondente nel nuovo file JSON
          const newEntry = jsonData.find(
            (newEntry) => newEntry.id === existingEntry.id
          );

          // Se non troviamo l'entry corrispondente, manteniamo quella precedente
          if (!newEntry) return existingEntry;

          // Se i campi sono diversi, aggiorna il record
          const isDifferent =
            existingEntry.book !== newEntry.book ||
            existingEntry.owner !== newEntry.owner ||
            existingEntry.title !== newEntry.title ||
            existingEntry.verse !== newEntry.verse ||
            existingEntry.chapter !== newEntry.chapter ||
            existingEntry.content !== newEntry.content;

          // Se c'è una differenza, aggiorniamo il record
          if (isDifferent) {
            return { ...existingEntry, ...newEntry }; // Aggiorna i dati con quelli nuovi
          }

          // Se i dati sono uguali, non fare nulla
          return existingEntry;
        });

        // 8. Aggiungi i nuovi record che non esistono già nel database
        const newRecords = jsonData.filter(
          (newEntry) =>
            !previousRecords.some(
              (existingEntry) => existingEntry.id === newEntry.id
            )
        );

        // 9. Unisci i nuovi record ai mergedRecords
        const finalRecords = [...mergedRecords, ...newRecords];

        // 10. Aggiorna i dati uniti nel database
        databaseEntry.NotablePoints = finalRecords;

        // 11. Salva i dati uniti nel database
        await Backendless.Data.of("NotableBiblePoints").save(databaseEntry);

        // 12. Mostra un messaggio di successo
        toast("Dati uniti e ripristinati con successo.");
      } catch (e) {
        console.error("Errore nel parsing del file JSON:", e); // Log dettagliato dell'errore
        toast(
          "Errore nel parsing del file JSON. Controlla che sia un file JSON valido."
        );
      } finally {
        hideGif();
      }
    };

    // 13. Leggi il file come testo
    reader.readAsText(file);
  });

  // 14. Simula il click sull'input file per far aprire la finestra di selezione del file
  inputFile.click();
}
