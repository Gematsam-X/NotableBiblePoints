rm -rf ./dist
node minify.mjs ./src
npx cap copy
npx cap sync
npx cap open android