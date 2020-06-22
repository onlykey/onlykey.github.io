#!/bin/bash

#get last submitted version
git checkout -- ./docs
lastVersionNumber=$(node -e 'console.log(require(__dirname+"/docs/release.js").version)')
lastVersionStage=$(node -e 'console.log(require(__dirname+"/docs/release.js").stage)')
lastStage=${lastVersionStage}${lastVersionNumber}

currentVersionNumber=$(node -e 'console.log(require(__dirname+"/src/release.js").version)')
currentVersionStage=$(node -e 'console.log(require(__dirname+"/src/release.js").stage)')
currentStage=${currentVersionStage}${currentVersionNumber}

#remove last submitted version
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

#clear build dir
rm -rf ./build

#do build
if [ "$1" == "1" ]; then
echo "Build Production"
npm run build-release
else
npm run build-site
fi

#build theme css
cd ./src/bootstrap
bash ./build-bootstrap.sh
cd ../..

#copy assets
cp -a ./src/assets/* ./build/app/.
cp -a ./src/release.js ./build/.

#cleanup possible bad folders
rm -rf ./past_releases/${currentStage}
rm -rf ./past_releases/${currentStage}_rc

#temp copy current copy into past_releases
cp -a ./build ./past_releases/${currentStage}
echo "module.exports=['${currentStage}'];" > ./past_releases/last_build.js

#build past_releases file
node ./past_releases/build.past_releases.list.js


#remove past_releases temp files
rm ./past_releases/last_build.js
rm -rf ./past_releases/${currentStage}

#copy past_releases folder into build dir
cp -a ./past_releases ./build/.

#cleanup past_releases folder
rm ./past_releases/past_releases.json

#remove builder script for past_releases file
rm ./build/past_releases/build.past_releases.list.js


#complete by moving build dir to docs
mv ./build ./docs
# node ./docs/past_releases/build.past_releases.list.js
#rm ./docs/past_releases/build.past_releases.list.js


# else
# echo "Build Version Different"
# fi

# exit 2

