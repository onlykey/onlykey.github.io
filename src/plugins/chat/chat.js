

var pagesList = {
  "chat":{
      icon:"fa-comments-o",
      sort:40
  }
};


module.exports = {
    pagesList: pagesList,
    consumes: ["app"],
    provides: ["plugin_chat"],
    setup: function(options, imports, register) {
        
        var init = false;
        
        var page = {
            view : require("./chat.page.html").default,
            init:function(app, $page, pathname){
                init = true;
                
                page.setup(app, $page, pathname);
            },
            setup:function(app, $page, pathname){
                 if (!init)
                    return page.init(app, $page, pathname);
                    
                app.$(".app-head").hide();
                
            },
            dispose:function(app, pathname){
                app.$(".app-head").show();
            }
        };
        
        pagesList["chat"] = page;
        
        // console.log("pre-init");
        
        register(null, {
            plugin_chat:{
                pagesList:pagesList
            }
        });
        
        
    }
};