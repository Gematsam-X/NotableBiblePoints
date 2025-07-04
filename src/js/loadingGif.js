const loadingModalElement = document.createElement("div");

loadingModalElement.classList.add("loadingModal");

const loadingModalContent = document.createElement("div");
loadingModalContent.classList.add("loadingModalContent");
loadingModalContent.innerHTML =
  "<img src='/src/assets/loadingGif/loading.gif'>";

document.body.appendChild(loadingModalElement);
loadingModalElement.appendChild(loadingModalContent);

const mod = document.querySelector(".loadingModal");

export function showGif() {
  mod.style.display = "block";
  mod.style.visibility = "visible";
}

export function hideGif() {
  mod.style.display = "none";
  mod.style.visibility = "hidden";
}
