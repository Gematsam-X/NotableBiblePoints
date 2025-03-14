export default function toast(message, duration = 3000) {
  console.log("Toast chiamato con il messaggio:", message); // Aggiungi questo log per il debug

  const toast = document.createElement("div");
  toast.classList.add("toast");
  toast.textContent = message;

  function isOnNotesPage() {
    return window.location.href.split("/").pop() == "notes.html";
  }

  function isOnLoginPage() {
    return window.location.href.split("/").pop() == "login.html";
  }

  if (isOnNotesPage()) {
    document.querySelector(".notesContainer").appendChild(toast);
  } else if (isOnLoginPage()) {
    document.querySelector(".container").appendChild(toast);
  } else {
    // Aggiunta del toast alla pagina
    document.body.appendChild(toast);
  }

  let shouldRemove = true;

  // Funzione per nascondere il toast dopo il tempo specificato
  function hideToast() {
    // Diamo il tempo per vedere il toast prima di rimuoverlo
    setTimeout(() => {
      if (shouldRemove) {
        toast.style.opacity = "0"; // Inizia la transizione di opacità
        setTimeout(() => {
          // Rimuove il toast dal DOM dopo la transizione
          document.removeChild(toast);
        }, 500); // Tempo di transizione della scomparsa
      }
      console.log("Toast rimosso");
    }, duration); // Questo è il tempo in cui il toast sarà visibile
  }

  // Nascondiamo il toast dopo la durata
  if (shouldRemove) {
    hideToast();
  }

  // Gestione della rimozione manuale del toast se cliccato
  document.addEventListener("click", (e) => {
    if ((e.target != toast.parentElement) == document.body) {
      shouldRemove = false;
      document.body.removeChild(toast); // Rimuove subito il toast se cliccato
    }
  });
}
