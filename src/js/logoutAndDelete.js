import { hideGif, showGif } from "/src/js/loadingGif.js";
import toast from "/src/js/toast.js";
import { getValue, deleteValue } from "/src/js/indexedDButils.js"; // Importiamo le funzioni per IndexedDB
import Backendless from "backendless";

export async function deleteCurrentUser() {
  try {
    const currentUser = await Backendless.UserService.getCurrentUser();
    console.log("Utente attuale:", currentUser);

    if (!currentUser) {
      toast("Nessun utente loggato.");
      return;
    }

    showGif();

    const confirmDelete = confirm(
      "Questa azione è irreversibile e cancella tutti i dati associati a questo account. Sei sicuro di voler proseguire ed eliminare il tuo account?"
    );

    if (!confirmDelete) {
      hideGif();
      return;
    }

    // Recupera l'email dell'utente da IndexedDB
    const userEmail = await getValue("userEmail");
    if (!userEmail) {
      toast("Errore: email utente non trovata.");
      hideGif();
      return;
    }

    // Recupera l'oggetto JSON dalla tabella NotableBiblePoints
    const databaseEntry = await Backendless.Data.of(
      "NotableBiblePoints"
    ).findFirst();

    if (!databaseEntry || !databaseEntry.NotablePoints) {
      toast("Errore: dati non trovati.");
      hideGif();
      return;
    }

    console.log("Dati attuali:", databaseEntry.NotablePoints);

    // Filtra i dati per rimuovere quelli dell'utente
    const updatedNotablePoints = databaseEntry.NotablePoints.filter(
      (entry) => entry.owner !== userEmail
    );

    console.log("Dati aggiornati:", updatedNotablePoints);

    // Aggiorna il database con i dati filtrati
    databaseEntry.NotablePoints = updatedNotablePoints;
    await Backendless.Data.of("NotableBiblePoints").save(databaseEntry);

    // Rimuovi l'utente dalla tabella Users
    console.log("Eliminazione utente con ID:", currentUser.objectId);
    await Backendless.Data.of("Users").remove(currentUser.objectId);

    logoutUser(false);
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
    // Logout dell'utente
    await Backendless.UserService.logout();

    // Rimuoviamo i dati relativi all'utente da IndexedDB
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userToken");
    await deleteValue("userNotes");
    await deleteValue("deletedNotes");

    // Mantenere isAuthenticated in localStorage
    localStorage.removeItem("userNotes");
    localStorage.removeItem("deletedNotes");
    window.location.href = "/src/html//src/html/login.html";
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

  const isAuthenticated = localStorage.getItem("isAuthenticated");

  if (isAuthenticated === "false") {
    window.location.href = "/src/html//src/html/login.html";
    return;
  }

  const previousPage = await findValidHistoryEntry();

  if (previousPage) {
    console.log("Ritornando a " + previousPage);
    window.location.href = previousPage;
  } else {
    window.location.href = "/src/html//src/html/login.html";
  }
}