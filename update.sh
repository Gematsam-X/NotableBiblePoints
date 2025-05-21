rm -rf ./dist
npm run build
npx cap copy
npx cap sync