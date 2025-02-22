export async function deleteCurrentUser() {
  try {
    const currentUser = await Backendless.UserService.getCurrentUser();

    if (!currentUser) {
      alert("Nessun utente loggato.");
      return;
    }

    const confirmDelete = confirm(
      "Questa azione è irreversibile e cancella tutti i dati associati a questo account. Sei sicuro di voler proseguire ed eliminare il tuo account?"
    );

    if (!confirmDelete) return;

    await Backendless.UserService.remove(currentUser);
    alert("Account eliminato con successo.");

    await Backendless.UserService.logout();

    window.location.href = "login.html";
  } catch (error) {
    console.error("Errore nella cancellazione dell'account:", error);
    alert("Errore durante l'eliminazione dell'account: " + error.message);
  }
}

export async function logoutUser() {
  try {
    // Logout the user
    await Backendless.UserService.logout();
    alert("Logout effettuato con successo.");
    redirectToOriginPage();
  } catch (error) {
    console.error("Errore nel logout:", error);
    alert("Errore durante il logout: " + error.message);
  }
}

export async function redirectToOriginPage() {
  function findValidHistoryEntry() {
    return new Promise((resolve) => {
      let attempts = 0;
      let found = false;

      const checkHistory = () => {
        if (
          document.referrer.startsWith(window.location.origin) &&
          document.referrer !== window.location.href
        ) {
          found = true;
          resolve(document.referrer);
        } else {
          attempts++;
          if (attempts > 10) resolve(null); // Evita loop infiniti
          else history.back();

          setTimeout(() => {
            if (!found) checkHistory();
          }, 100); // Aspetta che la cronologia cambi
        }
      };

      checkHistory();
    });
  }

  if (localStorage.getItem("isAuthenticated") == "false") {
    window.location.href = "login.html";
    return;
  }

  const previousPage = await findValidHistoryEntry();

  if (previousPage) {
    localStorage.setItem("isAuthenticathed", "true");
    console.log("Ritornando a " + previousPage);
    window.location.href = previousPage;
  } else {
    window.location.href = "login.html";
  }
}
