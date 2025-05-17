const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const keyword = document.getElementById("keyword");
const password = document.getElementById("password");
const newPassword = document.getElementById("newPassword");
const email = document.getElementById("email");
const newEmail = document.getElementById("newEmail");

loginTab.addEventListener("click", function () {
  keyword.textContent = "Accedi a";
  loginTab.classList.add("active");
  signupTab.classList.remove("active");
  loginForm.classList.add("active");
  signupForm.classList.remove("active");
  email.value = newEmail.value.trim();
  password.value = newPassword.value;
});

signupTab.addEventListener("click", function () {
  keyword.textContent = "Registrati su";
  signupTab.classList.add("active");
  loginTab.classList.remove("active");
  signupForm.classList.add("active");
  loginForm.classList.remove("active");
  newEmail.value = email.value.trim();
  newPassword.value = password.value;
});
