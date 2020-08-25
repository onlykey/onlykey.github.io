//change   _template_  to your plugin name  

var pagesList = {
    "index": {}
};


module.exports = {
    pagesList: pagesList,
    consumes: ["app", "onlykeyApi"],
    provides: ["plugin_index"],
    setup: function(options, imports, register) {
        var fired = false;

        function doSetTime(timeout) {
            // console.log("setting time")
            if (fired) return;
            setTimeout(function() {

                fired = true;
                imports.onlykeyApi.api.check(function(asd) {
                    // console.log(asd)
                });

            }, timeout);
        }

        var page = {
            view: false,
            init: function(app) {
                app.on("ok-connected", function(version) {
                    app.$("#setTime").after("<h2 class='text-danger'>OnlyKey Time Set<br/> OTP/2FA Authentication Ready</h2>");
                    app.$("#setTime").remove();
                });

                app.$("#setTime").click(doSetTime.bind(null, 1));
                // app.$("#setTime").click();
            }
        };

        pagesList["index"] = page;

        register(null, {
            "plugin_index": {
                pagesList: pagesList,
                init: function() {
                    // if(document.hasFocus())//firefox fix, firefox aborts onlykey request when not in focus
                    imports.app.on("start", doSetTime.bind(null, 2000));
                    // else
                    // imports.app.on("start",function(){
                    //     if(imports.app.$("#setTime").length == 0)
                    //         imports.app.$(document).focus(doSetTime);    
                    // });
                }
            }
        });


    }
};