export default async function isOnline() {
  const start = performance.now();

  const testUrl = "https://gematsam-x.github.io/NotableBiblePoints/ping.txt";

  // Costruzione della promessa con timeout
  const controller = new AbortController(); // Serve per poter "uccidere" la fetch se ci mette troppo
  const timeout = setTimeout(() => {
    controller.abort(); // KILL!
  }, 3000); // 3 secondi di timeout
  // Se non si usa il timeout, la fetch può rimanere bloccata per un tempo indefinito

  try {
    const response = await fetch(testUrl, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal, // Colleghiamo il controller
    });

    return response.ok;
  } catch (err) {
    return false;
  } finally {
    clearTimeout(timeout); // Puliamo il timeout
    const end = performance.now();
    const duration = end - start;
    console.log(
      "Finito il controllo della connessione in " +
        Math.round(duration) +
        " millisecondi."
    );
  }
}
