module.exports = [

  require("./app_src/gun.js"),

  require("./app_src/onlykey/plugin.js"),

  require("./app_src/pages/pages.js"),

  require("./app_src/history.js")

];

console.log("OnlyKey App Mode", process.env.NODE_ENV);

if (!(process.env.NODE_ENV === "production")) {
  //developer plugins
  module.exports.push(require("./plugins/console/console_debug.js"));

  module.exports.push(require("./plugins/chat/chat.js"));

}
else {
  //production plugins
  module.exports.push(require("./plugins/console/console.js"));
  
}
