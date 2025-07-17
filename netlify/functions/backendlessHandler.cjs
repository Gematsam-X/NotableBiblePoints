const Backendless = require("backendless");
const CryptoJS = require("crypto-js");
const fetch = require("node-fetch");

exports.handler = async (event) => {
  await Backendless.initApp(process.env.APP_ID, process.env.API_KEY);

  const BASE_URL = `https://api.backendless.com/${process.env.APP_ID}/${process.env.API_KEY}/services/SecureNotesService`;

  const body = JSON.parse(event.body || "{}");

  // Gestione token per autenticare richieste con sessione
  if (body.userToken) {
    await Backendless.UserService.setCurrentUserToken(body.userToken);
  }

  const { action } = body;

  try {
    switch (action) {
      case "queryUsersByEmail": {
        const email = body.data.email;
        const queryBuilder =
          await Backendless.DataQueryBuilder.create().setWhereClause(
            `email = '${email}'`
          );
        const users = await Backendless.Data.of("Users").find(queryBuilder);
        return ok(users);
      }

      case "register": {
        const user = await new Backendless.User();
        user.email = body.data.email;
        user.password = body.data.password;
        user.name = body.data.email;

        const registeredUser = await Backendless.UserService.register(user);
        return ok(registeredUser);
      }

      case "login": {
        // Verifica che email e password siano presenti
        if (!body.data.email || !body.data.password) {
          return status4xx("Email e password sono obbligatorie.");
        }

        try {
          // Effettua il login con Backendless
          const loggedUser = await Backendless.UserService.login(
            body.data.email.toLowerCase().trim(),
            body.data.password.trim(),
            true
          );

          loggedUser.encryptedEmail = CryptoJS.AES.encrypt(
            loggedUser.email,
            process.env.ENCRYPTION_KEY
          ).toString();
          // Ritorna l'oggetto utente loggato
          return ok(loggedUser);
        } catch (e) {
          return status4xx(
            e.message || "Credenziali errate o login fallito.",
            1
          );
        }
      }

      case "deleteUser":
        return ok(
          await Backendless.Data.of("Users").remove(body.data.objectId)
        );

      case "logout":
        await Backendless.UserService.logout();
        return ok({ message: "Logout effettuato" });

      case "recoverPassword":
        await Backendless.UserService.restorePassword(body.data.email);
        return ok({ message: "Email inviata" });

      case "decrypt": {
        const { ciphertext } = body.data;
        if (!ciphertext) throw new Error("Testo criptato non fornito");

        try {
          const bytes = CryptoJS.AES.decrypt(
            ciphertext,
            process.env.ENCRYPTION_KEY
          );
          const decrypted = bytes.toString(CryptoJS.enc.Utf8);

          if (!decrypted) throw new Error("Decryption failed");

          return ok(decrypted);
        } catch (e) {
          throw new Error("Errore durante la decriptazione");
        }
      }

      // 🔐 Chiamate sicure al servizio
      case "notes:get": {
        const encrypted = body.data?.email;

        if (!encrypted) {
          console.error("[notes:get] Email criptata NON fornita!");
          throw new Error("Email criptata non fornita");
        }

        // Decripta l'email usando la chiave segreta
        const email = CryptoJS.AES.decrypt(
          encrypted,
          process.env.ENCRYPTION_KEY
        ).toString(CryptoJS.enc.Utf8);

        // Validazione email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          console.error(
            "[notes:get] Email non valida o decriptazione fallita:",
            email
          );
          throw new Error("Email non valida o decriptazione fallita");
        }

        const url = new URL(`${BASE_URL}/Notes`);
        url.searchParams.set("email", email);
        url.searchParams.set("token", body.userToken);

        try {
          const res = await fetch(url.toString(), {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: body.userToken,
            },
          });

          if (!res.ok) {
            const errorText = await res.text();
            console.error("[notes:get] Errore fetch UserNotes:", errorText);
            throw new Error(
              `Errore Backendless: ${res.status} ${res.statusText}`
            );
          }

          const result = await res.json();
          return ok(result);
        } catch (error) {
          console.error("[notes:get] Errore fetch:", error);
          throw error;
        }
      }

      case "notes:addOrUpdate": {
        const email = body.data.email;
        const noteOrNotes = body.data.note;
        const userToken = body.userToken;
        if (!email || !noteOrNotes) throw new Error("Email o nota non fornita");

        const res = await fetch(`${BASE_URL}/OrUpdate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: userToken,
          },
          body: JSON.stringify({
            email: CryptoJS.AES.decrypt(
              email,
              process.env.ENCRYPTION_KEY
            ).toString(CryptoJS.enc.Utf8),
            token: userToken,
            note: noteOrNotes,
          }),
        });

        if (!res.ok) {
          throw new Error(
            `Errore Backendless: ${res.status} ${res.statusText}`
          );
        }

        const result = await res.json();
        return ok(result);
      }

      case "notes:delete": {
        const email = body.data.email;
        const id = body.data.ids;
        const userToken = body.userToken;
        if (!email || !id) throw new Error("Email o id non forniti");

        const url = new URL(`${BASE_URL}/Note`);

        const res = await fetch(url.toString(), {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: userToken,
          },
          body: JSON.stringify({
            email: CryptoJS.AES.decrypt(
              email,
              process.env.ENCRYPTION_KEY
            ).toString(CryptoJS.enc.Utf8),
            token: userToken,
            ids: id,
          }),
        });
        console.log(
          "delete request body:",
          JSON.stringify({
            email: CryptoJS.AES.decrypt(
              email,
              process.env.ENCRYPTION_KEY
            ).toString(CryptoJS.enc.Utf8),
            token: userToken,
            ids: id,
          })
        );

        if (!res.ok) {
          throw new Error(
            `Errore Backendless: ${res.status} ${res.statusText}`
          );
        }

        const result = await res.json();
        return ok(result);
      }

      default:
        return status4xx(`Azione sconosciuta: ${action}`, 4);
    }
  } catch (error) {
    return status4xx(error.message);
  }
};

function ok(data) {
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
}

function status4xx(message, httpCode = 0) {
  return {
    statusCode: 400 + httpCode,
    body: JSON.stringify({ error: message }),
  };
}
