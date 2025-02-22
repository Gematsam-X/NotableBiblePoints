if (
  localStorage.getItem("isAuthenticated") === "true" &&
  document.referrer !== document.location.href
) {
  console.log(
    "Autenticato, ritorno alla pagina precedente" + document.referrer
  );
  window.location.href = document.referrer;
} else {
  console.log("Non autenticato, resto al 401");
  localStorage.setItem("isAuthenticated", "false");
}
