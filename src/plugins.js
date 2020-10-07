console.log("OnlyKey App Mode", process.env.NODE_ENV);

/*
This is the plugins.js file. We loads all the app plugins

some plugins can be used just for development or production
*/
module.exports = [
  
  /* the gun plugin contains helpers for gun  */
  require("./lib/gun.js"),
  
  /* the onlykey plugin contains the api and other utilities for other plugins */
  require("./onlykey-fido2/plugin.js"),
  
  /* pages plugin is the heart of the app state */
  require("./plugins/pages/pages.js"),
  
  
  require("./plugins/past_releases/past_releases.js")

];

module.exports.push(require("./plugins/bs_modal_dialog/bs_modal_dialog.js"));

module.exports.push(require("./plugins/fancy-icons/fi.js"));

module.exports.push(require("./plugins/index/index.js"));

//module.exports.push(require("./plugins/xterm_console/index.js"));

module.exports.push(require("./plugins/encrypt/encrypt.js"));

module.exports.push(require("./plugins/decrypt/decrypt.js"));

module.exports.push(require("./plugins/search/search.js"));

module.exports.push(require("./plugins/ok-status-icon/ok-status-icon.js"));

if (!!(process.env.NODE_ENV === "production")) {//is production
  
  //production only plugins (we should have sister plugins enabled in plugins-devel.js)
  
  /* debug console omitter (remove console output)
      you can use `window.console` to force output in production  */
  module.exports.push(require("./plugins/console/console.js"));
  
}else{//is development
  //instead of including DEV plugins in production builds, 
  //put your DEV plugins in `plugins-devel.js` so webpack wont include it in production
}
