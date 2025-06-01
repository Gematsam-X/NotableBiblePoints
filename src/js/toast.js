// Coda dei toast in attesa
const toastQueue = [];
let isToastVisible = false;

export default function toast(message, duration = 3000) {
  toastQueue.push({ message, duration });
  processQueue();
}

function processQueue() {
  if (isToastVisible || toastQueue.length === 0) return;

  const { message, duration } = toastQueue.shift();
  isToastVisible = true;

  console.log("Toast in arrivo:", message);

  const toast = document.createElement("div");
  toast.classList.add("toast");
  toast.textContent = message;

  function isOnPage(page) {
    return window.location.href.split("/").pop() === page;
  }

  if (
    isOnPage("notes.html") &&
    document.querySelector(".modal")?.style.display == "block"
  ) {
    document.querySelector(".modal")?.appendChild(toast);
  } else if (isOnPage("notes.html")) {
    document.querySelector(".notesContainer")?.appendChild(toast);
  } else if (isOnPage("login.html")) {
    document.querySelector(".container")?.appendChild(toast);
  } else {
    document.body.appendChild(toast);
  }

  // Aggiunge la classe per farlo comparire con animazione
  setTimeout(() => toast.classList.add("show"), 10);

  // Funzione per nasconderlo
  const hideToast = () => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
      isToastVisible = false;
      processQueue(); // Procede con il prossimo toast in coda
    }, 500); // attende la transizione di uscita
  };

  const timeout = setTimeout(hideToast, duration);

  toast.addEventListener("click", () => {
    clearTimeout(timeout);
    hideToast();
  });
}
