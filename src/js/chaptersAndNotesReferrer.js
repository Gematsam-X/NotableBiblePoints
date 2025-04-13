if (
  !sessionStorage.getItem("selectedBook") ||
  (window.location.href.split("/").pop() === "notes.html" &&
    !sessionStorage.getItem("selectedChapter"))
) {
  window.location.href = "main.html";
}

const referrer = document.referrer.split("/").pop();

if (
  referrer !== "main.html" &&
  referrer !== "chapters.html" &&
  referrer !== "notes.html"
) {
  console.warn("Referrer per la pagina non valido:", document.referrer);
  sessionStorage.removeItem("selectedBook");
  window.location.href = "main.html";
}

if (
  window.location.href.split("/").pop() === "notes.html" &&
  sessionStorage.getItem("selectedNoteId")
) {
  const selectedId = sessionStorage.getItem("selectedNoteId");

  const tryScroll = () => {
    const note = document.querySelector(`.note[data-id="${selectedId}"]`);
    if (note) {
      const top = note.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: "smooth" });
      sessionStorage.removeItem("selectedNoteId");
      return true;
    }
    return false;
  };

  // Prima prova diretta
  if (!tryScroll()) {
    // Se non esiste ancora, osserva il DOM per cambiamenti
    const observer = new MutationObserver(() => {
      if (tryScroll()) observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
}
