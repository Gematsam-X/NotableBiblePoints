document
  .querySelector(".account")
  .addEventListener("click", () => (window.location.href = "account.html"));
document.addEventListener("DOMContentLoaded", () => {
  const booksCells = document.querySelectorAll(".periodic-table td");

  booksCells.forEach((cell) => {
    cell.addEventListener("click", () => {
      const bookName = cell.dataset.name; // Prendiamo il nome dal data-name
      sessionStorage.setItem("selectedBook", bookName); // Salviamo in sessionStorage
      window.location.href = "chapters.html"; // Reindirizziamo alla pagina dei capitoli
    });
  });
});
