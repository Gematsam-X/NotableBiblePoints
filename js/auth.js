import { hideGif, showGif } from "./loadingGif.js";
import toast from "./toast.js";

async function registerUser(email, password) {
  if (password.length < 6) {
    toast("La password deve contenere almeno 6 caratteri.");

    return; // Fermiamo l'esecuzione qui
  }

  console.log("Lunghezza password valida:", password.length);

  showGif();

  const user = new Backendless.User();
  user.email = email.toLowerCase().trim();
  user.password = password;
  user.name = email.toLowerCase().trim(); // Usa l'email come nome utente

  try {
    const registeredUser = await Backendless.UserService.register(user);
    console.log("Utente registrato:", registeredUser);
    toast(`Registrazione riuscita! Controlla la tua email per la conferma.`);
  } catch (error) {
    console.error("Errore durante la registrazione:", error);
    const errMsg = error.message.toLowerCase();

    if (errMsg.includes("already exists")) {
      toast("L'utente è già registrato. Prova ad effettuare il login.");
    } else if (errMsg.includes("session timeout")) {
      toast("Sessione scaduta. Riprova dopo aver riavviato l'app.");
    } else if (
      errMsg.includes("network error") ||
      errMsg.includes("failed to fetch")
    ) {
      toast("Errore di connessione. Controlla la tua rete e riprova.");
    } else if (errMsg.includes("provided email has wrong format")) {
      toast("Inserisci un'email valida.");
    } else {
      toast(error.message);
    }
  } finally {
    hideGif();
  }
}

async function loginUser(email, password) {
  if (!email || !password) {
    toast("Inserisci sia l'email che la password.");
    return;
  }

  showGif();

  try {
    const loggedInUser = await Backendless.UserService.login(
      email,
      password,
      true
    );
    console.log("Utente loggato:", loggedInUser);

    // Salva l'email dell'utente in localStorage
    localStorage.setItem("userEmail", loggedInUser.email);

    // Salva l'utente corrente sul localStorage per mantenerlo loggato
    localStorage.setItem("userToken", loggedInUser["user-token"]);

    window.location.href = "main.html"; // Reindirizza alla pagina principale
  } catch (error) {
    console.error("Errore nel login:", error);
    const errMsg = error.message.toLowerCase();

    if (errMsg.includes("invalid login or password")) {
      toast(
        "Credenziali errate o utente non registrato. Controlla l'email e la password, verifica di essere registrato e riprova."
      );
    } else if (errMsg.includes("password value cannot be empty")) {
      toast("Inserisci la password.", 2000);
    } else if (errMsg.includes("email value cannot be empty")) {
      toast("Inserisci l'email.", 2000);
    } else if (errMsg.includes("email address must be confirmed first")) {
      toast(
        "Conferma il tuo indirizzo email prima di accedere. Puoi farlo accedendo alla tua posta elettronica e cliccando sul link contenuto nella mail da parte di Backendless.",
        5000
      );
    } else if (
      errMsg.includes("network error") ||
      errMsg.includes("failed to fetch")
    ) {
      toast("Errore di connessione. Controlla la tua rete e riprova.");
    } else {
      toast(error.message);
    }
  } finally {
    hideGif();
  }
}

// Aggiunta verifica se i pulsanti esistono prima di aggiungere gli event listener
const signInButton = document.getElementById("signIn");
const signUpButton = document.getElementById("signUp");

if (signInButton) {
  signInButton.addEventListener("click", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    loginUser(email, password);
  });
}

if (signUpButton) {
  signUpButton.addEventListener("click", (e) => {
    e.preventDefault();
    const email = document.getElementById("newEmail").value.trim();
    const password = document.getElementById("newPassword").value.trim();
    registerUser(email, password);
  });
}
