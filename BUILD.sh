
rm -rf ./build

npm run build-site

cp -a ./src/assets/* ./build/app/.

cp -a ./src/release.json ./build/.

cp -a ./past_releases ./build/.

ln -s ../ ./build/past_releases/current

node ./build/past_releases/build.past_releases.list.js