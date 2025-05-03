const instructions = () => {
  const os = navigator.userAgent.toLowerCase();
  if (os.includes("ipad") || os.includes("iphone") || os.includes("ipod")) {
    return 'cliccando sul pulsante di condivisione in alto a destra, quindi sulla voce "Aggiungi alla schermata Home", e successivamente su "Aggiungi"';
  } else {
    return 'cliccando sui tre puntini in alto a destra, quindi sulla voce "Aggiungi a schermata Home", e successivamente su "Installa"';
  }
};

document.getElementById("instruction-by-os").innerText = `${instructions()}`;
