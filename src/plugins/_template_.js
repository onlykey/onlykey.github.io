//change   _template_  to your plugin name  
module.exports = {
    consumes: ["app"],
    provides: ["_template_"],
    setup: function(options, imports, register) {
        
        console.log("pre-init");
        
        register(null, {
            _template_:{
                init: function() {
                    
                    console.log("init");
                    
                    imports.app.on("start",function(){
                        
                        console.log("post-init");
                        
                    });  
                }
            }
        });
        
        
    }
};