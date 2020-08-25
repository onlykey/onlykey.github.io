
module.exports = function(){
var EventEmitter = require("events").EventEmitter;
var path = require('path');
var architect = require("./libs/architect.js");


var configPath = path.join(__dirname, "config.js");

var tests = require(configPath)

tests.push({
    provides: ["app", "console"],
    consumes: ["hub"],
    setup: function(options, imports, register) {
        register(null, {
            app: new EventEmitter(),
            console: console
        });
    }
});

architect.createApp(tests, function(err, app) {

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

// module.exports();