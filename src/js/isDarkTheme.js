let isDarkTheme = false;

function getTheme() {
  if (
    localStorage.getItem("theme") === "dark" &&
    document.body.classList.contains("dark-theme")
  ) {
    isDarkTheme = true;
  } else {
    isDarkTheme = false;
  }
  console.log(
    localStorage.getItem("theme"),
    document.body.classList.contains("dark-theme"),
    document.body.classList
  );
  return isDarkTheme;
}

const themeToggle = document.querySelector(".theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    getTheme();
    // Puoi aggiungere qui qualsiasi altra logica che deve essere eseguita quando il tema cambia
  });
}

// Imposta il tema iniziale quando la pagina viene caricata
getTheme();

export { isDarkTheme };
