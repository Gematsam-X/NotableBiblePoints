import { logoutUser } from "/src/js/logoutAndDelete.js";

// Recupero delle credenziali salvate
const userEmail = localStorage.getItem("userEmail");
const userToken = localStorage.getItem("userToken");

if (userEmail && userToken) {
  try {
    if (localStorage.getItem("isAuthenticated") === "true") {
      // Se l'utente sta effettuando il login ma è già autenticato, salta il login e reindirizza alla home
      if (window.location.pathname.split("/").pop() === "login.html")
        window.location.href = "/index.html";
    } else {
      // Se l'utente non è autenticato, esegui il logout e reindirizza
      if (window.location.pathname.split("/").pop() !== "login.html")
        logoutUser();
    }
  } catch (error) {
    console.error("Errore nel recupero dell'utente:", error);
    // In caso di errore, esegui il logout
    if (window.location.pathname.split("/").pop() !== "login.html")
      logoutUser(false);
  }
} else {
  // Se non ci sono dati salvati, esegui il logout
  localStorage.setItem("isAuthenticated", "false");
  if (
    window.location.pathname.split("/").pop() !== "login.html" &&
    window.location.pathname.split("/").pop() !== "accessRestricted.html"
  )
    window.location.href = "/src/html/login.html";
}

sessionStorage.setItem("scriptExecuted", "true");
