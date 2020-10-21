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
        if (url.indexOf("index") > -1) url = url.replace("index", "");
        History.replaceState(data, title, url);
      }
    };

    function hrefTakeover(tag) {
      var urlPath = tag.attr('href');
      var target = tag.attr('target');
      if (urlPath == "#") return true;
      if (target == "_blank") return true;

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

      if (pageName == "index") {
        if (pages[pageName].init) pages[pageName].init(imports.app, false, pageName);
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

    //todo: move getAllUrlParams to pages plugin
    pages.getAllUrlParams = function getAllUrlParams(url) {
      // get query string from url (optional) or window
      var queryString = url ? url.split('?')[1] : window.location.search.slice(1);
      // we'll store the parameters here
      var obj = {
        "#": window.location.hash.split('#')[1] // add the hash
      };
      // if query string exists
      if (queryString) {
        // stuff after # is not part of query string, so get rid of it
        queryString = queryString.split('#')[0];
        // split our query string into its component parts
        var arr = queryString.split('&');
        for (var i = 0; i < arr.length; i++) {
          // separate the keys and the values
          var a = arr[i].split('=');
          // set parameter name and value (use 'true' if empty)
          var paramName = a[0];
          var paramValue = typeof(a[1]) === 'undefined' ? true : a[1];

          // (optional) keep case consistent
          //paramName = paramName.toLowerCase();
          //if (typeof paramValue === 'string') paramValue = paramValue.toLowerCase();

          // if the paramName ends with square brackets, e.g. colors[] or colors[2]
          if (paramName.match(/\[(\d+)?\]$/)) {
            // create key if it doesn't exist
            var key = paramName.replace(/\[(\d+)?\]/, '');
            if (!obj[key]) obj[key] = [];
            // if it's an indexed array e.g. colors[2]
            if (paramName.match(/\[\d+\]$/)) {
              // get the index value and add the entry at the appropriate position
              var index = /\[(\d+)\]/.exec(paramName)[1];
              obj[key][index] = paramValue;
            }
            else {
              // otherwise add the value to the end of the array
              obj[key].push(paramValue);
            }
          }
          else {
            // we're dealing with a string
            if (!obj[paramName]) {
              // if it doesn't exist, create property
              obj[paramName] = paramValue;
            }
            else if (obj[paramName] && typeof obj[paramName] === 'string') {
              // if property does exist and it's a string, convert it to an array
              obj[paramName] = [obj[paramName]];
              obj[paramName].push(paramValue);
            }
            else {
              // otherwise add the property
              obj[paramName].push(paramValue);
            }
          }
        }
      }
      return obj;
    }


    register(null, {
      pages: pages
    });


  }
};