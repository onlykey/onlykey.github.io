var init = false;
var page = {

  init: function(app, pages) {
    init = true;
    
    console.log("page", "init");
    
    page.setup(app, pages);
  },
  setup: function(app, pages) {
    if(!init)
      page.init(app, pages);
      
    console.log("page", "setup");
  }
};

module.exports = page;