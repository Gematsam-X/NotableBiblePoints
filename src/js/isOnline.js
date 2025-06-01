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

/**
 * Registra un listener che esegue callback quando l'app torna online
 * Gestisce sia ambiente nativo Capacitor sia browser
 * @param {function} callback Funzione da chiamare quando si torna online
 * @returns {Promise<function>} Funzione per rimuovere il listener
 */
export async function onNetworkOnline(callback) {
  await loadNetworkPlugin();

  if (Capacitor.isNativePlatform() && Network) {
    const listener = await Network.addListener(
      "networkStatusChange",
      (status) => {
        localStorage.setItem(
          "lastNetworkStatus",
          status.connected ? "online" : "offline"
        );

        if (status.connected) {
          console.log("📶 App è tornata online (nativo)");
          window.setTimeout(callback, 2000); // Ritardo per evitare problemi di sincronizzazione
        }
      }
    );

    return () => {
      listener.remove();
    };
  } else {
    const handler = () => {
      localStorage.setItem("lastNetworkStatus", "online");
      console.log("📶 App è tornata online (browser)");
      window.setTimeout(callback, 2000);
    };

    const offlineHandler = () => {
      localStorage.setItem("lastNetworkStatus", "offline");
    };

    window.addEventListener("online", handler);
    window.addEventListener("offline", offlineHandler);

    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", offlineHandler);
    };
  }
}
