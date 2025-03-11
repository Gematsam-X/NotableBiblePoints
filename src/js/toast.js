export default function toast(message, duration = 3000) {
  // Creazione del contenitore del toast
  const toast = document.createElement("div");
  toast.classList.add("toast");
  toast.textContent = message;

  function checkLocation() {
    return window.location.href.split("/").pop() == "notes.html";
  }

  if (checkLocation()) {
    document.querySelector(".notesContainer").appendChild(toast);
  } else {
    // Aggiunta del toast alla pagina
    document.body.appendChild(toast);
  }

  let shouldRemove = true;

  function hideToast() {
    // Rimozione dopo la durata specificata
    setTimeout(() => {
      if (shouldRemove) {
        toast.style.opacity = "0";
        setTimeout(() => {
          if (!checkLocation()) document.body.removeChild(toast);
          else document.querySelector(".notesContainer").removeChild(toast);
        }, 500);
      }
    }, duration);
  }

  document.addEventListener("click", (e) => {
    if (e.target != toast && toast.parentElement == document.body) {
      shouldRemove = false;
      document.body.removeChild(toast);
    }
  });

  if (shouldRemove) hideToast();
}
