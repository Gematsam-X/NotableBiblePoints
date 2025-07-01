import { redirectToOriginPage } from "/src/js/logoutAndDelete.js";

const returnButton = document.getElementById("return-btn");
const loc = document.location.href.split("/").pop();

if (loc === "notes.html") {
  returnButton.addEventListener(
    "click",
    () => (window.location.href = "chapters.html")
  );
} else if (loc === "chapters.html") {
  returnButton.addEventListener(
    "click",
    () => (window.location.href = "/index.html")
  );
} else if (loc === "account.html") {
  returnButton.addEventListener(
    "click",
    () => (window.location.href = "/index.html")
  );
} else {
  returnButton.addEventListener("click", redirectToOriginPage);
}
