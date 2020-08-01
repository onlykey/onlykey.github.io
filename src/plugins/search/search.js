//change   _template_  to your plugin name  

var pagesList = {
    "search": {
        sort: 30,
        icon: "fa-search",
        //   title: "Chat"
    }
};


module.exports = {
    pagesList: pagesList,
    consumes: ["app"],
    provides: ["plugin_search"],
    setup: function(options, imports, register) {
        var init = false;


        var page = {
            view: require("./search.page.html").default,
            init: function(app, $page, pathname) {
                init = true;

                // var onlykeyApi = app.onlykeyApi;
                page.p2g = app.onlykeyApi.pgp();

                var params = app.pages.getAllUrlParams();

                //if (params.q.slice(0, 10) == "-----BEGIN") {
                if (params.q)
                    params.q = unescape(params.q);
                //}
                if (params.q) {
                    app.$('#user').val(params.q);
                    // $('#submit').click();
                }


                page.setup(app, $page, pathname);
            },
            setup: function(app, $page, pathname) {
                if (!init)
                    return page.init(app, $page, pathname);

                // var pgpDecoder = require("../../pgp-decoder/pgp.decoder.js");
                var pgpDecoder = imports.app.pgpDecoder;

                var default_anonymous_email = "onlykey@crp.to";

                var forge = app.forge;
                var $ = app.$;

                document.getElementsByTagName('fieldset')[0].style.backgroundColor = app.randomColor({
                    luminosity: 'bright',
                    format: 'rgba'
                });


                $('#submit').click(function(e) {

                    var sites = {
                        q: $("#sites option:selected").val(),
                        rpp: 5
                    };
                    var users = {
                        q: $('#user').val(),
                        rpp: 5
                    };
                    searchKeybase(sites, users);

                    e.preventDefault();
                    return false; // prevents default click action
                });


                if ($('#user').val())
                    $('#submit').click();

                function searchLayout() {
                    var outDiv = $("<div class='outline row'>");
                    $("#results").append(outDiv);
                    var leftDiv_outter = $("<div class='col-sm'>");
                    outDiv.append(leftDiv_outter);
                    var rightDiv_outter = $("<div class='col-sm'>");
                    outDiv.append(rightDiv_outter);
                    var leftDiv = $("<div class='block-inner'>");
                    leftDiv_outter.append(leftDiv);
                    var rightDiv = $("<div class='block-inner'>");
                    rightDiv_outter.append(rightDiv);

                    return {
                        outDiv: outDiv,
                        leftDiv: leftDiv,
                        leftDiv_outter: leftDiv_outter,
                        rightDiv: rightDiv,
                        rightDiv_outter: rightDiv_outter,
                    };
                }

                async function searchKeybase(sites, user) {
                    console.info("sites");
                    console.info(sites);
                    console.info("user");
                    console.info(user);
                    $("#results").html("");

                    // var decodedkey = pgpDecoder(response_text);
                    // console.log(decodedkey);
                    //use pgpDecoder to grab keyid and search keyid instead of user.q
                    if (user.q.slice(0, 10) == "-----BEGIN") {
                        var decodedkey = pgpDecoder(user.q);
                        app.pages.state.replace({ pathname: pathname }, $("title").text(), "./search?q=" + escape(user.q));
                        console.log(decodedkey);

                        for (var i in decodedkey) {
                            if (decodedkey[i]) {
                                console.log(decodedkey[i]);

                                if (decodedkey[i].algorithm)
                                    console.log(decodedkey[i].algorithm.toJSON());

                                if (decodedkey[i].hashAlgorithm)
                                    console.log(decodedkey[i].hashAlgorithm.toJSON());

                                if (decodedkey[i].packet)
                                    console.log(decodedkey[i].packet.toJSON());
                            }
                            console.log("--------");
                        }

                        return;
                    }
                    else
                        app.pages.state.replace({ pathname: pathname }, $("title").text(), "./search?q=" + user.q);

                    switch (true) {
                        case (sites.q == 'protonmail' || sites.q == 'all'):

                            var $user = user.q;
                            if ($user && !($user.indexOf("0x") == 0) && !$user.split("@")[1])
                                $user += "@protonmail.com";

                            var response_text = await app.onlykeyApi.api.getKey($user, "protonmail");
                            console.log(response_text);


                            var sl = searchLayout();



                            page.p2g.getPublicKeyInfo(response_text, function(err, theKey) {
                                if (theKey) {

                                    var email = theKey.pgp.userids[0].components.email;
                                    var username = theKey.pgp.userids[0].components.username;
                                    var keyid = "0x" + theKey.pgp.key_manager.get_pgp_key_id().toString("hex").toUpperCase();
                                    var keyid_short = theKey.pgp.key_manager.get_pgp_short_key_id();
                                    var fingerprint = theKey.pgp.get_fingerprint().toString("hex").toUpperCase();
                                    var keyType = theKey.pgp.primary.key.pub.type;

                                    sl.leftDiv.append("<img src='https://www.gravatar.com/avatar/" + forge.md5.create().update(email).digest().toHex() + "?s=1024default=https%3A%2F%2Fgravatar.com%2Favatar%2F" + forge.md5.create().update(default_anonymous_email).digest().toHex() + "' />");
                                    sl.rightDiv.append("<font color='red'>Protonmail Username = " + username + "</font>");
                                    sl.rightDiv.append("<p>"+email+"</p>");
                                    sl.rightDiv.append("<p>GPG KeyID: " + keyid + " (" + keyid_short + ")" + "<br/>Fingerprint: " + fingerprint + "</p>");
                                    
                                    for (var b in app.kbpgp.const.openpgp.public_key_algorithms) {
                                        if (app.kbpgp.const.openpgp.public_key_algorithms[b] == keyType)
                                            sl.rightDiv.append("<p>KeyType " + b + "</p>");
                                    }

                                    sl.rightDiv.append("Send Encrypted <a class='btn btn-success' target='_blank' href='./encrypt?type=e&recipients=" + username + "'>Message</a> <a class='btn btn-success' target='_blank' href='./encrypt-file?type=e&recipients=" + username + "'>File</a><br>");

                                    var $getpgp_btn = $("<button class='btn btn-success'>Copy PGP Key</button>");
                                    var $pgp_copybox = $("<textarea>&nbsp;</textarea>");
                                    sl.rightDiv.append($getpgp_btn);
                                    sl.rightDiv.append($pgp_copybox);
                                    $pgp_copybox.hide();
                                    $getpgp_btn.click(async function() {
                                        $pgp_copybox.val(response_text);
                                        $pgp_copybox.show();
                                        $pgp_copybox.focus();
                                        $pgp_copybox.select();
                                        document.execCommand('copy');
                                        $pgp_copybox.hide();
                                        var origTxt = $getpgp_btn.text();
                                        $getpgp_btn.text(origTxt + " (copied)");
                                        setTimeout(() => { $getpgp_btn.text(origTxt); }, 5000);
                                    });

                                    // console.log(theKey);
                                }
                            });
                            if (!(sites.q == 'all'))
                                break;
                        case (sites.q == 'keybase' || sites.q == 'all'):
                            //https://keybase.io/_/api/1.0/user/lookup.json?uid=4a4f61cdab6a13fb904599ef0159bd19
                            var kburl = 'https://keybase.io/_/api/1.0/user/user_search.json?q=' + user.q;
                            $.ajax({
                                url: kburl,
                                async: true,
                                dataType: 'json',
                                success: function(data) {
                                    console.info(data);
                                    var result = data.list;
                                    if (result && result.length)
                                        result.forEach(function(element) {
                                            console.log(element);
                                            console.log(element.components);
                                            var listItem = element.keybase;

                                            if (listItem.uid) {
                                                $.ajax({
                                                    url: 'https://keybase.io/_/api/1.0/user/lookup.json?uid=' + listItem.uid,
                                                    async: true,
                                                    dataType: 'json',
                                                    success: async function(data) {
                                                        console.log(data);
                                                        if (listItem.username) {

                                                            var url = 'https://keybase.io/' + listItem.username + '/pgp_keys.asc';
                                                            var response_text = await app.onlykeyApi.api.getKey(url);

                                                            page.p2g.getPublicKeyInfo(response_text, function(err, theKey) {
                                                                if (theKey) {


                                                                    var email = theKey.pgp.userids[0].components.email;
                                                                    var username = theKey.pgp.userids[0].components.username;
                                                                    var keyid = "0x" + theKey.pgp.key_manager.get_pgp_key_id().toString("hex").toUpperCase();
                                                                    var keyid_short = theKey.pgp.key_manager.get_pgp_short_key_id();
                                                                    var fingerprint = theKey.pgp.get_fingerprint().toString("hex").toUpperCase();
                                                                    var keyType = theKey.pgp.primary.key.pub.type;

                                                                    var sl = searchLayout();
                                                                    if (listItem.picture_url != null)
                                                                        sl.leftDiv.append("<img src='" + listItem.picture_url + "' width='10' height='auto'/><br>");
                                                                    else sl.leftDiv.append("<img src='https://raw.githubusercontent.com/keybase/client/master/browser/images/icon-keybase-logo-128.png' />");


                                                                    sl.rightDiv.append("<font color='red'>Keybase Username = <a color='red' class='d-inline' href='https://keybase.io/" + listItem.username + "'>" + listItem.username + "</a></font>");
                                                                    if (listItem.full_name) sl.rightDiv.append("<p>Full Name = " + listItem.full_name + "</p>");
                                                                    sl.rightDiv.append("<p>"+email+"</p>");
                                                                    sl.rightDiv.append("View Keybase Profile <a href='https://keybase.io/" + listItem.username + "'>Here</a>");
                                                                    sl.rightDiv.append("<p>GPG KeyID: " + keyid + " (" + keyid_short + ")" + "<br/>Fingerprint: " + fingerprint + "</p>");
                                                                    
                                                                    for (var b in app.kbpgp.const.openpgp.public_key_algorithms) {
                                                                        if (app.kbpgp.const.openpgp.public_key_algorithms[b] == keyType)
                                                                            sl.rightDiv.append("<p>KeyType " + b + "</p>");
                                                                    }
                                                                    
                                                                    for (var i in element.services_summary) {
                                                                        var srv = element.services_summary[i].service_name.toUpperCase();
                                                                        switch (srv) {
                                                                            case 'GITHUB':
                                                                                sl.rightDiv.append("<a target='_blank' class='color-blue' href='https://github.com/" + element.services_summary[i].username + "'>" +
                                                                                    srv + " Username = " + element.services_summary[i].username + "</a><br>");
                                                                                break;
                                                                            case 'REDDIT':
                                                                                sl.rightDiv.append("<a target='_blank' class='color-blue' href='https://www.reddit.com/user/" + element.services_summary[i].username + "'>" +
                                                                                    srv + " Username = " + element.services_summary[i].username + "</a><br>");
                                                                                break;
                                                                            case 'TWITTER':
                                                                                sl.rightDiv.append("<a target='_blank' class='color-blue' href='https://twitter.com/" + element.services_summary[i].username + "'>" +
                                                                                    srv + " Username = " + element.services_summary[i].username + "</a><br>");
                                                                                break;

                                                                            default:
                                                                                sl.rightDiv.append("<font color='blue'>" + element.services_summary[i].service_name.toUpperCase() + " Username = " + element.services_summary[i].username + "</font><br>");
                                                                        }
                                                                    }

                                                                    sl.rightDiv.append("Send Encrypted <a class='btn btn-success' target='_blank' href='./encrypt?type=e&recipients=" + listItem.username + "'>Message</a> <a class='btn btn-success' target='_blank' href='./encrypt-file?type=e&recipients=" + listItem.username + "'>File</a><br>");

                                                                    var $getpgp_btn = $("<button  class='btn btn-success'>Copy PGP Key</button>");
                                                                    var $pgp_copybox = $("<textarea>&nbsp;</textarea>");
                                                                    sl.rightDiv.append($getpgp_btn);
                                                                    sl.rightDiv.append($pgp_copybox);
                                                                    $pgp_copybox.hide();
                                                                    $getpgp_btn.click(async function() {
                                                                        $pgp_copybox.val(response_text);
                                                                        $pgp_copybox.show();
                                                                        $pgp_copybox.focus();
                                                                        $pgp_copybox.select();
                                                                        var successful = document.execCommand('copy');
                                                                        $pgp_copybox.hide();
                                                                        var origTxt = $getpgp_btn.text();
                                                                        $getpgp_btn.text(origTxt + " (copied)");
                                                                        setTimeout(() => { $getpgp_btn.text(origTxt); }, 5000);
                                                                    });
                                

                                                                }
                                                            });
                                                        }
                                                    }
                                                });
                                            }
                                            // else {
                                            //   $("#results").append("<br>No matchs found!");
                                            // }
                                        });
                                }
                            });
                            if (!(sites.q == 'all'))
                                break;

                    }


                    //$(window).scrollTo("#results", 800);
                }

            },
            dispose: function(app, pathname) {
                //init = false;
                // console.log("disposed", pathname);
            }
        };


        pagesList["search"] = page;

        register(null, {
            "plugin_search": {
                pagesList: pagesList
            }
        });


    }
};