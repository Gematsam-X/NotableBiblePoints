import { deleteCurrentUser, logoutUser } from "./logoutAndDelete.js";
import { createBackup, restoreBackup } from "./backup.js";

function addSpecificEventListener(id, callback) {
  return document.getElementById(id).addEventListener("click", callback);
}

addSpecificEventListener("logout", logoutUser);
addSpecificEventListener("delete", deleteCurrentUser);
addSpecificEventListener("createBackup", createBackup);
addSpecificEventListener("restoreBackup", restoreBackup);
