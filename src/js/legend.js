import { themeToggleButton } from "./theme.js";

if (!themeToggleButton) {
  console.error("Theme toggle button not found");
} else {
  themeToggleButton.addEventListener("click", toggleImages);
}

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
};

let index = localStorage.getItem("theme") === "dark" ? 1 : 0;

function updateImgs() {
  for (const [category, images] of Object.entries(categories)) {
    const imgElementsById = document.getElementById(`${category}_img`);
    if (imgElementsById) {
      imgElementsById.src = images[index];
    }

    const imgElementsByClass = document.getElementsByClassName(
      `${category}_img`
    );
    for (const imgElement of imgElementsByClass) {
      imgElement.src = images[index];
    }
  }
}

function toggleImages() {
  index = index === 0 ? 1 : 0;
  updateImgs();
}

if (themeToggleButton) {
  themeToggleButton.addEventListener("click", toggleImages);
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
