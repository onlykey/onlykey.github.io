
var $ = require("jquery");
window.jQuery = $;
require("./jquery.history.js");
require("./jquery.scrollTo.min.js");


const randomColor = require('randomcolor');


var architect = require("./architect.js");

var EventEmitter = require("events").EventEmitter;

architect([
  
  //require("./app_src/main.js"),
  
  require("./app_src/gun.js"),
  
  require("./app_src/onlykey/plugin.js"),
 
  require("./app_src/pages/pages.js"),
  
  require("./app_src/history.js"),
  
  {
    provides: ["$"],
    consumes: [],
    setup: function(options, imports, register){
      register(null, {
        $:$
      });
    }
  }
, {
    provides: ["app","release", "randomColor"],
    consumes: ["hub"],
    setup: function(options, imports, register){
      register(null, {
        app: new EventEmitter(),
        release: require("./release.js"),
        
        randomColor:randomColor
      });
    }
  }
], function(err, app) {
  if (err) return console.error(err);
  app.services.app.core = app.services;
  for (var i in app.services) {
    app.services.app[i] = app.services[i];
  }
  for (var i in app.services) {
    if (app.services[i].init) app.services[i].init(app);
  }

  app.services.app.emit("start");
});


