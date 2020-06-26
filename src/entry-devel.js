
  
  var app = require("./app.js");
  var p = require("./plugins.js");
  p = ([].concat(p, require("./plugins-devel.js")));
  app(p);
  
  
  
  
  
  