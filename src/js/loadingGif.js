// Crea l'elemento modale principale
const loadingModalElement = document.createElement("div");
loadingModalElement.classList.add("loadingModal");

// Crea il contenitore dell'animazione
const loadingModalContent = document.createElement("div");
loadingModalContent.classList.add("loadingModalContent");

// Inserisci lo spinner direttamente con HTML + CSS inline
loadingModalContent.innerHTML = `
  <div class="loadingGif"></div>

  <style>
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
`;

// Appendi la modale al body
document.body.appendChild(loadingModalElement);
loadingModalElement.appendChild(loadingModalContent);

// Imposta uno stile base da CSS (senza fogli esterni) per nascondere inizialmente

// Funzioni per mostrare/nascondere la modale
export function showGif() {
  loadingModalElement.style.display = "flex";
}

export function hideGif() {
  loadingModalElement.style.display = "none";
}
