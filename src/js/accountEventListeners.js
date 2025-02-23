import { logoutUser, deleteCurrentUser } from "./logoutAndDelete.js";

function addSpecificEventListener(id, callback) {
    return document.getElementById(id).addEventListener("click", callback);
}

addSpecificEventListener("logout", logoutUser);
addSpecificEventListener("delete", deleteCurrentUser);