import "/src/styles.css";
import { createBackup, restoreBackup } from "/src/js/backup.js";
import { deleteCurrentUser, logoutUser } from "/src/js/logoutAndDelete.js";

function addSpecificEventListener(id, callback) {
  return document.getElementById(id).addEventListener("click", callback);
}

addSpecificEventListener("logout", logoutUser);
addSpecificEventListener("delete", deleteCurrentUser);
addSpecificEventListener("createBackup", createBackup);
addSpecificEventListener("restoreBackup", restoreBackup);

document.querySelector("#userEmail").textContent =
  localStorage.getItem("plainUserEmail");
