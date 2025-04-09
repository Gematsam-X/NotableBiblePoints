const DB_NAME = "NotableBiblePointsDB";
const DB_VERSION = 1;
const STORE_NAME = "NotableBiblePointsStore";

let dbCache = null;

/**
 * Apre (o crea se non esiste) il database IndexedDB
 * @returns {Promise<IDBDatabase>} - Ritorna una Promise che risolve con l'istanza del database
 */
function openDB() {
  if (dbCache) {
    return Promise.resolve(dbCache); // Usa la cache se il DB è già stato aperto
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = (event) => {
      dbCache = event.target.result;
      resolve(dbCache);
    };

    request.onerror = (event) => {
      console.error(
        `Errore nell'aprire il database IndexedDB: ${event.target.error}`
      );
      reject("Errore nell'apertura del database IndexedDB");
    };
  });
}

/**
 * Salva o aggiorna un valore nello store del database
 * @param {string} key - La chiave del valore da salvare
 * @param {*} value - Il valore da salvare (può essere qualsiasi tipo, incluso oggetto)
 * @returns {Promise<void>} - Promise risolta quando l'operazione è completata
 */
export async function setValue(key, value) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.put({ key, value });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = (event) => {
        console.error(
          `Errore nel salvataggio del valore: ${event.target.error}`
        );
        reject(`Errore nel salvataggio del valore: ${event.target.error}`);
      };
    });
  } catch (error) {
    console.error("Errore nel salvataggio su IndexedDB:", error);
    throw new Error("Errore nel salvataggio su IndexedDB");
  }
}

/**
 * Recupera un valore dallo store del database tramite una chiave
 * @param {string} key - La chiave del valore da recuperare
 * @returns {Promise<*>} - Promise che risolve con il valore o null se non trovato
 */
export async function getValue(key) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };
      request.onerror = (event) => {
        console.error(`Errore nel recupero del valore: ${event.target.error}`);
        reject(`Errore nel recupero del valore: ${event.target.error}`);
      };
    });
  } catch (error) {
    console.error("Errore nel recupero da IndexedDB:", error);
    throw new Error("Errore nel recupero da IndexedDB");
  }
}

/**
 * Elimina un valore dallo store tramite la sua chiave
 * @param {string} key - La chiave del valore da eliminare
 * @returns {Promise<void>} - Promise risolta quando l'eliminazione è completata
 */
export async function deleteValue(key) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.delete(key);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = (event) => {
        console.error(
          `Errore nell'eliminazione del valore: ${event.target.error}`
        );
        reject(`Errore nell'eliminazione del valore: ${event.target.error}`);
      };
    });
  } catch (error) {
    console.error("Errore nell'eliminazione da IndexedDB:", error);
    throw new Error("Errore nell'eliminazione da IndexedDB");
  }
}
