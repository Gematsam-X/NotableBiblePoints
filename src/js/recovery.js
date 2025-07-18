import backendlessRequest from "/src/js/backendlessRequest.js";
import { hideGif, showGif } from "/src/js/loadingGif.js";
import toast from "/src/js/toast.js";

const modal = document.querySelector(".modal");

document.querySelector("#recovery").addEventListener("click", () => {
  modal.style.display = "block";
});

document.querySelector(".closeModal").addEventListener("click", () => {
  modal.style.display = "none";
  document.querySelector("#emailForRecovery").value = ""; // Pulisce il campo email
});

document
  .querySelector("#recoveryBtn")
  .addEventListener("click", async (event) => {
    event.preventDefault(); // Evita il refresh della pagina
    recoveryPassword();
  });

async function recoveryPassword() {
  const email = document.querySelector("#emailForRecovery").value.trim();

  if (!email) {
    toast(
      "Inserisci la mail con la quale ti sei registrato su NotableBiblePoints. Se non hai ancora effettuato la registrazione, puoi farlo accedendo all'apposita sezione chiudendo questa finestra.",
      4100
    );
    return;
  }

  modal.style.display = "none";
  document.querySelector("#emailForRecovery").value = ""; // Pulisce il campo email

  showGif();

  try {
    const users = await backendlessRequest("queryUsersByEmail", {
      email: email,
    });

    if (!users || users.length === 0) {
      toast(
        "Nessun utente trovato con questa email. Puoi registrarti accedendo all'apposita sezione chiudendo questa finestra.",
        3400
      );
      return;
    }

    const user = users[0]; // Seleziona il primo utente trovato
    console.log("Utente trovato:", user);

    // Invio dell'email per il recupero della password
    await backendlessRequest("recoverPassword", { email: email });

    toast(
      "Ti è stata inviata un'email per il recupero della password. Clicca sul link contenuto nella mail per procedere.",
      4500
    );
  } catch (error) {
    console.error("Errore durante il recupero dell'utente:", error);
    toast("Si è verificato un errore. Riprova più tardi.", 4100);
  } finally {
    hideGif();
  }
}
