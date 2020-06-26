
module.exports = [];


/* debug console emitter */
module.exports.push(require("./plugins/console/console_debug.js"));

/* chat plugin */
module.exports.push(require("./plugins/chat/chat.js"));

/* for encrypted data to for onlykey devices */
module.exports.push(require("./app_src/history.js"));

