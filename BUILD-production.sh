

lastVersionNumber=$(node -e 'console.log(require(__dirname+"/docs/release.json").version)')
lastVersionStage=$(node -e 'console.log(require(__dirname+"/docs/release.json").stage)')
lastStage=${lastVersionStage}${lastVersionNumber}

currentVersionNumber=$(node -e 'console.log(require(__dirname+"/src/release.json").version)')
currentVersionStage=$(node -e 'console.log(require(__dirname+"/src/release.json").stage)')
currentStage=${currentVersionStage}${currentVersionNumber}

if [ "$currentStage" == "$lastStage"  ]; then
echo "Already Built! Increase Version number in src/release.json"
exit 1
fi

sh ./BUILD.sh 1

# mv ./docs ./docs_orig

# mv ./build ./docs

