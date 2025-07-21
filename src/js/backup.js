import backendlessRequest from "/src/js/backendlessRequest.js";
import { getValue, setValue } from "/src/js/indexedDButils.js"; // Importiamo le funzioni per IndexedDB
import { hideGif, showGif } from "/src/js/loadingGif.js";
import toast from "/src/js/toast.js";

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
    toast("Non hai ancora salvato nessun punto notevole.");
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
  const now = Date.now().toString().slice(-6); // Ultimi 6 caratteri del timestamp

  let fileName = `NotableBiblePointsBACKUP_${day}-${month}-${year}_${now}.txt`;

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

export async function restoreBackup() {
  const inputFile = document.getElementById("fileInput");

  if (!inputFile) {
    toast("Elemento di input file non trovato.");
    return;
  }

  inputFile.accept = ".txt";

  // Elimina listener duplicati clonando l'elemento
  const newInput = inputFile.cloneNode(true);
  inputFile.replaceWith(newInput);

  newInput.addEventListener("change", async function (event) {
    const file = event.target.files[0];
    if (!file) {
      toast("Seleziona un file valido.");
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
        const userToken = localStorage.getItem("userToken");

        if (!userEmail || !userToken) {
          toast("Utente non autenticato.");
          return;
        }

        const existing = await getValue("userNotes");
        const notes = Array.isArray(existing) ? existing : [];

        // Mappa di note da backup
        const newNotesMap = new Map();
        for (const newRecord of jsonData) {
          newNotesMap.set(newRecord.id, {
            ...newRecord,
            updatedAt: Date.now().toString(),
          });
        }

        // Merge: aggiorna o aggiungi
        for (const [id, record] of newNotesMap.entries()) {
          const idx = notes.findIndex((note) => note.id === id);
          if (idx !== -1) {
            notes[idx] = { ...notes[idx], ...record };
          } else {
            notes.push(record);
          }
        }

        // Salva nel server se online
        if (navigator.onLine) {
          // Recupera le note attualmente sul server
          const response = await backendlessRequest(
            "notes:get",
            { email: userEmail },
            userToken
          );

          const serverNotes = Array.isArray(response) ? response : [];

          // Trova ID da eliminare (note presenti nel server ma NON nel file)
          const idsToDelete = serverNotes
            .filter((note) => !newNotesMap.has(note.id))
            .map((note) => note.id);

          // Elimina dal server se necessario
          if (idsToDelete.length > 0) {
            await backendlessRequest(
              "notes:delete",
              {
                email: userEmail,
                ids: idsToDelete,
              },
              userToken
            );
          }

          // Salva tutto il nuovo set di note
          await backendlessRequest(
            "notes:addOrUpdate",
            {
              email: userEmail,
              note: Array.from(newNotesMap.values()),
            },
            userToken
          );
        }

        // Salva anche localmente
        await setValue("userNotes", Array.from(newNotesMap.values()));

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
