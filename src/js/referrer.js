const referrer = document.referrer;
const allowedPages = [
  "login.html",
  "accessRestricted.html",
  "index.html",
  "chapters.html",
  "account.html",
];

// Controlla se il referrer è valido
const isAllowed = allowedPages.some(
  (allowedPage) =>
    referrer.includes(allowedPage) &&
    document.referrer.startsWith(window.location.origin)
);

if (localStorage.getItem("isAuthenticated") != "true") {
  let shouldRedirect = null;

  if (
    window.location.href === "index.html" &&
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
}
