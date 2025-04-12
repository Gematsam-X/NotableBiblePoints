import { openDB } from "./idb.js";

const DB_NAME = "NotableBiblePointsDB";
const DB_VERSION = 1;
const STORE_NAME = "NotableBiblePointsStore";

// Apre o crea il database
async function openDBInstance() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    },
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
    const db = await openDBInstance();
    await db.put(STORE_NAME, { key, value });
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
    const db = await openDBInstance();
    const result = await db.get(STORE_NAME, key);
    console.log(result, "questo è ciò che è uscito da getValue");
    return result ? result.value : null;
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
    const db = await openDBInstance();
    await db.delete(STORE_NAME, key);
  } catch (error) {
    console.error("Errore nell'eliminazione da IndexedDB:", error);
    throw new Error("Errore nell'eliminazione da IndexedDB");
  }
}
