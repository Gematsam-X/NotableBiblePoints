const referrer = document.referrer;
const allowedPages = [
  "login.html",
  "accessRestricted.html",
  "main.html",
  "chapters.html",
  "account.html",
];

// Controlla se il referrer è valido
const isAllowed = allowedPages.some((allowedPage) =>
  referrer.includes(allowedPage)
);

let shouldRedirect = null;

if (
  window.location.href === "main.html" &&
  document.referrer === "chapters.html"
) {
  shouldRedirect = false;
}
if (
  referrer === "login.html" ||
  isAllowed ||
  localStorage.getItem("isAuthenticated") == "true"
) {
  shouldRedirect = false;
  localStorage.setItem("isAuthenticated", "true");
  console.log("Utente già autenticato o provenienza dalla pagina di login.");
}

if (!isAllowed || localStorage.getItem("isAuthenticated") !== "true") {
  // Se il referrer non è tra quelli consentiti, reindirizza alla pagina di errore
  console.warn("Referrer non valido o utente non autenticato.");
  window.location.href = "accessRestricted.html";
}
