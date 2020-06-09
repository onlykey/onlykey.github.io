module.exports = {
  consumes: ["app", "$"],
  provides: ["pages"],
  setup: function(options, imports, register) {

    var app = imports.app;
    // var url = require("url");
    var $ = imports.$;
    var History = window.History;

    var pagesList = [
      "decrypt",
      "decrypt-file",
      "encrypt",
      "encrypt-file",
      "search",
      "password-generator"
    ];


    var pages = {};

    for (var i in pagesList) {
      pages[pagesList[i]] = require("./page_files/" + pagesList[i] + ".page.html").default;
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
        if(page_id == "index") return;
        var title = $(this).text();
        if (urlPath.indexOf("/") == 0 || urlPath.indexOf("./") == 0) {
          var _hash = pathHref(urlPath);
          if (pages[_hash]) {
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

    function renderPage(pageName) {
      var p = $(pages[pageName]);
      if (p){
        $("#container").html(p);
        $("body").data("page",pageName);
      }
    }

    renderPage($("body").data("page"));

    register(null, {
      pages: {
        init: function() {

          imports.app.on("start", function() {

          });
        }
      }
    });


  }
};