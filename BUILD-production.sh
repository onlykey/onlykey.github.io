

lastVersionNumber=$(node -e 'console.log(require(__dirname+"/docs/release.json").version)')
lastVersionStage=$(node -e 'console.log(require(__dirname+"/docs/release.json").stage)')
lastStage=${lastVersionStage}${lastVersionNumber}

currentVersionNumber=$(node -e 'console.log(require(__dirname+"/src/release.json").version)')
currentVersionStage=$(node -e 'console.log(require(__dirname+"/src/release.json").stage)')
currentStage=${lastVersionStage}${lastVersionNumber}


if [ "$currentStage" == "$lastStage"  ]; then
echo "Already Built! Increase Version number in src/release.json"
exit 1
fi

rm -rf ./docs/past_releases

rm -rf ./past_releases/${lastVersionStage}${lastVersionNumber}

cp -a ./docs ./past_releases/${lastVersionStage}${lastVersionNumber}

sh ./BUILD.sh 

rm -rf ./docs

mv ./build ./docs

