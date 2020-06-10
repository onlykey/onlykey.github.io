//change   _template_  to your plugin name  
module.exports = {
    consumes: ["app"],
    provides: ["gun","Gun","SEA", "newGun"],
    setup: function(options, imports, register) {
        
        var Gun = require("gun/gun.min.js");
        var sea = require("gun/sea.js");
        
        var newGun = function(){
            return Gun("https://www.peersocial.io/gun");
        };
        
        register(null, {
            newGun:newGun,
            Gun: Gun,
            SEA: Gun.SEA,
            gun: Gun("https://www.peersocial.io/gun")
        });
        
        
    }
};
