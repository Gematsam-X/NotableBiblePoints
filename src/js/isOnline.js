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
