
module.exports = {
    consumes: ["app"],
    provides: ["console"],
    setup: function(options, imports, register) {
        
        var _console = {
            info:function(){},
            error:function(){},
            warn:function(){},
            log:function(){}
        };
        
        register(null, {
            console:_console
        });
        
        
    }
};