if (!!(process.env.NODE_ENV === "production")) {
  console.log("ERROR! ------------- LOADING DEVEL PLUGINS GOT INCLUDED SOMEHOW IN PRODUCTION! ------------- ERROR!");
  throw (new Error("ERROR! ------------- LOADING DEVEL PLUGINS GOT INCLUDED SOMEHOW IN PRODUCTION! ------------- ERROR!"));
  return;
}

//just in case this file gets included somehow in production
console.log("WARNING! ------------- LOADING DEVEL PLUGINS! ------------- WARNING!");


module.exports = [];


/* debug console emitter */
module.exports.push(require("./plugins/console/console_debug.js"));

/* chat plugin */
module.exports.push(require("./plugins/chat/chat.js"));

/* for encrypted data to for onlykey devices */
module.exports.push(require("./lib/history.js"));


module.exports.push(require("./plugins/password-generator/password-generator.js"));
  