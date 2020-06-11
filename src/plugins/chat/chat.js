//change   _template_  to your plugin name  

var pagesList = {
  "chat~":{}
};


module.exports = {
    pagesList: pagesList,
    consumes: ["app"],
    provides: ["plugin_chat"],
    setup: function(options, imports, register) {
        
        pagesList["chat~"].view = require("./chat.page.html").default;
        
        console.log("pre-init");
        
        register(null, {
            plugin_chat:{
                pagesList:pagesList,
                
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