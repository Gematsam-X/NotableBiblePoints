const fs = require("fs");
const path = require("path");
const pkg = require("./package.json");

const newVersion = pkg.version;

// Percorso del file version.json
const versionJsonPath = path.resolve(__dirname, "version.json");

// Crea il nuovo oggetto da salvare
const versionData = {
  version: newVersion,
};

// Sovrascrive version.json con la nuova versione
fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2) + "\n", "utf8");
