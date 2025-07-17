import { logoutUser } from "/src/js/logoutAndDelete.js";
const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
console.log(
  "risultato del test",
  regex.test(localStorage.getItem("userEmail"))
);
if (regex.test(localStorage.getItem("userEmail"))) {
  const selectedTheme = localStorage.getItem("theme");
  localStorage.clear();
  localStorage.setItem("theme", selectedTheme);
  await logoutUser(false);
}
