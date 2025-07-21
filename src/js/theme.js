import "../styles.css"

const body = document.body;

export const themeToggleSwitch = document.querySelector("#themeToggle");

// Check if the user has already set a theme (light or dark)
if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark-theme"); // Apply the dark theme if it was previously set
  if (themeToggleSwitch) themeToggleSwitch.checked = true; // Set the toggle switch to checked
}

// Function to toggle the theme between light and dark
function toggleTheme() {
  body.style.transition = "background-color 0.5s ease"; // Add a transition effect for the background color
  body.classList.toggle("dark-theme"); // Toggle the dark theme class
  const theme = body.classList.contains("dark-theme") ? "dark" : "light"; // Determine the current theme
  localStorage.setItem("theme", theme); // Save the current theme to localStorage
}

if (themeToggleSwitch) {
  themeToggleSwitch.addEventListener("click", toggleTheme); // Add an event listener to the toggle button
}

document.querySelector("html").classList.add("theme-loaded"); // Add a class to the body to indicate that the theme has been loaded
