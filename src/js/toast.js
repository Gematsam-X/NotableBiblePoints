export default function toast(message, duration = 3000) {
    // Creazione del contenitore del toast
    const toast = document.createElement("div");
    toast.classList.add("toast")
    toast.textContent = message;
  
    // Aggiunta del toast alla pagina
    document.body.appendChild(toast);
  
    // Rimozione dopo la durata specificata
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => document.body.removeChild(toast), 500);
    }, duration);
  }