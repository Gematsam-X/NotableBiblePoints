import { defineConfig } from "vite";
import { resolve } from "path";
import fs from "fs";
import { buildSync } from "esbuild";
import { viteStaticCopy } from "vite-plugin-static-copy"; // 🧩 Plugin per copiare file statici

// Lista dei JS da includere come entry separati
const jsFiles = [
  "accountEventListeners",
  "auth",
  "backendlessRequest",
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

// 📄 Entrate HTML
const htmlEntries = {
  main: resolve(__dirname, "index.html"),
  login: resolve(__dirname, "src/html/login.html"),
  account: resolve(__dirname, "src/html/account.html"),
  chapters: resolve(__dirname, "src/html/chapters.html"),
  notesHTML: resolve(__dirname, "src/html/notes.html"),
  onboarding: resolve(__dirname, "src/html/onboarding.html"),
  accessRestricted: resolve(__dirname, "src/html/accessRestricted.html"),
};

// 💻 Entrate JS dinamiche
const jsEntries = Object.fromEntries(
  jsFiles.map((name) => [name, resolve(__dirname, `src/js/${name}.js`)])
);

// 🎯 Tutti gli input (HTML + JS + PWA)
const allInputs = {
  ...htmlEntries,
  ...jsEntries,
};

// 👀 Log dei file effettivi prima della build
console.log("👉 INPUT FILES to build:");
Object.entries(allInputs).forEach(([key, path]) => {
  const exists = fs.existsSync(path) || false;
  console.log(`  ${key}: ${path} ${exists ? "✅" : "❌ NOT FOUND!"}`);
});

const generateServiceWorkerPlugin = {
  name: "generate-service-worker",
  apply: "build",
  enforce: "post",
  async writeBundle() {
    const manifestPath = resolve(__dirname, "dist/hashManifest.json");
    const templatePath = resolve(__dirname, "serviceWorker.template.js");
    const outputPath = resolve(__dirname, "dist/serviceWorker.js");

    if (!fs.existsSync(manifestPath)) {
      throw new Error("hashManifest.json non trovato!");
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    const template = fs.readFileSync(templatePath, "utf-8");

    // Qui scegli i file da cachare (es. quelli con js e css)
    const filesToCache = Object.values(manifest)
      .filter((entry) => entry.file && /\.(js|css)$/.test(entry.file))
      .map((entry) => `/${entry.file}`);

    const imgArray = [
      "/assets/favicon.ico",
      "/assets/jw.org.webp",
      "/assets/account/backup/create/dark.webp",
      "/assets/account/backup/create/light.webp",
      "/assets/account/backup/restore/dark.webp",
      "/assets/account/backup/restore/light.webp",
      "/assets/account/delete/dark.webp",
      "/assets/account/delete/light.webp",
      "/assets/account/logout/dark.webp",
      "/assets/account/logout/light.webp",
      "/assets/avatar/dark.webp",
      "/assets/avatar/light.webp",
      "/assets/drawer/open/dark.webp",
      "/assets/drawer/open/light.webp",
      "/assets/drawer/otherApps/dark.webp",
      "/assets/drawer/otherApps/light.webp",
      "/assets/drawer/rightArrow/dark.webp",
      "/assets/drawer/rightArrow/light.webp",
      "/assets/fonts/Cinzel-Bold.woff2",
      "/assets/fonts/FiraSansCondensed-ExtraBold.ttf",
      "/assets/fonts/FiraSansCondensed-SemiBold.woff2",
      "/assets/github/dark.webp",
      "/assets/github/light.webp",
      "/assets/help/dark.webp",
      "/assets/help/light.webp",
      "/assets/lens/dark.webp",
      "/assets/lens/light.webp",
      "/assets/loadingGif/loading.gif",
      "/assets/notes/delete/dark.webp",
      "/assets/notes/delete/light.webp",
      "/assets/notes/edit/dark.webp",
      "/assets/notes/edit/light.webp",
      "/assets/notes/refresh/dark.webp",
      "/assets/notes/refresh/light.webp",
      "/assets/notes/share/dark.webp",
      "/assets/notes/share/light.webp",
    ];
    
    const finalAssets = [...filesToCache, ...imgArray];
    const finalCode = template.replace(
      "__ASSETS_TO_CACHE__",
      JSON.stringify(finalAssets, null, 2)
    );

    // Minifica con esbuild
    buildSync({
      stdin: {
        contents: finalCode,
        resolveDir: __dirname,
        sourcefile: "serviceWorker.js",
        loader: "js",
      },
      bundle: true,
      minify: true,
      outfile: outputPath,
    });

    console.log("✅ serviceWorker.js generato con asset reali e minificato.");
  },
};

// ⚙️ Configurazione Vite finale
export default defineConfig({
  server: {
    port: 5174,
  },
  preview: {
    open: "/index.html",
  },
  root: "./",
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    manifest: "hashManifest.json", // 👉 forza la generazione in dist/
    rollupOptions: {
      input: allInputs,
    },
    minify: "terser",
  },

  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: resolve(__dirname, "public/assets/**/*"),
          dest: "src/assets",
        },
        {
          src: resolve(__dirname, "manifest.json"), // 📦 Copia anche il manifest
          dest: ".", // Copiato in dist/
        },
      ],
    }),
    generateServiceWorkerPlugin,
  ],
});
