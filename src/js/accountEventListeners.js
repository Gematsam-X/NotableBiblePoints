import "/src/styles.css";

import { createBackup, restoreBackup } from "./backup.js";
import { deleteCurrentUser, logoutUser } from "./logoutAndDelete.js";

function addSpecificEventListener(id, callback) {
  return document.getElementById(id).addEventListener("click", callback);
}

addSpecificEventListener("logout", logoutUser);
addSpecificEventListener("delete", deleteCurrentUser);
addSpecificEventListener("createBackup", createBackup);
addSpecificEventListener("restoreBackup", restoreBackup);

console.log(document.querySelector("#userEmail").textContent);

document.querySelector("#userEmail").textContent =
  localStorage.getItem("userEmail");
