var init = false;
var page = {

  init: function(app, $page) {
    init = true;
    
    console.log("page", "init");
    
    page.setup(app, $page);
  },
  setup: function(app, $page) {
    if(!init)
      page.init(app, $page);
      
    console.log("page", "setup");
  }
};

module.exports = page;