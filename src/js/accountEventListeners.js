import { createBackup, restoreBackup } from "./backup.js";
import { deleteCurrentUser, logoutUser } from "./logoutAndDelete.js";
import backendlessRequest from "./backendlessRequest.js";

function addSpecificEventListener(id, callback) {
  return document.getElementById(id).addEventListener("click", callback);
}

addSpecificEventListener("logout", () => {
  logoutUser(true);
});
addSpecificEventListener("delete", deleteCurrentUser);
addSpecificEventListener("createBackup", createBackup);
addSpecificEventListener("restoreBackup", restoreBackup);

console.log(document.querySelector("#userEmail").textContent);

document.querySelector("#userEmail").textContent = await backendlessRequest(
  "decrypt",
  { ciphertext: localStorage.getItem("userEmail") }
);
