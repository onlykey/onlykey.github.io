const { lstatSync, readdirSync, writeFileSync } = require('fs');
const { join } = require('path');

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source =>
  readdirSync(source).map(name => join(source, name)); //.filter(isDirectory);


var dirs = getDirectories(__dirname);

var past_releases = {};

console.log("building release tree");
past_releases["current"] = require(__dirname + "/last_build.js")[0];

for (var i in dirs) {
  var name = dirs[i].replace(__dirname + "/", "");
  if (name.indexOf(".js") == -1)
  try{
    past_releases[name] = require(__dirname + "/" + name + "/release.js");
    console.log("Release Added", [name, past_releases[name].stage, past_releases[name].version, past_releases["current"] == name ? "(Current)" : ""])
  }catch(e){console.log(e)}
}



// console.log(past_releases);

writeFileSync(__dirname + "/past_releases.json", JSON.stringify(past_releases));