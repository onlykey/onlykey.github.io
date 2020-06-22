var init = false;
var page = {

  init: function(app, $page, pathname) {
    init = true;
    
    console.log("page", "init");
    
    page.setup(app, $page, pathname);
  },
  setup: function(app, $page, pathname) {
    if(!init)
      return page.init(app, $page, pathname);
      
    console.log("page", "setup");
  },
  dispose: function(app, pathname){
    //init = false;
    console.log("disposed" , pathname);
  }
};

module.exports = page;