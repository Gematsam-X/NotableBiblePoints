import "/src/styles.css";

if (
  !sessionStorage.getItem("selectedBook") ||
  ((window.location.href.split("/").pop() === "notes.html" ||
    window.location.href.split("/").pop() === "notesbytag.html") &&
    !sessionStorage.getItem("selectedChapter"))
) {
  window.location.href = "/index.html";
}

const referrer = document.referrer.toLowerCase().split("/").pop();

if (
  referrer !== "index.html" &&
  !document.referrer.endsWith("/") &&
  referrer !== "chapters.html" &&
  referrer !== "notes.html" &&
  referrer !== "notesbytag.html" &&
  referrer !== "notesbytag" &&
  referrer !== "tags.html"
) {
  console.warn("Referrer per la pagina non valido:", document.referrer);
  sessionStorage.removeItem("selectedBook");
  sessionStorage.removeItem("selectedChapter");
  sessionStorage.removeItem("filteringTag");
  window.location.href = "/index.html";
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

if (
  window.location.href.toLowerCase().split("/").pop() != "notesbytag" &&
  window.location.href.toLowerCase().split("/").pop() != "notesbytag.html"
)
  sessionStorage.removeItem("filteringTag");
