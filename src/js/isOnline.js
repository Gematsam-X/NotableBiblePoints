import { Capacitor } from "@capacitor/core";

let Network = null;

/**
 * Carica dinamicamente il plugin Capacitor Network solo se siamo su piattaforma nativa
 */
async function loadNetworkPlugin() {
  if (Capacitor.isNativePlatform() && !Network) {
    Network = (await import("@capacitor/network")).Network;
  }
}

/**
 * Controlla se la connessione di rete è attiva
 * Funziona sia su mobile nativo (Capacitor) sia su browser
 * @returns {Promise<boolean>} true se online, false se offline
 */
export async function isOnline() {
  await loadNetworkPlugin();

  if (Capacitor.isNativePlatform() && Network) {
    const status = await Network.getStatus();
    console.log("📡 Stato rete (nativo):", status);
    return status.connected;
  } else {
    console.log("📡 Stato rete (browser):", navigator.onLine);
    return navigator.onLine;
  }
}

/**
 * Registra un listener che esegue callback quando l'app torna online
 * Gestisce sia ambiente nativo Capacitor sia browser
 * @param {function} callback Funzione da chiamare quando si torna online
 * @returns {Promise<function>} Funzione per rimuovere il listener
 */
export async function onNetworkOnline(callback) {
  await loadNetworkPlugin();

  if (Capacitor.isNativePlatform() && Network) {
    const listener = await Network.addListener("networkStatusChange", (status) => {
      if (status.connected) {
        console.log("📶 App è tornata online (nativo)");
        callback();
      }
    });

    return () => {
      listener.remove();
    };
  } else {
    const handler = () => {
      console.log("📶 App è tornata online (browser)");
      callback();
    };

    window.addEventListener("online", handler);

    return () => {
      window.removeEventListener("online", handler);
    };
  }
}