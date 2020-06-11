module.exports = [
  
  require("./app_src/gun.js"),
  
  require("./app_src/onlykey/plugin.js"),
 
  require("./app_src/pages/pages.js"),
  
  require("./app_src/history.js")
  
];

if(!(process.env.NODE_ENV === "production")){
  
  
  module.exports.push(require("./plugins/chat/chat.js"));
  
}
