//change   _template_  to your plugin name  
module.exports = {
    consumes: ["app","console"],
    provides: ["fancy-icons"],
    setup: function(options, imports, register) {
        var console = imports.console;
        
        var wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  
        register(null, {
            "fancy-icons":{
                init: function() {
                    
                    var $ = imports.app.$;
                    
                    imports.app.on("start",function(){
                        
                        
                        var fiList = $("#fancy-icons").children();
                        
                        console.log(fiList);
                        
                        var i = 0;
                        var loop = async function(){
                            await wait(1000);
                            
                            fiList.removeClass("text-success");
                            if(fiList[i]){
                                $(fiList[i]).addClass("text-success");
                            }
                            
                            if($(fiList[i]).hasClass("fa-lock")){
                                $(fiList[i]).removeClass("fa-lock");
                                $(fiList[i]).addClass("fa-unlock");
                            }else if($(fiList[i]).hasClass("fa-unlock")){
                                $(fiList[i]).removeClass("fa-unlock");
                                $(fiList[i]).addClass("fa-lock");
                            }
                            
                            i += 1;
                            
                            if(i == fiList.length){
                                i = 0;
                                await wait(2000);
                            }
                            
                            loop();
                        };
                        
                        loop();
                        
                        
                        
                    });  
                    
                    
                }
            }
        });
        
        
    }
};