const purgecss = require("@fullhuman/postcss-purgecss").default;
const discardDuplicates = require("postcss-discard-duplicates");
const discardComments = require("postcss-discard-comments");
const mergeRules = require("postcss-merge-rules");
const cssnano = require("cssnano");

const isProd = process.env.NODE_ENV === "production";

module.exports = {
  plugins: [
    ...(isProd
      ? [
          purgecss({
            content: [
              "./index.html",
              "./src/html/**/*.html",
              "./src/js/**/*.js",
            ],
            defaultExtractor: (content) =>
              content.match(/[\w-/:]+(?<!:)/g) || [],
            safelist: {
              standard: [/^flaticon-/, /^icon-/, /^btn-/],
            },
          }),
        ]
      : []),
    discardDuplicates(),
    discardComments(),
    mergeRules(),
    cssnano(),
  ],
};
