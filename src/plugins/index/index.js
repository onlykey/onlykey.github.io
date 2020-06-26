//change   _template_  to your plugin name  

var pagesList = {
    "index": {}
};


module.exports = {
    pagesList: pagesList,
    consumes: ["app"],
    provides: ["plugin_index"],
    setup: function(options, imports, register) {
        
        var page = {
            view: false,
            init: function(app) {
                function doSetTime() {
                    app.onlykey3rd(1, 0).connect(function(err) {
                        if (!err) {
                            app.$("#setTime").after("<h2 class='text-danger'>OnlyKey Time Set<br/> OTP/2FA Authentication Ready</h2>");
                            app.$("#setTime").remove();
                        }
                    });
                }
                app.$("#setTime").click(doSetTime);
                app.$("#setTime").click();
            }
        };
        
        pagesList["index"] = page;

        register(null, {
            "plugin_index": {
                pagesList: pagesList
            }
        });


    }
};