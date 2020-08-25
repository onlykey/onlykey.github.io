function clearRequireCache() {
  Object.keys(require.cache).forEach(function(key) {
      if(!(key.indexOf(".node") > -1))
        delete require.cache[key];
  });  
}
clearRequireCache();
require("./index.js")();