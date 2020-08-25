 var _files = [];

 var plugins = require("./src/plugins.js")

 for (var i in plugins) {
   if (plugins[i].pagesList) {
     for (var j in plugins[i].pagesList) {
       _files.push(j);
     }
   }
 }
 console.log(_files)