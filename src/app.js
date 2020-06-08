/* globals kbpgp forge nacl*/

var $ = require("jquery");

var architect = require("./architect.js");
var EventEmitter = require("events").EventEmitter

architect([
  
  require("./app_src/main.js"),
  
  require("./app_src/gun.js"),
  
  require("./app_src/onlykey/plugin.js"),
  
  {//jquery
    provides: ["$"],
    consumes: [],
    setup: (options, imports, register) => {
      register(null, {
        $:$
      });
    }
  }, {//app core
    provides: ["app"],
    consumes: ["hub"],
    setup: (options, imports, register) => {
      register(null, {
        app: new EventEmitter()
      });
    }
  }
], function(err, app) {
  if (err) return console.error(err);
  app.services.app.core = app.services;
  for (var i in app.services) {
    if (app.services[i].init) app.services[i].init(app);
    app.services.app[i] = app.services[i];
  }

  app.services.app.emit("start");
});

