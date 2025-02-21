async function registerUser(email, password) {
  if (password.length < 6) {
    alert("La password deve contenere almeno 6 caratteri.");
    return;
  }

  const user = new Backendless.User();
  user.email = email;
  user.password = password;
  user.name = email.toLowerCase().trim(); // Usa l'email come nome utente

  try {
    const registeredUser = await Backendless.UserService.register(user);
    console.log("Utente registrato:", registeredUser);
    alert(`Registrazione riuscita! Controlla la tua email per la conferma.`);
  } catch (error) {
    console.error("Errore durante la registrazione:", error);
    const errMsg = error.message.toLowerCase();

    if (errMsg.includes("already exists")) {
      alert("L'utente è già registrato. Prova ad effettuare il login.");
    } else if (errMsg.includes("session timeout")) {
      alert("Sessione scaduta. Riprova dopo aver riavviato l'app.");
    } else if (
      errMsg.includes("network error") ||
      errMsg.includes("failed to fetch")
    ) {
      alert("Errore di connessione. Controlla la tua rete e riprova.");
    } else {
      alert(error.message);
    }
  }
}

async function loginUser(email, password) {
  if (!email || !password) {
    alert("Inserisci sia l'email che la password.");
    return;
  }

  try {
    const loggedInUser = await Backendless.UserService.login(
      email,
      password,
      true
    );
    console.log("Utente loggato:", loggedInUser);

    // Salva l'email dell'utente in localStorage
    localStorage.setItem("userEmail", loggedInUser.email);

    // Salva l'utente corrente in Backendless per mantenerlo loggato
    localStorage.setItem("userToken", loggedInUser["user-token"]);

    window.location.href = "main.html"; // Reindirizza alla pagina principale
  } catch (error) {
    console.error("Errore nel login:", error);
    const errMsg = error.message.toLowerCase();

    if (errMsg.includes("invalid login or password")) {
      alert(
        "Credenziali errate o utente non registrato. Controlla l'email e la password, verifica di essere registrato e riprova."
      );
    } else if (errMsg.includes("password value cannot be empty")) {
      alert("Inserisci la password.");
    } else if (errMsg.includes("email value cannot be empty")) {
      alert("Inserisci l'email.");
    } else if (errMsg.includes("email address must be confirmed first")) {
      alert("Conferma il tuo indirizzo email prima di accedere.");
    } else if (
      errMsg.includes("network error") ||
      errMsg.includes("failed to fetch")
    ) {
      alert("Errore di connessione. Controlla la tua rete e riprova.");
    } else {
      alert(error.message);
    }
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
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    registerUser(email, password);
  });
}