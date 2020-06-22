
/*
  This is the main start to building the app
  we pull a app plugins from plugins.js file  

*/
var $ = require("jquery");
window.jQuery = $;
require("./jquery.history.js");
require("./jquery.scrollTo.min.js");
require("bootstrap");


var randomColor = require('randomcolor');


var architect = require("./architect.js");

var EventEmitter = require("events").EventEmitter;


var architect_plugins = [
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
  }];
  
  architect_plugins = ([].concat(architect_plugins, require("./plugins.js")));

architect(architect_plugins, function(err, app) {
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


