if (
  !sessionStorage.getItem("selectedBook") ||
  (window.location.href.split("/").pop() === "notes.html" &&
    !sessionStorage.getItem("selectedChapter"))
) {
  window.location.href = "main.html";
}

if (
  document.referrer.split("/").pop() !== "main.html" &&
  document.referrer.split("/").pop() !== "chapters.html" &&
  document.referrer.split("/").pop() !== "notes.html"
) {
  console.warn("Referrer per la pagina non valido:", document.referrer);
  sessionStorage.removeItem("selectedBook");
  window.location.href = "main.html";
}
