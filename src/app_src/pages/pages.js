module.exports = {
  consumes: ["app", "$"],
  provides: ["pages"],
  setup: function(options, imports, register) {

    var app = imports.app;
    var $ = imports.$;
    var History = window.History;
    var EventEmitter = require("events").EventEmitter;
    
    var init_page_id = $("body").data("page");

    var pagesList = [
      "index",
      "decrypt",
      "decrypt-file",
      "encrypt",
      "encrypt-file",
      "search",
      "password-generator",
      "past_releases",
    ];


    var pages = new EventEmitter();
    
    for (var i in pagesList) {
      try {
        pages[pagesList[i]] = require("./page_actions/" + pagesList[i] + ".page.js");
      }
      catch (e) {
        pages[pagesList[i]] = {};
      }
      if(!pages[pagesList[i]].view)
        try {
          pages[pagesList[i]].view = require("./page_files/" + pagesList[i] + ".page.html").default;
        }
        catch (e) {
          pages[pagesList[i]].view = false;
        }
    }

    // Bind to StateChange Event
    History.Adapter.bind(window, 'statechange', function() { // Note: We are using statechange instead of popstate
      var State = History.getState(); // Note: We are using History.getState() instead of event.state
      if (State.data.pathname && pages[State.data.pathname]) {
        renderPage(State.data.pathname);
        app.emit("state.change", State.data.pathname);
      }
      else {
        window.location = State.hashedUrl;
      }
    });

    function hrefTakeover(tag) {
      var urlPath = tag.attr('href');
      if (urlPath == "#") return true;

      if (!tag.data("href-takeover")) {
        tag.data("href-takeover", true);
      }
      else {
        return;
      }

      tag.click(function(e) {

        var page_id = $("body").data("page");
        if (page_id == "index") return;
        var title = $(this).text();
        if (urlPath.indexOf("/") == 0 || urlPath.indexOf("./") == 0) {
          var _hash = pathHref(urlPath);
          if (pages[_hash].view) {
            History.pushState({ pathname: _hash }, title, urlPath);
            e.preventDefault();
            return false; // prevents default click action of <a ...>
          }
          else
            return true;
        }
        else if (urlPath.indexOf("#") > -1) {
          //urlPath = "/"+urlPath.substring(urlPath.indexOf("#")+1);
          //_self.pushState(urlPath, title, urlPath);
        }

      });
    }

    function pathHref(urlPath) {
      var _hash = urlPath.split("?")[0].split("~").shift().substring(1);
      if (_hash.indexOf("/") == 0) _hash = _hash.substring(1);
      return _hash;
    }

    $("a").each(function(i, v) {
      hrefTakeover($(v));
    });

    $(document).on('DOMNodeInserted', function(e) {
      if (e.target.tagName == "A") {
        hrefTakeover($(e.target));
      }
      else {
        $(e.target).find("a").each(function(index, value) {

          hrefTakeover($(value));
        });
      }
    });

    function renderPage(pageName, init) {
      var p;
      if (pages[pageName].view) {
        p = $(pages[pageName].view);
        $("#container").html(p);
        $("body").data("page", pageName);
      }
      
      if (init &&pages[pageName].init)
        pages[pageName].init(imports.app, pages);
      
      else if (pages[pageName].setup)
        pages[pageName].setup(imports.app, pages);
      
      pages.emit("render",pageName, p);
    }

    
    pages.init = function(){
      renderPage(init_page_id, true);  
    };
    
    register(null, {
      pages: pages
    });


  }
};