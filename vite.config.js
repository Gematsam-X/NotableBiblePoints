import { defineConfig } from "vite";
import { resolve } from "path";
import fs from "fs";
import { buildSync } from "esbuild";
import { viteStaticCopy } from "vite-plugin-static-copy";

const jsFiles = [
  "accountEventListeners",
  "auth",
  "backendlessRequest",
  "backup",
  "chaptersAndNotesReferrer",
  "checkIfLegacy",
  "checkVersion",
  "drawer",
  "indexedDButils",
  "injectChapters",
  "injectInstructions",
  "legend",
  "loadingGif",
  "logoutAndDelete",
  "main-ok",
  "notes",
  "notesByTag",
  "online",
  "recovery",
  "referrer",
  "rememberMe",
  "return",
  "searchbar",
  "shouldUseServer",
  "tagsPage",
  "theme",
  "toast",
  "toggleLoginSignup",
  "verifyChapterNotes",
];

const htmlEntries = {
  main: resolve(__dirname, "index.html"),
  login: resolve(__dirname, "src/html/login.html"),
  account: resolve(__dirname, "src/html/account.html"),
  chapters: resolve(__dirname, "src/html/chapters.html"),
  notesHTML: resolve(__dirname, "src/html/notes.html"),
  notesByTagHTML: resolve(__dirname, "src/html/notesByTag.html"),
  onboarding: resolve(__dirname, "src/html/onboarding.html"),
  tags: resolve(__dirname, "src/html/tags.html"),
  accessRestricted: resolve(__dirname, "src/html/accessRestricted.html"),
};

const jsEntries = Object.fromEntries(
  jsFiles.map((name) => [name, resolve(__dirname, `src/js/${name}.js`)])
);
const allInputs = { ...htmlEntries, ...jsEntries };

console.log("👉 INPUT FILES to build:");
Object.entries(allInputs).forEach(([key, path]) => {
  const exists = fs.existsSync(path) || false;
  console.log(`  ${key}: ${path} ${exists ? "✅ FOUND" : "❌ NOT FOUND!"}`);
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

    const filesToCache = Object.values(manifest)
      .filter((entry) => entry.file && /\.(js|css)$/.test(entry.file))
      .map((entry) => `/${entry.file}`);

    const imgArray = [
      "/assets/favicon.ico",
      "/assets/fonts/Cinzel-Bold.woff2",
      "/assets/fonts/FiraSansCondensed-SemiBold.ttf",
      "/assets/fonts/FiraSansCondensed-ExtraBold.ttf",
      "/assets/jw.org.webp",
    ];

    const finalAssets = [...filesToCache, ...imgArray];
    const finalCode = template.replace(
      "__ASSETS_TO_CACHE__",
      JSON.stringify(finalAssets, null, 2)
    );

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
    manifest: "hashManifest.json",
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
          src: resolve(__dirname, "manifest.json"),
          dest: ".",
        },
      ],
    }),
    generateServiceWorkerPlugin,
  ],
});
