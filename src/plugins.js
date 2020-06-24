console.log("OnlyKey App Mode", process.env.NODE_ENV);

/*
This is the plugins.js file. We loads all the app plugins

some plugins can be used just for development or production
*/
module.exports = [
  
  /* the gun plugin contains helpers for gun  */
  require("./app_src/gun.js"),
  
  /* the onlykey plugin contains the api and other untilities for other plugins */
  require("./app_src/onlykey/plugin.js"),
  
  /* pages plugin is the heart of the app state */
  require("./app_src/pages/pages.js")

];

module.exports.push(require("./plugins/bs_modal_dialog/bs_modal_dialog.js"));

module.exports.push(require("./plugins/fancy-icons/fi.js"));
  

//need to move development plugins list to its own js file.. 
// needs not to include these plugins in production because its inert within prod source
if (!(process.env.NODE_ENV === "production")) {
  //these plugins still in development
  
  /* debug console emitter */
  module.exports.push(require("./plugins/console/console_debug.js"));

  /* chat plugin */
  module.exports.push(require("./plugins/chat/chat.js"));
  
  /* for encrypted data to for onlykey devices */
  module.exports.push(require("./app_src/history.js"));
  
  
}
else {
  //production plugins
  
  /* debug console omitter (remove console output)
      you can use `window.console` to force output in production  */
  module.exports.push(require("./plugins/console/console.js"));
  
}
