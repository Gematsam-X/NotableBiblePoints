const referrer = document.referrer;
const allowedPages = ["login.html", "accessRestricted.html", "main.html"];

// Controlla se il referrer è valido
const isAllowed = allowedPages.some((allowedPage) =>
  referrer.includes(allowedPage)
);

let shouldRedirect = null;

if (
  referrer === "login.html" ||
  isAllowed ||
  localStorage.getItem("isAuthenticated") == "true"
) {
  shouldRedirect = false;
  localStorage.setItem("isAuthenticated", "true")
  console.log("Utente già autenticato o provenienza dalla pagina di login.");
}

if (!isAllowed || localStorage.getItem("isAuthenticated") !== "true") {
  // Se il referrer non è tra quelli consentiti, reindirizza alla pagina di errore
  localStorage.setItem("isAuthenticated", "false")
  console.warn("Referrer non valido o utente non autenticato.")
  shouldRedirect = true;
  if (shouldRedirect) window.location.href = "accessRestricted.html"; // Modifica con la tua pagina di errore
}
