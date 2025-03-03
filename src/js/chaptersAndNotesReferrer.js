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
