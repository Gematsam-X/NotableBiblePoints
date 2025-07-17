import backendlessRequest from "./backendlessRequest.js";
import { hideGif, showGif } from "/src/js/loadingGif.js";
import toast from "/src/js/toast.js";

async function registerUser(email, password) {
  if (password.length < 6) {
    toast("La password deve contenere almeno 6 caratteri.");
    return;
  }

  console.log("Lunghezza password valida:", password.length);
  showGif();

  const formattedEmail = email.toLowerCase().trim();

  try {
    const registeredUser = await backendlessRequest("register", {
      email: formattedEmail,
      password,
      name: formattedEmail, // puoi modificare se vuoi un nome diverso
    });

    console.log("Utente registrato:", registeredUser);
    toast(
      "Registrazione riuscita! Adesso effettua il login con l'email e la password appena impostati."
    );
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
    const loggedInUser = await backendlessRequest("login", {
      email: email.toLowerCase().trim(),
      password: password.trim(),
    });

    // ⚠️ Verifica che loggedInUser sia valido
    if (
      !loggedInUser ||
      !loggedInUser.email ||
      !loggedInUser["user-token"] ||
      !loggedInUser.encryptedEmail
    ) {
      throw new Error("Risposta inattesa dal server.");
    }

    // Salva userToken e email criptata
    localStorage.setItem("userToken", loggedInUser["user-token"]);

    localStorage.setItem("userEmail", loggedInUser.encryptedEmail);
    localStorage.setItem("userId", loggedInUser.objectId);
    localStorage.setItem("isAuthenticated", "true");

    window.location.href = "/index.html";
  } catch (error) {
    console.error("Errore nel login:", error);
    const msg = (error.message || "").toLowerCase();

    if (msg.includes("invalid login or password")) {
      toast("Credenziali errate o utente non registrato.");
    } else if (msg.includes("password value cannot be empty")) {
      toast("Inserisci la password.");
    } else if (msg.includes("email value cannot be empty")) {
      toast("Inserisci l'email.");
    } else if (msg.includes("email address must be confirmed")) {
      toast("Conferma la tua email tramite il link nella mail di verifica.");
    } else if (
      msg.includes("network error") ||
      msg.includes("failed to fetch")
    ) {
      toast("Errore di rete. Controlla la connessione.");
    } else {
      toast("Errore: " + error.message);
    }
  } finally {
    hideGif();
  }
}

// Aggiunta verifica se i pulsanti esistono prima di aggiungere gli event listener
const signInButton = document.getElementById("signIn");
const signUpButton = document.getElementById("signUp");

signInButton?.addEventListener("click", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  loginUser(email, password);
});

signUpButton?.addEventListener("click", (e) => {
  e.preventDefault();
  const email = document.getElementById("newEmail").value.trim();
  const password = document.getElementById("newPassword").value.trim();
  registerUser(email, password);
});
