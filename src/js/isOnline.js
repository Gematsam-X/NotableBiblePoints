// networkUtils.js
import { Capacitor } from "@capacitor/core";

let Network;

/**
 * Carica dinamicamente il plugin Capacitor Network solo se siamo su piattaforma nativa
 */
async function loadNetworkPlugin() {
  if (Capacitor.isNativePlatform()) {
    Network = (await import("@capacitor/network")).Network;
  }
}

/**
 * Controlla se la connessione di rete è attiva
 * Funziona sia su mobile nativo (Capacitor) sia su browser (fallback)
 * @returns {Promise<boolean>} true se online, false se offline
 */
export async function isOnline() {
  if (!Network) await loadNetworkPlugin();

  if (Capacitor.isNativePlatform()) {
    const status = await Network.getStatus();
    console.log("Network status nativo:", status);
    return status.connected;
  } else {
    console.log("Network status browser:", navigator.onLine);
    return navigator.onLine;
  }
}

/**
 * Registra un listener che esegue callback quando l'app torna online
 * Gestisce sia ambiente nativo Capacitor sia browser
 * @param {function} callback Funzione da chiamare quando si torna online
 * @returns {function} Funzione per rimuovere il listener
 */
export async function onNetworkOnline(callback) {
  if (!Network) await loadNetworkPlugin();

  if (Capacitor.isNativePlatform()) {
    const listener = Network.addListener("networkStatusChange", (status) => {
      if (status.connected) {
        console.log("📶 App è tornata online (nativo)");
        callback();
      }
    });
    // Ritorna funzione per rimuovere il listener
    return () => listener.remove();
  } else {
    const handler = () => {
      console.log("📶 App è tornata online (browser)");
      callback();
    };
    window.addEventListener("online", handler);
    // Ritorna funzione per rimuovere il listener
    return () => window.removeEventListener("online", handler);
  }
}
