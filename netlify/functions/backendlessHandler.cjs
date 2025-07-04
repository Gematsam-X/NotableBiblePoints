const Backendless = require("backendless");

exports.handler = async (event) => {
  await Backendless.initApp(process.env.APP_ID, process.env.API_KEY);

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
        if (body.data.name) user.name = body.data.name;
        if (body.data.customField) user.customField = body.data.customField;

        const registeredUser = await Backendless.UserService.register(user);
        return ok(registeredUser);
      }
      case "login": {
        const loggedUser = await Backendless.UserService.login(
          body.data.email,
          body.data.password,
          true
        );
        return ok(loggedUser);
      }
      case "deleteUser":
        return ok(
          await Backendless.Data.of("Users").remove(body.data.objectId)
        );
      case "logout":
        await Backendless.UserService.logout();
        return ok({ message: "Logout effettuato" });
      case "getCurrentUser": {
        const currentUser = await Backendless.UserService.getCurrentUser();
        if (!currentUser) {
          return fail("Nessun utente loggato");
        }
        return ok(currentUser);
      }
      case "recoverPassword":
        await Backendless.UserService.restorePassword(body.data.email);
        return ok({ message: "Email inviata" });
      case "saveData":
        return ok(await Backendless.Data.of(body.table).save(body.data));
      case "getData":
        return ok(await Backendless.Data.of(body.table).find());
      default:
        return fail(`Azione sconosciuta: ${action}`);
    }
  } catch (error) {
    return fail(error.message);
  }
};

function ok(data) {
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
}

function fail(message) {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: message }),
  };
}
