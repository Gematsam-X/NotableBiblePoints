import { defineConfig } from "vite";
import { resolve } from "path";
import fs from "fs";
import { viteStaticCopy } from "vite-plugin-static-copy"; // 🧩 Plugin per copiare file statici

// Lista dei JS da includere come entry separati
const jsFiles = [
  "accountEventListeners",
  "auth",
  "backendlessInit",
  "backup",
  "chaptersAndNotesReferrer",
  "checkVersion",
  "drawer",
  "idb",
  "indexedDButils",
  "injectChapters",
  "injectInstructions",
  "isDarkTheme",
  "legend",
  "loadingGif",
  "logoutAndDelete",
  "main-ok",
  "notes",
  "online",
  "recovery",
  "referrer",
  "rememberMe",
  "return",
  "searchbar",
  "theme",
  "toast",
  "toggleLoginSignup",
  "verifyChapterNotes",
];

// Entry HTML
const htmlEntries = {
  main: resolve(__dirname, "index.html"),
  login: resolve(__dirname, "src/html/login.html"),
  account: resolve(__dirname, "src/html/account.html"),
  chapters: resolve(__dirname, "src/html/chapters.html"),
  notesHTML: resolve(__dirname, "src/html/notes.html"),
  onboarding: resolve(__dirname, "src/html/onboarding.html"),
  accessRestricted: resolve(__dirname, "src/html/accessRestricted.html"),
};

// Entry JS dinamiche
const jsEntries = Object.fromEntries(
  jsFiles.map((name) => [name, resolve(__dirname, `src/js/${name}.js`)])
);

// Tutti gli input (HTML + JS)
const allInputs = {
  ...htmlEntries,
  ...jsEntries,
};

// Log dei file effettivi prima della build
console.log("👉 INPUT FILES to build:");
Object.entries(allInputs).forEach(([key, path]) => {
  const exists = fs.existsSync(path) || false;
  console.log(`  ${key}: ${path} ${exists ? "✅" : "❌ NOT FOUND!"}`);
});

// Configurazione finale
export default defineConfig({
  preview: {
    open: "/index.html",
  },
  root: "./",
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: allInputs,
    },
    minify: "terser",
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: resolve(__dirname, "public/assets/**/*"), // Tutto dentro public
          dest: "src/assets", // Copiato in dist/assets
        },
      ],
    }),
  ],
});
