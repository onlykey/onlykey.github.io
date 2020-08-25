//change   _template_  to your plugin name  

var pagesList = {
    "password-generator": {
        sort:35,
        icon: "fa-key",
        //   title: "Chat"
    }
};


module.exports = {
    pagesList: pagesList,
    consumes: ["app"],
    provides: ["plugin_password-generator"],
    setup: function(options, imports, register) {

        var init = false;
        var page = {
            view: require("./password-generator.page.html").default,
            init: function(app, $page, pathname) {
                init = true;


                page.setup(app, $page, pathname);
            },
            setup: function(app, $page, pathname) {
                if (!init)
                    return page.init(app, $page, pathname);


                var onlykey3rd = app.onlykey3rd;
                var ok = onlykey3rd(1, 0);
                var $ = app.$;

                $("#onlykey_start").click(async function() {
                    var phrase = $("#phrase").val();
                    ok.derive_public_key(phrase, function(error, phrasePubkey) {
                        ok.derive_shared_secret(phrase, phrasePubkey, async function(error, phrasePubkeySecret) {
                            $("#phrase_out").val(phrasePubkeySecret);
                        });
                    });
                });
            }
        };

        pagesList["password-generator"] = page;
        
        register(null, {
            "plugin_password-generator": {
                pagesList: pagesList
            }
        });


    }
};