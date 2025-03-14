import toast from "./toast.js";
import { showGif, hideGif } from "./loadingGif.js";

export async function deleteCurrentUser() {
  try {
    const currentUser = await Backendless.UserService.getCurrentUser();

    if (!currentUser) {
      toast("Nessun utente loggato.");
      return;
    }

    showGif();

    const confirmDelete = confirm(
      "Questa azione è irreversibile e cancella tutti i dati associati a questo account. Sei sicuro di voler proseguire ed eliminare il tuo account?"
    );

    if (!confirmDelete) return;

    // Elimina tutti i dati associati all'utente nella tabella "NotableBiblePoints"
    const userEmail = localStorage.getItem("userEmail");
    const queryBuilder = Backendless.DataQueryBuilder.create().setWhereClause(
      `NotablePoints LIKE '%${userEmail}%'`
    );
    const recordToDelete = await Backendless.Data.of("NotableBiblePoints").find(
      queryBuilder
    );
    console.log(recordToDelete);
    await Backendless.Data.of("NotableBiblePoints").remove(
      recordToDelete.objectId
    );

    await Backendless.Data.of("Users").remove(currentUser.objectId);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userToken");
    toast("Account eliminato con successo.");

    await Backendless.UserService.logout();

    window.location.href = "login.html";
  } catch (error) {
    console.error("Errore nella cancellazione dell'account:", error);
    toast("Errore durante l'eliminazione dell'account: " + error.message);
  } finally {
    hideGif();
  }
}

export async function logoutUser(showAlert = true) {
  if (showAlert) showGif();
  try {
    // Logout the user
    await Backendless.UserService.logout();
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userToken");
    window.location.href = "login.html";
  } catch (error) {
    console.error("Errore nel logout:", error);
    toast("Errore durante il logout: " + error.message, 4000);
  } finally {
    hideGif();
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
