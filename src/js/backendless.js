const appId = "088E9795-83AE-44EB-B266-9A1C5B95F120"; // Nuovo App ID
const apiKey = "E872E3E7-DE72-4126-9EAD-E17A9A8C9249"; // Nuova API Key
Backendless.initApp(appId, apiKey);

async function registerUser(email, password, userText) {
  const user = new Backendless.User();
  user.email = email;
  user.password = password;
  user.name = email; // Usa il nome inserito dall'utente

  try {
    // Registrazione dell'utente
    const registeredUser = await Backendless.UserService.register(user);
    console.log("Utente registrato:", registeredUser);

    // Salva il testo per l'utente
    saveTextForUser(registeredUser.objectId, userText, registeredUser.email);
  } catch (error) {
    console.error("Errore durante la registrazione:", error);
    alert(error.message);
  }
}

async function saveTextForUser(userId, text, email) {
  try {
    // Controlla se esiste già un record con quella email
    const existingRecords = await Backendless.Data.of("UserText").find({
      where: `email = '${email}'`,
    });

    if (existingRecords.length > 0) {
      // Se esiste, aggiorna il record esistente
      const existingRecord = existingRecords[0];
      existingRecord.text = text; // Aggiorna il testo
      await Backendless.Data.of("UserText").save(existingRecord);
      console.log("Testo aggiornato con successo!");
    } else {
      // Se non esiste, crea un nuovo record
      const textObj = { ownerId: userId, text: text, email: email };
      await Backendless.Data.of("UserText").save(textObj);
      console.log("Testo salvato con successo!");
    }
  } catch (error) {
    console.error("Errore nel salvataggio del testo:", error);
  }
}

async function loginUser(email, password, userText) {
  try {
    const loggedInUser = await Backendless.UserService.login(
      email,
      password,
      true
    );
    console.log("Utente loggato:", loggedInUser);

    // Recupera il testo precedente e aggiungi quello nuovo
    fetchPreviousTextAndSave(
      loggedInUser.objectId,
      userText,
      loggedInUser.email
    ); // Passa anche il nuovo testo
  } catch (error) {
    console.error("Errore nel login:", error);
    alert(error.message);
  }
}

// Funzione per recuperare e unire il testo scritto precedentemente
async function fetchPreviousTextAndSave(userId, newText, email) {
  try {
    // Recupera il testo esistente associato all'utente
    const data = await Backendless.Data.of("UserText").find({
      where: `ownerId = '${userId}'`,
    });
    console.log("Dati trovati per l'utente:", data);

    let updatedText = newText;
    if (data.length > 0) {
      // Aggiungi il nuovo testo a quello esistente (se presente)
      updatedText = data[0].text + "\n" + newText;
    }

    // Salva il testo aggiornato nella colonna 'text'
    saveTextForUser(userId, updatedText, email);
    document.getElementById("previousText").textContent = updatedText;
  } catch (error) {
    console.error("Errore nel recupero e salvataggio del testo:", error);
  }
}

document.getElementById("login").addEventListener("click", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const userText = document.getElementById("userText").value; // Ottieni il testo inserito
  loginUser(email, password, userText); // Passa il testo per salvarlo insieme al login
});

document.getElementById("register").addEventListener("click", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const userText = document.getElementById("userText").value;

  registerUser(email, password, userText); // Passa anche il nome utente e il testo
});
