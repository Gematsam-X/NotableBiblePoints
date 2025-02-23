if (!sessionStorage.getItem("selectedBook")) {
  window.location.href = "main.html";
}

if (document.referrer.split("/").pop() !== "main.html") {
  console.warn("Referrer per i capitoli non valido:", document.referrer);
  sessionStorage.removeItem("selectedBook");
  window.location.href = "main.html";
}
