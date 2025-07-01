import { themeToggleSwitch } from "/src/js/theme.js";

themeToggleSwitch?.addEventListener("click", toggleImages);

const categories = {
  avatar: ["../assets/avatar/light.webp", "../assets/avatar/dark.webp"],
  deleteAccount: [
    "../assets/account/delete/light.webp",
    "../assets/account/delete/dark.webp",
  ],
  deleteNote: [
    "../assets/notes/delete/light.webp",
    "../assets/notes/delete/dark.webp",
  ],
  edit: ["../assets/notes/edit/light.webp", "../assets/notes/edit/dark.webp"],
  share: [
    "../assets/notes/share/light.webp",
    "../assets/notes/share/dark.webp",
  ],
  logout: [
    "../assets/account/logout/light.webp",
    "../assets/account/logout/dark.webp",
  ],
  refreshNotes: [
    "../assets/notes/refresh/light.webp",
    "../assets/notes/refresh/dark.webp",
  ],
  restoreBackup: [
    "../assets/account/backup/restore/light.webp",
    "../assets/account/backup/restore/dark.webp",
  ],
  createBackup: [
    "../assets/account/backup/create/light.webp",
    "../assets/account/backup/create/dark.webp",
  ],
  lens: ["../assets/lens/light.webp", "../assets/lens/dark.webp"],
  help: ["../assets/help/light.webp", "../assets/help/dark.webp"],
  github: ["../assets/github/light.webp", "../assets/github/dark.webp"],
  openDrawer: ["../assets/drawer/open/light.webp", "../assets/drawer/open/dark.webp"],
  otherApps: [
    "../assets/drawer/otherApps/light.webp",
    "../assets/drawer/otherApps/dark.webp",
  ],
  rightArrow: [
    "../assets/drawer/rightArrow/light.webp",
    "../assets/drawer/rightArrow/dark.webp",
  ],
};

let index = localStorage.getItem("theme") === "dark" ? 1 : 0;

function updateImgs() {
  for (const [category, images] of Object.entries(categories)) {
    // Gestione dell'immagine per ID (singolo elemento)
    const imgElementById = document.getElementById(`${category}_img`);
    if (imgElementById) {
      // Controllo se c'è l'attributo data-flipped-src e se è true
      const flipped =
        imgElementById.getAttribute("data-flipped-src") === "true";
      // Se è flipped, usiamo un'immagine diversa
      imgElementById.src = flipped ? images[1 - index] : images[index];
    }

    // Gestione delle immagini per classe (potrebbero essere più elementi)
    const imgElementsByClass = document.getElementsByClassName(
      `${category}_img`
    );
    for (const imgElement of imgElementsByClass) {
      const flipped = imgElement.getAttribute("data-flipped-src") === "true";
      imgElement.src = flipped ? images[1 - index] : images[index];
    }
  }
}

function toggleImages() {
  index = index === 0 ? 1 : 0;
  updateImgs();
}

if (themeToggleSwitch) {
  themeToggleSwitch.addEventListener("click", toggleImages);
}

document.addEventListener("DOMContentLoaded", updateImgs);

// MutationObserver to detect dynamically added images
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.tagName === "IMG") {
          const category = Object.keys(categories).find(
            (cat) =>
              node.id.includes(cat) || node.classList.contains(`${cat}_img`)
          );
          if (category) {
            node.src = categories[category][index];
          }
        }
      });
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });
