export default function toast(message, duration = 3000) {
  // Controlla se c'è già un toast visibile nel DOM
  if (!document.querySelector(".toast")) {
    console.log("Toast chiamato con il messaggio:", message);

    const toast = document.createElement("div");
    toast.classList.add("toast");
    toast.textContent = message;

    document.body.appendChild(toast);

    // Aggiungiamo la classe per la transizione dopo un breve ritardo
    setTimeout(() => toast.classList.add("show"), 10);

    // Funzione per nascondere il toast
    const hideToast = () => {
      toast.classList.remove("show"); // Animazione di uscita
      setTimeout(() => toast.remove(), 500); // Attendi la transizione CSS prima di rimuoverlo
    };

    const timeout = setTimeout(hideToast, duration);

    // Rimuove il toast immediatamente se cliccato
    toast.addEventListener("click", () => {
      clearTimeout(timeout);
      hideToast();
    });
  } else {
    console.warn("Toast non mostrato perchè c'è già un altro toast attivo.");
  }
}
