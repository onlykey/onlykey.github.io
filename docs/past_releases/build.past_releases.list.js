const { lstatSync, readdirSync, writeFileSync } = require('fs');
const { join } = require('path');

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source =>
  readdirSync(source).map(name => join(source, name)); //.filter(isDirectory);


var dirs = getDirectories(__dirname);

var past_releases = {};

for (var i in dirs) {
  var name = dirs[i].replace(__dirname + "/", "");
  if (name.indexOf(".") == -1)
    past_releases[name] = require(__dirname + "/" + name + "/release.js");
}

console.log(past_releases);

writeFileSync(__dirname + "/past_releases.json", JSON.stringify(past_releases));