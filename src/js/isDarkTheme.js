import { themeToggleSwitch } from "/src/js/theme.js";
let isDarkTheme = false;

function getTheme() {
  if (
    localStorage.getItem("theme") === "dark" &&
    document.body.classList.contains("dark-theme")
  ) {
    isDarkTheme = true;
    if (themeToggleSwitch) themeToggleSwitch.checked = true;
  } else {
    isDarkTheme = false;
    if (themeToggleSwitch) themeToggleSwitch.checked = false;
  }
  return isDarkTheme;
}

if (themeToggleSwitch) {
  themeToggleSwitch.addEventListener("click", getTheme);
}
// Imposta il tema iniziale quando la pagina viene caricata
getTheme();

export { isDarkTheme };
