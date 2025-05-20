import fs from "fs-extra";
import path from "path";
import { globby } from "globby";
import { minify as minifyHtml } from "html-minifier";
import CleanCSS from "clean-css";
import * as terser from "terser";

const inputDir = process.argv[2];
const outputDir = "./dist";

if (!inputDir) {
  console.error(
    "❌ Devi specificare la cartella da minificare. Esempio: node n.mjs ./src"
  );
  process.exit(1);
}

(async () => {
  try {
    // Copia assets intatti
    const assetsSrc = path.join(inputDir, "assets");
    const assetsDest = path.join(outputDir, "assets");

    if (await fs.pathExists(assetsSrc)) {
      await fs.copy(assetsSrc, assetsDest);
      console.log(
        `📁 Copiata cartella assets senza modifiche: ${assetsSrc} → ${assetsDest}`
      );
    }

    // Trova i file da minificare escludendo assets
    const files = await globby(
      [`${inputDir}/**/*.*`, `!${inputDir}/assets/**`],
      { dot: true }
    );

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const relPath = path.relative(inputDir, file);
      const outPath = path.join(outputDir, relPath);

      await fs.ensureDir(path.dirname(outPath));
      const content = await fs.readFile(file, "utf8");
      let minified = content;

      if (ext === ".html") {
        minified = minifyHtml(content, {
          collapseWhitespace: true,
          removeComments: true,
          minifyJS: true,
          minifyCSS: true,
        });
      } else if (ext === ".css") {
        minified = new CleanCSS().minify(content).styles;
      } else if (ext === ".js") {
        const result = await terser.minify(content, {
          ecma: 2020, // o 2017, 2022 a seconda di cosa usi
          module: true, // se i tuoi script sono moduli ES6
          compress: true,
          mangle: true,
        });

        minified = result.code || content;
      }

      await fs.writeFile(outPath, minified);
      console.log(`✅ Minificato: ${relPath}`);
    }

    console.log(
      "\n🎉 Fatto! Tutti i file minificati sono in ./dist/ (assets copiati senza modifiche)"
    );
  } catch (err) {
    console.error("❌ Errore:", err);
  }
})();
