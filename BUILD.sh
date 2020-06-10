


lastVersionNumber=$(node -e 'console.log(require(__dirname+"/docs/release.js").version)')
lastVersionStage=$(node -e 'console.log(require(__dirname+"/docs/release.js").stage)')
lastStage=${lastVersionStage}${lastVersionNumber}

currentVersionNumber=$(node -e 'console.log(require(__dirname+"/src/release.js").version)')
currentVersionStage=$(node -e 'console.log(require(__dirname+"/src/release.js").stage)')
currentStage=${currentVersionStage}${currentVersionNumber}



# rm -rf ./build

#if [ $1 ]; then
#npm run build-release
#else
# npm run build-site
#fi

# cp -a ./src/assets/* ./build/app/.
# cp -a ./src/release.json ./build/.


if [ "$currentStage" == "$lastStage"  ]; then
echo "Build Version Same"
npm run build-site
cp -a ./src/assets/* ./build/app/.
cp -a ./src/release.js ./build/.
rm -rf ./past_releases/${lastStage}_rc
cp -a ./build ./past_releases/${lastStage}_rc
node ./past_releases/build.past_releases.list.js
cp -a ./past_releases ./build/.
rm -rf ./docs
mv ./build ./docs
else
echo "Build Version Different"


# cp -a ./build ./past_releases/${lastStage}
# node ./past_releases/build.past_releases.list.js
fi

exit 2

# rm -rf ./past_releases/${lastStage}
# cp -a ./docs ./past_releases/${lastStage}

# rm -rf ./past_releases/${lastStage}_rc/past_releases

# cp -a ./past_releases ./build/.

# ln -s ../ ./build/past_releases/current


# node ./build/past_releases/build.past_releases.list.js