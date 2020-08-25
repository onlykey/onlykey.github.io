module.exports = function(additional_plugins) {

  /*
    This is the main app start 
    
    we pull a app plugins from plugins.js and plugins-devel.js files trough main.js and main-production.js

  */
  var $ = require("jquery");
  window.jQuery = $;
  
  require("jquery-ui");
  require("jquery-ui/ui/widgets/draggable");
  
  require("./lib/jquery.history.js");
  require("./lib/jquery.scrollTo.min.js");
  require("bootstrap");


  var randomColor = require('randomcolor');


  var architect = require("./lib/architect.js");

  var EventEmitter = require("events").EventEmitter;


  var architect_plugins = [{
    provides: ["$"],
    consumes: [],
    setup: function(options, imports, register) {
      register(null, {
        $: $
      });
    }
  }, {
    provides: ["app", "release", "randomColor", "window"],
    consumes: ["hub"],
    setup: function(options, imports, register) {
      register(null, {
        app: new EventEmitter(),
        release: require("./release.js"),
        randomColor: randomColor,
        window: window
      });
    }
  }];

  architect_plugins = ([].concat(architect_plugins, additional_plugins));

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



}