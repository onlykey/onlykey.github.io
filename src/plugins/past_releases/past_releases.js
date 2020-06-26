//change   _template_  to your plugin name  

var pagesList = {
    "past_releases": {}
};


module.exports = {
    pagesList: pagesList,
    consumes: ["app"],
    provides: ["plugin_past_releases"],
    setup: function(options, imports, register) {
        var init = false;


        var page = {

            init: function(app, $page, pathname) {
                init = true;

                page.setup(app, $page, pathname);
            },
            setup: function(app, $page, pathname) {
                if (!init)
                    return page.init(app, $page);

                var onlykeyApi = app.onlykeyApi;
                var $ = app.$;

                window.fetch('../past_releases/past_releases.json')
                    .then(response => response.json())
                    .then(data => {

                        var current;
                        var releaseList = {},
                            rl = {};

                        var j;

                        for (j in data) {
                            if (!(j.indexOf("current") == -1)) {
                                current = data[j];
                                continue;
                            }
                            rl[j] = data[j];
                        }
                        data = rl;

                        for (j in data) {
                            if (j == current) {
                                continue;
                            }
                            releaseList[j] = data[j];
                        }

                        $('<hr>').appendTo($("#releases"));

                        if (current)
                            releaseView(current, data[current], true);

                        for (var i in releaseList) {
                            $('<hr>').appendTo($("#releases"));
                            releaseView(i, releaseList[i]);
                        }



                        function releaseView(releasesName, releaseData, is_current) {

                            var contain = $('<div>').appendTo($("#releases"));
                            if (is_current) {
                                contain.append("<h2>" + releaseData.name + " : " + releaseData.stage + releaseData.version + "(live)</h2>");
                                contain.append('<a href="../" class="yui3-button primary-button">Open ' + releaseData.stage + releaseData.version + '(live)</a>');
                            }
                            else {
                                contain.append("<h2>" + releaseData.name + " : " + releaseData.stage + releaseData.version + (is_current ? "(live)" : "") + "</h2>");
                                contain.append('<a href="../past_releases/' + releasesName + '" class="yui3-button primary-button">Open ' + releaseData.stage + releaseData.version + (is_current ? "(live)" : "") + '</a>');

                            }
                            if (releaseData.authors) {
                                var i;
                                for (i in releaseData.change_log) {
                                    contain.append("<p>*" + releaseData.change_log[i] + "</p>");
                                }
                                if (releaseData.firmware_release_url)
                                    contain.append("<p><a href='" + releaseData.firmware_release_url[i] + "'>Firmware</a></p>");
                                for (i in releaseData.authors) {
                                    contain.append("<p>" + releaseData.authors[i] + "</p>");
                                }
                            }



                        }

                        var vRequest = onlykeyApi.getAllUrlParams().version;
                        if (vRequest && data[vRequest]) {
                            setTimeout(() => {

                                window.location = "../past_releases/" + vRequest;

                            }, 200);
                        }
                    });

            }
        };


        pagesList["past_releases"] = page;

        register(null, {
            "plugin_past_releases": {
                pagesList: pagesList
            }
        });


    }
};