


git checkout -- ./docs
lastVersionNumber=$(node -e 'console.log(require(__dirname+"/docs/release.js").version)')
lastVersionStage=$(node -e 'console.log(require(__dirname+"/docs/release.js").stage)')
lastStage=${lastVersionStage}${lastVersionNumber}

currentVersionNumber=$(node -e 'console.log(require(__dirname+"/src/release.js").version)')
currentVersionStage=$(node -e 'console.log(require(__dirname+"/src/release.js").stage)')
currentStage=${currentVersionStage}${currentVersionNumber}
rm -rf ./docs


if [ "$currentStage" == "$lastStage"  ]; then
echo "Build Version Same"
echo "lastStage ${lastStage}"
echo "currentStage ${currentStage}"
else
echo "Build Version Different"
echo "lastStage ${lastStage}"
echo "currentStage ${currentStage}"
fi

if [ "$1" == "1"  ]; then
echo "Build option 1"
fi

rm -rf ./build
if [ "$1" == "1"  ]; then
echo "Build Production"
npm run build-release
else
npm run build-site
fi
cp -a ./src/assets/* ./build/app/.
cp -a ./src/release.js ./build/.
rm -rf ./past_releases/${currentStage}
cp -a ./build ./past_releases/${currentStage}
echo "module.exports=['${currentStage}'];" > ./past_releases/last_build.js
cp -a ./past_releases ./build/.
rm -rf ./docs
mv ./build ./docs
node ./docs/past_releases/build.past_releases.list.js
rm -rf ./docs/past_releases/${currentStage}
rm ./docs/past_releases/build.past_releases.list.js
rm ./docs/past_releases/last_build.js


# else
# echo "Build Version Different"
# fi

# exit 2

