
//this area runs in webpack + browser (so becareful of js scope)

// search and replace  `_template_` to fit your plugin name  ie `myplugin`

//pagesList in this scope will build the corosponding html file like ``/app/myplugin.html`
var pagesList = {
  "_template_":{//the is the app `pathname` as refered to in `init` and `setup`
      //icon:"fa-adjust",
      //title: "App Page Title"  //if icon is disabled, use txt instead
      //sort:100
  }
};


module.exports = {
    pagesList: pagesList,
    consumes: ["app"],
    provides: ["plugin__template_"],
    setup: function(options, imports, register) {
        //app private scope
        
        var init = false;//to confirm page init fire
        
        var page = {
            //to add a view create a file   with  exentiton `.page.html` as this will render into  `webpack raw-loader`
            // when page is selected via URL ie. `/app/myplugin` it will automaticly put the view in `#container` element ID
            
            view : require("./_template_.page.html").default,// will be refered to as $page as jquery object in `init` and `setup`
            
            // this fires only 1 time (if this is the landing page), and instead of setup
            init:function(app, $page, pathname){
                init = true;// set page init confirm at the top
                
                //why?  this area is mostly use to get "url parameters" to adjust the page
                // it can stop a lot of bad things when loading the page/plugin as the landing page
                
                page.setup(app, $page, pathname);// at the end to complete page setup
            },
            // this fires everytime, unless this is the `landing page`
            setup:function(app, $page, pathname){
                 if (!init)//confirm page init, if not run init
                    return page.init(app, $page, pathname);
                    
                //access to jquery    
                app.$(".app-head").hide();
                
            },
            //this fires when navigating away
            dispose:function(app, pathname){
                
                //access to jquery
                app.$(".app-head").show();
            }
        };
        
        //we can now overwrite the old "pagesList" object content if we want
        pagesList["_template_"] = page;
        
        console.log("pre-init");// to help show loading process
        
        register(null, {
            "plugin__template_":{
                 // push out our pages object for "pages plugin" to scan during `arcitect-app api-init` loop
                pagesList:pagesList,
                
                //this is the plugin API init,  
                init: function() {
                    
                    console.log("init");// to help show loading process
                    
                    imports.app.on("start",function(){
                        
                        console.log("post-init");// to help show loading process
                        
                    });  
                }
            }
        });
        
    }
};