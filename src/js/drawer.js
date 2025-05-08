import checkVersion from "./checkVersion.js";
import toast from "./toast.js";

const drawer = document.querySelector(".drawer");
const drawerContent = document.querySelector(".drawer-content");

function showDrawer() {
  drawer.style.display = "block";
  window.setTimeout(() => {
    drawerContent.classList.add("open"); // Anima il contenuto
  }, 10); // Ritardo per permettere il rendering
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  drawerContent.classList.remove("open");
  window.setTimeout(() => {
    drawer.style.display = "none";
    document.body.style.overflow = "auto";
  }, 500); // Tempo corrispondente alla durata della transizione
}

function handleOpenDrawerClick() {
  if (drawer.style.display === "block") {
    closeDrawer();
  } else {
    showDrawer();
  }
}

document.addEventListener("click", (e) => {
  if (e.target === drawer && drawer.style.display === "block") {
    closeDrawer();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDrawer();
});

document
  .querySelector(".openDrawer")
  .addEventListener("click", handleOpenDrawerClick);

document.querySelector("#username").innerText =
  localStorage.getItem("userEmail");

document.querySelector("#drawer-account").addEventListener("click", () => {
  window.location.href = "account.html";
});

document.querySelector("#share-app").addEventListener("click", () => {
  const shareData = {
    title: "NotableBiblePoints - Salva i punti notevoli",
    text: "NotableBiblePoints ti permette di salvare i punti notevoli della Bibbia e di sincronizzarli tra i vari dispositivi. Provala subito!",
    url: "https://gematsam-x.github.io/NotableBiblePoints/",
  };

  navigator.share(shareData).catch((e) => {
    console.error("Errore durante la condivisione:", e);
    toast(`Errore durante la condivisione: ${e.message}`);
  });
});

document.querySelector("#other-apps").addEventListener("click", () => {
  window.location.href = "https://gematsamx.webnode.it/alcuni-miei-progetti/";
});

document.querySelector("#appVersion").innerText =
  localStorage.getItem("appVersion");

document
  .querySelector("#drawer-footer-version")
  .addEventListener("click", checkVersion);
