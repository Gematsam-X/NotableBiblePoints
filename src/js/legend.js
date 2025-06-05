import { themeToggleSwitch } from "./theme.js";

themeToggleSwitch?.addEventListener("click", toggleImages);

function fixPath(path) {
  if (window.location.href.split("/").pop() === "index.html")
    return path.replace("../", "");
  return path;
}

const categories = {
  avatar: [
    fixPath("../assets/avatar/light.webp"),
    fixPath("../assets/avatar/dark.webp"),
  ],
  deleteAccount: [
    fixPath("../assets/account/delete/light.webp"),
    fixPath("../assets/account/delete/dark.webp"),
  ],
  deleteNote: [
    fixPath("../assets/notes/delete/light.webp"),
    fixPath("../assets/notes/delete/dark.webp"),
  ],
  edit: [
    fixPath("../assets/notes/edit/light.webp"),
    fixPath("../assets/notes/edit/dark.webp"),
  ],
  share: [
    fixPath("../assets/notes/share/light.webp"),
    fixPath("../assets/notes/share/dark.webp"),
  ],
  logout: [
    fixPath("../assets/account/logout/light.webp"),
    fixPath("../assets/account/logout/dark.webp"),
  ],
  refreshNotes: [
    fixPath("../assets/notes/refresh/light.webp"),
    fixPath("../assets/notes/refresh/dark.webp"),
  ],
  restoreBackup: [
    fixPath("../assets/account/backup/restore/light.webp"),
    fixPath("../assets/account/backup/restore/dark.webp"),
  ],
  createBackup: [
    fixPath("../assets/account/backup/create/light.webp"),
    fixPath("../assets/account/backup/create/dark.webp"),
  ],
  lens: [
    fixPath("../assets/lens/light.webp"),
    fixPath("../assets/lens/dark.webp"),
  ],
  help: [
    fixPath("../assets/help/light.webp"),
    fixPath("../assets/help/dark.webp"),
  ],
  github: [
    fixPath("../assets/github/light.webp"),
    fixPath("../assets/github/dark.webp"),
  ],
  openDrawer: [
    fixPath("../assets/drawer/open/light.webp"),
    fixPath("../assets/drawer/open/dark.webp"),
  ],
  otherApps: [
    fixPath("../assets/drawer/otherApps/light.webp"),
    fixPath("../assets/drawer/otherApps/dark.webp"),
  ],
  rightArrow: [
    fixPath("../assets/drawer/rightArrow/light.webp"),
    fixPath("../assets/drawer/rightArrow/dark.webp"),
  ],
  update: [
    fixPath("../assets/drawer/update/light.webp"),
    fixPath("../assets/drawer/update/dark.webp"),
  ]
};

console.log("categories", categories);

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
