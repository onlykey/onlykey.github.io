

//this area runs in webpack + browser (so becareful of js scope)

// search and replace  `_template_` to fit your plugin name  ie `myplugin`

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