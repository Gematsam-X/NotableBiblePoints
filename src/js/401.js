import { redirectToOriginPage } from "./logoutAndDelete.js";

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (
      localStorage.getItem("isAuthenticated") === "true" &&
      sessionStorage.getItem("scriptExecuted") === "true"
    ) {
      redirectToOriginPage();
    } else {
      console.log(
        "Gli script sono stati eseguiti?",
        sessionStorage.getItem("scriptExecuted")
      );
      console.log("Referrer:", document.referrer);
      console.log(
        "L'utente è autenticato?",
        localStorage.getItem("isAuthenticated")
      );
      console.log("Non autenticato, resto al 401");
      console.log(localStorage.getItem("isAuthenticated"));
    }
  }, 500);
});
