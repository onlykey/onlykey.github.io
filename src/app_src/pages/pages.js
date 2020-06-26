module.exports = {
  consumes: ["app", "$"],
  provides: ["pages"],
  setup: function(options, imports, register) {

    var app = imports.app;
    var $ = imports.$;
    var History = window.History;
    var EventEmitter = require("events").EventEmitter;

    $(".startHidden").hide().removeClass("startHidden");

    var init_page_id = $("body").data("page");

    var start_title = $("title").text().split("-")[0];

    var pages = new EventEmitter();

    pages.state = {
      push: function(data, title, url) {
        History.pushState(data, title, url);
      },
      replace: function(data, title, url) {
        if(url.indexOf("index") > -1) url = url.replace("index","");
        History.replaceState(data, title, url);
      }
    };

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
        if (page_id == "index") return true;

        // var title = $(this).text();

        if (urlPath.indexOf("/") == 0 || urlPath.indexOf("./") == 0) {
          var _hash = pathHref(urlPath);
          if (pages[_hash].view && lastRender != _hash) {
            pages.state.push({ pathname: _hash }, start_title + " - " + capitalizeFLetter(_hash), urlPath);
            e.preventDefault();
            return false; // prevents default click action of <a ...>
          }
          else if (lastRender == _hash) {
            e.preventDefault();
            return false;
          }
          else
            return true;
        }
        
        
        return true;
        //else if (urlPath.indexOf("#") > -1) {
          //urlPath = "/"+urlPath.substring(urlPath.indexOf("#")+1);
          //_self.pushState(urlPath, title, urlPath);
        //}

      });
    }

    function pathHref(urlPath) {
      var _hash = urlPath.split("?")[0].split("~").shift().substring(1);
      if (_hash.indexOf("/") == 0) _hash = _hash.substring(1);
      return _hash;
    }

    function capitalizeFLetter(input) {
      var string = input;
      return string[0].toUpperCase() + string.slice(1);
    }

    var lastRender = false;

    function renderPage(pageName, init) {
      
      if (pageName == "index"){
        if(pages[pageName].init) pages[pageName].init(imports.app);
        return true;
      } 
        
      if (lastRender && typeof pages[lastRender].dispose == "function")
        pages[lastRender].dispose(imports.app, lastRender);

      lastRender = pageName;

      var $p;
      if (pages[pageName].view) {
        $p = $(pages[pageName].view);
        $("#container").html($p);
        $("body").data("page", pageName);
      }

      if (init && pages[pageName].init)
        pages[pageName].init(imports.app, $p, pageName);

      else if (pages[pageName].setup)
        pages[pageName].setup(imports.app, $p, pageName);
      
      
      $("title").text(start_title + " - " + capitalizeFLetter(pageName));
      
      pages.emit("render", pageName, $p);
      
      return $p;
    }

    // Bind to StateChange Event
    History.Adapter.bind(window, 'statechange', function() { // Note: We are using statechange instead of popstate

      var State = History.getState(); // Note: We are using History.getState() instead of event.state
      if (State.data.pathname && lastRender != State.data.pathname && pages[State.data.pathname]) {
        renderPage(State.data.pathname);
        app.emit("state.change", State.data.pathname);
      }
      else {
        if (lastRender != State.data.pathname)
          window.location = State.hashedUrl;
      }
    });


    pages.init = function() {

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
      
      for (var k in app) {
        if (k == "pages") continue;
        if (app[k] && app[k].pagesList) {
          var PL = app[k].pagesList;
          for (var i in PL) {
            if (typeof PL[i] == "object") {
              pages[i] = PL[i];
              continue;
            }
          }
        }
      }
        
      renderPage(init_page_id, true);

    };

    register(null, {
      pages: pages
    });


  }
};