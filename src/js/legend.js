import { themeToggleSwitch } from "/src/js/theme.js";

themeToggleSwitch?.addEventListener("click", toggleImages);

const categories = {
  avatar: ["/src/assets/avatar/light.webp", "/src/assets/avatar/dark.webp"],
  deleteAccount: [
    "/src/assets/account/delete/light.webp",
    "/src/assets/account/delete/dark.webp",
  ],
  deleteNote: [
    "/src/assets/notes/delete/light.webp",
    "/src/assets/notes/delete/dark.webp",
  ],
  edit: [
    "/src/assets/notes/edit/light.webp",
    "/src/assets/notes/edit/dark.webp",
  ],
  share: [
    "/src/assets/notes/share/light.webp",
    "/src/assets/notes/share/dark.webp",
  ],
  logout: [
    "/src/assets/account/logout/light.webp",
    "/src/assets/account/logout/dark.webp",
  ],
  refreshNotes: [
    "/src/assets/notes/refresh/light.webp",
    "/src/assets/notes/refresh/dark.webp",
  ],
  restoreBackup: [
    "/src/assets/account/backup/restore/light.webp",
    "/src/assets/account/backup/restore/dark.webp",
  ],
  createBackup: [
    "/src/assets/account/backup/create/light.webp",
    "/src/assets/account/backup/create/dark.webp",
  ],
  lens: ["/src/assets/lens/light.webp", "/src/assets/lens/dark.webp"],
  help: ["/src/assets/help/light.webp", "/src/assets/help/dark.webp"],
  github: ["/src/assets/github/light.webp", "/src/assets/github/dark.webp"],
  openDrawer: [
    "/src/assets/drawer/open/light.webp",
    "/src/assets/drawer/open/dark.webp",
  ],
  otherApps: [
    "/src/assets/drawer/otherApps/light.webp",
    "/src/assets/drawer/otherApps/dark.webp",
  ],
  rightArrow: [
    "/src/assets/drawer/rightArrow/light.webp",
    "/src/assets/drawer/rightArrow/dark.webp",
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
