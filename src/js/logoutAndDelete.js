import backendlessRequest from "./backendlessRequest.js";
import { deleteValue } from "/src/js/indexedDButils.js"; // Importiamo le funzioni per IndexedDB
import { hideGif, showGif } from "/src/js/loadingGif.js";
import toast from "/src/js/toast.js";

export async function deleteCurrentUser() {
  try {
    showGif();

    const confirmDelete = confirm(
      "Questa azione è irreversibile e cancella tutti i dati associati a questo account. Sei sicuro di voler proseguire ed eliminare il tuo account?"
    );

    if (!confirmDelete) {
      hideGif();
      return;
    }

    // Recupera l'email
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      toast("Errore: email utente non trovata.");
      hideGif();
      return;
    }

    // Recupera l'oggetto JSON dalla tabella NotableBiblePoints
    const result =
      (await backendlessRequest(
        "notes:get",
        {
          email: userEmail,
        },
        localStorage.getItem("userToken")
      )) || [];

    if (!result) {
      toast("Errore: dati non trovati.");
      hideGif();
      return;
    }

    await backendlessRequest(
      "notes:delete",
      {
        email: userEmail,
        ids: result.map(({ id }) => id),
      },
      localStorage.getItem("userToken")
    );

    // Rimuovi l'utente dalla tabella Users
    console.log("Eliminazione utente con ID:", localStorage.getItem("userId"));
    await backendlessRequest("deleteUser", {
      objectId: localStorage.getItem("userId"),
    });

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
    await backendlessRequest("logout");

    // Rimuoviamo i dati relativi all'utente da IndexedDB
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("userToken");
    await deleteValue("userNotes");
    await deleteValue("userNotesByTag");
    await deleteValue("deletedNotes");

    window.location.href = "/src/html/login.html";
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
    window.location.href = "/src/html/login.html";
    return;
  }

  const previousPage = await findValidHistoryEntry();

  if (previousPage) {
    console.log("Ritornando a " + previousPage);
    window.location.href = previousPage;
  } else {
    window.location.href = "/src/html/login.html";
  }
}
