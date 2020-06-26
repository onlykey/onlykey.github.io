

if (!(process.env.NODE_ENV === "production")) { //just in case this file gets included somehow in production
  
  
console.log("WARNING! ------------- LOADING DEVEL PLUGINS! ------------- WARNING!");
  
  
module.exports = [];


/* debug console emitter */
module.exports.push(require("./plugins/console/console_debug.js"));

/* chat plugin */
module.exports.push(require("./plugins/chat/chat.js"));

/* for encrypted data to for onlykey devices */
module.exports.push(require("./app_src/history.js"));

}else{
  
  console.log("ERROR! ------------- LOADING DEVEL PLUGINS GOT INCLUDED SOMEHOW IN PRODUCTION! ------------- ERROR!");
  throw(new Error("ERROR! ------------- LOADING DEVEL PLUGINS GOT INCLUDED SOMEHOW IN PRODUCTION! ------------- ERROR!"));
}