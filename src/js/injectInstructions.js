import "/src/styles.css";

const pwaInstructions = () => {
  const os = navigator.userAgent.toLowerCase();
  if (
    os.includes("ipad") ||
    os.includes("iphone") ||
    os.includes("ipod") ||
    os.includes("macintosh")
  ) {
    return 'cliccando sul pulsante di condivisione in alto a destra, quindi sulla voce "Aggiungi alla schermata Home", e successivamente su "Aggiungi"';
  } else {
    return 'cliccando sui tre puntini in alto a destra, quindi sulla voce "Aggiungi a schermata Home", e successivamente su "Installa"';
  }
};

document.getElementById(
  "instructions-by-os"
).innerText = `${pwaInstructions()}`;

const APKinstructions = () => {
  const os = navigator.userAgent.toLowerCase();
  if (os.includes("android")) {
    return `Per poter usare l'applicazione anche offline, è necessario installare l'APK. Scarica l'ultima versione da <a href="https://github.com/Gematsam-X/NotableBiblePoints/releases/latest/download/NotableBiblePoints.apk">qui</a> e installala sul tuo dispositivo Android. Assicurati di abilitare l'installazione da fonti sconosciute nelle impostazioni del tuo dispositivo. Una volta installata, sarà possibile utilizzare l'applicazione normalmente anche offline, dopo il primo login online. Le eventuali modifiche apportate alle proprie note si sincronizzeranno con il cloud appena si riaprirà l'applicazione con una connessione a Internet. Anche se non vuoi installare l'APK, `;
  } else return false;
};

const instructionsForAPK = document.getElementById("istructionsForAPK");

if (instructionsForAPK)
  instructionsForAPK.innerHTML = `${APKinstructions() || ""}`;

const lowerOrUpperCase = document.getElementById("lowerOrUpperCase");

if (lowerOrUpperCase)
  lowerOrUpperCase.innerText = `${APKinstructions() ? "p" : "P"}`;
