import backendlessRequest from "/src/js/backendlessRequest.js";
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

document.querySelector("#userEmail").textContent = await backendlessRequest(
  "decrypt",
  {
    ciphertext: localStorage.getItem("userEmail"),
  }
);
