import { themeToggleButton } from "./theme.js";

// Array of images for each category
const categories = {
  avatar: ["../assets/avatar/light.webp", "../assets/avatar/dark.webp"],
};

let index = 0; // Set the index to light mode by default

// Check if the theme is dark from localStorage
if (localStorage.getItem("theme") === "dark") {
  index = 1; // Set the images to dark mode
}

// Function to change all category images
function updateImgs() {
  for (const [category, images] of Object.entries(categories)) {
    const imgElement = document.getElementById(`${category}_img`);
    if (imgElement) {
      imgElement.src = images[index]; // Update the image source based on the current index
    }
  }
}

// Function to toggle between light and dark images
function toggleImages() {
  index = index === 0 ? 1 : 0; // Toggle index between light (0) and dark (1)
  updateImgs(); // Update the images
}

// Add event listener to the toggle button if it exists
if (themeToggleButton) {
  themeToggleButton.addEventListener("click", toggleImages);
}

// Set the initial images
updateImgs();
