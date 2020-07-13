//change   _template_  to your plugin name  

var pagesList = {
    "encrypt": {
        sort: 10,
        icon: "fa-lock"
    },
    "encrypt-file": {
        sort: 20,
        icon: "fa-file-archive-o"
    }
};


module.exports = {
    pagesList: pagesList,
    consumes: ["app"],
    provides: ["plugin_encrypt"],
    setup: function(options, imports, register) {

        var init = false;

        function gm_decode(str1) {
            var hex = str1.toString();
            var str = '';
            for (var n = 0; n < hex.length; n += 2) {
                str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
            }
            return str;
        }

        function gm_encode(str) {
            var arr1 = [];
            for (var n = 0, l = str.length; n < l; n++) {
                var hex = Number(str.charCodeAt(n)).toString(16);
                arr1.push(hex);
            }
            return arr1.join('');
        }

        var terminal_applied = false;

        var page = {};
        var $page = {
            view: require("./encrypt.page.html").default,
            init: function(app, $page, pathname) {
                init = true;

                /*
                var $ = app.$;
                var onlykeyApi = app.onlykeyApi;
                var onlykeyPGP = app.onlykeyApi.pgp;

                var tokenizer = require("../../jquery.tokenizer.js");

                if (tokenizer) {
                    tokenizer($, async function(itemName, returnValueFN) {
                        returnValueFN(await onlykeyApi.api.getKey(itemName));
                    });
                }

                page.gun = app.newGun();
                page.okpgp = onlykeyPGP();

                var params = onlykeyApi.api.getAllUrlParams();

                page.initParams = params;

                page.okpgp._$mode($("#action")[0].select_one.value);

                if (page.okpgp._$mode_is('Encrypt and Sign')) {
                    if (params.sender) document.getElementById('pgpkeyurl2').value = params.sender;
                    // if (params.recipients) document.getElementById('pgpkeyurl').value = params.recipients;
                    if (params.type == 'e') {
                        document.getElementById('encrypt_only').checked = true;
                        page.okpgp._$mode('Encrypt Only');
                        document.getElementById('pgpkeyurl2').style.display = "none";
                    }
                    if (params.type == 'es') document.getElementById('encrypt_and_sign').checked = true;
                    if (params.type == 's') {
                        document.getElementById('sign_only').checked = true;
                        page.okpgp._$mode('Sign Only');
                        document.getElementById('pgpkeyurl').style.display = "none";
                    }
                }

                page.okpgp.on("status", function(message) {
                    page.button.textContent = message;
                    app.xterm.writeln("OKPGP("+page.okpgp._$mode()+"): "+message);
                });

                page.okpgp.on("working", function() {
                    page.button.classList.remove('error');
                    page.button.classList.add('working');
                });

                page.okpgp.on("done", function() {
                    page.button.classList.remove('error');
                    page.button.classList.remove('working');
                });

                page.okpgp.on("error", function(msg) {
                    console.log("pgp-error", msg);
                    page.button.textContent = msg;
                    page.button.classList.add('error');
                    page.button.classList.remove('working');
                    if(page.statusEvents) page.statusEvents.emit("completed");
                });

                onlykeyApi.api.on("status", function(message) {
                    page.button.textContent = message;
                });

                onlykeyApi.api.on("error", function(message) {
                    console.log("okapi-error", message);
                    page.button.textContent = message;
                    page.button.classList.add('error');
                    page.button.classList.remove('working');
                    if(page.statusEvents) page.statusEvents.emit("completed");
                });
*/

                page.setup(app, $page, pathname, init);
            },
            setup: function(app, $page, pathname, doInit) {
                if (!init)
                    return page.init(app, $page, pathname);

                // if(!terminal_applied){
                //     app.xterm.set_element($page.find("#terminal_messages"));
                //     $page.find("#terminal_messages").siblings("h3").remove();
                //     terminal_applied = true;
                // }


                var $ = app.$;
                var onlykeyApi = app.onlykeyApi;

                if (doInit) {
                    
                    var tokenizer = require("../../jquery.tokenizer.js");

                    if (tokenizer) {
                        tokenizer($, async function(itemName, returnValueFN) {
                            returnValueFN(await onlykeyApi.api.getKey(itemName));
                        });
                    }

                    page.gun = app.newGun();
                    page.okpgp = app.onlykeyApi.pgp();

                    var params = onlykeyApi.api.getAllUrlParams();

                    page.initParams = params;

                    page.okpgp._$mode($("#action")[0].select_one.value);

                    if (page.okpgp._$mode_is('Encrypt and Sign')) {
                        if (params.sender) document.getElementById('pgpkeyurl2').value = params.sender;
                        // if (params.recipients) document.getElementById('pgpkeyurl').value = params.recipients;
                        if (params.type == 'e') {
                            document.getElementById('encrypt_only').checked = true;
                            page.okpgp._$mode('Encrypt Only');
                            document.getElementById('pgpkeyurl2').style.display = "none";
                        }
                        if (params.type == 'es') document.getElementById('encrypt_and_sign').checked = true;
                        if (params.type == 's') {
                            document.getElementById('sign_only').checked = true;
                            page.okpgp._$mode('Sign Only');
                            document.getElementById('pgpkeyurl').style.display = "none";
                        }
                    }

                    page.okpgp.on("status", function(message) {
                        page.button.textContent = message;
                        app.xterm.writeln("OKPGP(" + page.okpgp._$mode() + "): " + message);
                    });

                    page.okpgp.on("working", function() {
                        page.button.classList.remove('error');
                        page.button.classList.add('working');
                    });

                    page.okpgp.on("done", function() {
                        page.button.classList.remove('error');
                        page.button.classList.remove('working');
                    });

                    page.okpgp.on("error", function(msg) {
                        console.log("pgp-error", msg);
                        page.button.textContent = msg;
                        page.button.classList.add('error');
                        page.button.classList.remove('working');
                        if (page.statusEvents) page.statusEvents.emit("completed");
                    });

                    onlykeyApi.api.on("status", function(message) {
                        page.button.textContent = message;
                    });

                    onlykeyApi.api.on("error", function(message) {
                        console.log("okapi-error", message);
                        page.button.textContent = message;
                        page.button.classList.add('error');
                        page.button.classList.remove('working');
                        if (page.statusEvents) page.statusEvents.emit("completed");
                    });
                }
                else {
                    page.okpgp._$mode($("#action")[0].select_one.value);
                }

                app.xterm.writeln("Set PGP Mode to " + $("#action")[0].select_one.value);

                page.statusEvents = page.okpgp.reset();

                if (page.initParams.recipients) document.getElementById('pgpkeyurl').value = page.initParams.recipients;

                //enable tokenizedr
                $("input[data-provide='tokenizer']").each(function() {
                    var $element = $(this);
                    if ($element.data("tokenizer")) {
                        return;
                    }
                    $element.tokenizer($element.data());
                });


                $("#message").focus(function() {
                    $("#pgpkeyurl").data("tokenizer").addInput();
                });

                var mb = $("#message");
                mb.keyup(mbReSize);
                mb.change(mbReSize);

                function mbReSize() {
                    var _s = $(this)[0];
                    if ($(this).val() == "")
                        _s.style.height = 'auto';
                    if (_s.scrollHeight + 25 < ($(window).height())) {
                        // var y = window.scrollY;
                        _s.style.height = 'auto';
                        $(_s).height(_s.scrollHeight + 2);
                        // window.scrollY = y;
                    }
                    else {
                        $(_s).height(parseInt($(window).height()) - 25);
                    }
                }

                onlykeyApi.api.request_pgp_pubkey = function() {
                    function error_1(err) {
                        page.button.textContent = err;
                    }

                    function error_2(err) {
                        page.button.textContent = 'Your PublicKey is ' + err;
                    }
                    return new Promise(async function(resolve) {
                        var pubkey = $("#pgpkeyurl2").val();
                        if (pubkey == "" || !pubkey) {
                            resolve({ value: false, on_error: error_1 });
                        }
                        else {
                            pubkey = await onlykeyApi.api.getKey(pubkey);
                            resolve({
                                value: pubkey,
                                on_error: error_2
                            });
                        }
                    });
                };

                document.getElementsByTagName('fieldset')[0].style.backgroundColor = app.randomColor({
                    luminosity: 'bright',
                    format: 'rgba'
                });

                page.urlinputbox = document.getElementById('pgpkeyurl');
                page.urlinputbox2 = document.getElementById('pgpkeyurl2');
                page.messagebox = document.getElementById('message');
                page.button = document.getElementById('onlykey_start');

                var pageType = false;

                if (page.okpgp._$mode_is('Encrypt Only')) {
                    document.getElementById('pgpkeyurl2').style.display = "none";
                    document.getElementById('pgpkeyurl').style.display = "initial";
                    try { document.getElementById('pgpkeyurl_tokenizer').style.display = "block"; }
                    catch (e) {}
                    page.button.textContent = 'Encrypt';
                    pageType = "e";
                }

                if (page.okpgp._$mode_is('Sign Only')) {
                    document.getElementById('pgpkeyurl').style.display = "none";
                    document.getElementById('pgpkeyurl2').style.display = "initial";
                    try { document.getElementById('pgpkeyurl_tokenizer').style.display = "none"; }
                    catch (e) {}
                    page.button.textContent = 'Sign';
                    pageType = "s";
                }

                if (page.okpgp._$mode_is('Encrypt and Sign')) {
                    document.getElementById('pgpkeyurl').style.display = "initial";
                    document.getElementById('pgpkeyurl2').style.display = "initial";
                    try { document.getElementById('pgpkeyurl_tokenizer').style.display = "block"; }
                    catch (e) {}
                    page.button.textContent = 'Encrypt and Sign';
                    pageType = "es";
                }


                if (pageType)
                    app.pages.state.replace({ pathname: pathname }, $("title").text(),
                        "./" + pathname +
                        "?type=" + pageType +
                        (page.initParams.recipients ? "&recipients=" + page.initParams.recipients : ''));

                $(".messageLink").html("");
                //$(window).scrollTo("h1", 1000);

                page.statusEvents.on("completed", function(data) {
                    $(".messageLink").html("");

                    //add devider
                    var cp = $(`<hr/>`);
                    $(".messageLink").append(cp);

                    //add reset
                    var rb = $(`<button type="submit" id="resetstate">Reset</button>`);
                    rb.click(function() {
                        page.setup(app, $page, pathname);
                    });
                    $(".messageLink").append(rb);

                    if (data) {
                        //add cpy message share link btn
                        var ml = $(`<input type="text" id="messageLink_url"/><button type="submit" id="copylink">Get and Copy Share Link</button>`);


                        var reverse_status;
                        switch (page.okpgp._$mode()) {
                            case 'Encrypt and Sign':
                                reverse_status = "dv";
                                break;
                            case 'Sign Only':
                                reverse_status = "dv";
                                break;
                            case 'Encrypt Only':
                                reverse_status = "d";
                                break;
                        }

                        $(".messageLink").append(ml);

                        var $messageLink_url = $(".messageLink").find("#messageLink_url");
                        $messageLink_url.hide();

                        var cpb = $(".messageLink").find("#copylink");
                        var origTxt = cpb.text();
                        cpb.click(function() {

                            app.bs_modal_dialog.confirm("Copy Share Link",
                                `Generating a share link stores 'PGP Message' on a P2P network using 
                        <a href="https://gun.eco/" target="_blank">GUN</a>, and data is encrypted before storing in the network using <a href="https://gun.eco/docs/SEA" target="_blank">SEA</a>.<br/><br/><b>Do you wish to continue?</b>`, ["Yes"],
                                async function(cancel, ans) {
                                    if (ans == "Yes") {
                                        var pair = await app.SEA.pair();
                                        var secret = gm_encode(await app.SEA.secret(pair, pair));
                                        secret = secret.substring(0, 16);
                                        var $data = await app.SEA.encrypt(data, secret);

                                        var hash = await app.SEA.work($data, null, null, { name: "SHA-256" });
                                        page.gun.get("ok-messages#").get(hash).put($data, function(res) {
                                            console.log(hash, res);
                                            $messageLink_url.val("https://" + window.location.host + "/app/decrypt?type=" + reverse_status + "&gm=1#" + gm_encode(hash) + "-" + secret);
                                            $messageLink_url.show();
                                            $messageLink_url.focus();
                                            $messageLink_url.select();
                                            document.execCommand('copy');
                                            cpb.text(origTxt + " (copied)");
                                            setTimeout(() => { cpb.text(origTxt); }, 5000);
                                        });
                                    }
                                });

                        });
                    }

                    $(".messageLink").show();

                });

                $("#pgpkeyurl").change(function() {
                    switch (page.okpgp._$mode()) {
                        case 'Encrypt and Sign':
                            pageType = "es";
                            break;
                        case 'Sign Only':
                            pageType = "s";
                            break;
                        case 'Encrypt Only':
                            pageType = "e";
                            break;
                    }

                    if (pageType)
                        app.pages.state.replace({ pathname: pathname }, $("title").text(), "./" + pathname + "?type=" + pageType + "&recipients=" + page.urlinputbox.value);

                });

                if (!$("#action").data("changeSet")) {

                    $("#action").data("changeSet", true);
                    $("#action")[0].select_one.forEach(el => el.addEventListener('change', (function() {
                        page.setup(app, $page, pathname);
                    }).bind(null, false)));

                    page.button.addEventListener('click', async function() {

                        $("#pgpkeyurl").data("tokenizer").addInput(); //add input that is not "SET" fully

                        var message = null;
                        var file = null;

                        switch (page.okpgp._$mode()) {
                            case 'Encrypt and Sign':
                                pageType = "es";
                                break;
                            case 'Sign Only':
                                pageType = "s";
                                break;
                            case 'Encrypt Only':
                                pageType = "e";
                                break;
                        }

                        if (pageType)
                            app.pages.state.replace({ pathname: pathname }, $("title").text(), "./" + pathname + "?type=" + pageType + "&recipients=" + page.urlinputbox.value);

                        switch (page.okpgp._$status()) {
                            case 'pending_pin':
                                break;
                            case 'finished':
                                if (page.messagebox != null) {
                                    try {
                                        page.messagebox.focus();
                                        page.messagebox.select();
                                        var successful = document.execCommand('copy');
                                        var msg = successful ? 'successful' : 'unsuccessful';
                                        page.button.textContent = 'Done :)  Message copied to clipboard';
                                        console.info('Copying text command was ' + msg);
                                        if (!successful) page.button.textContent = 'Oops, unable to copy message to clipboard, try copying message manually';
                                    }
                                    catch (err) {
                                        page.button.textContent = 'Oops, unable to copy message to clipboard, try copying message manually';
                                        console.info('Oops, unable to copy');
                                    }
                                }
                                else {
                                    // send file to user
                                }
                                page.statusEvents.emit("completed");
                                break;
                            default:
                                switch (page.okpgp._$mode()) {
                                    case 'Encrypt and Sign':
                                    case 'Sign Only':


                                        console.log(page.okpgp._$mode());
                                        if (!onlykeyApi.api.init) await onlykeyApi.api.connect();
                                        if (!onlykeyApi.api.init) return;
                                        console.log(page.okpgp._$mode());

                                    case 'Encrypt Only':
                                        if (page.messagebox == null) {
                                            file = document.getElementById('file');
                                        }
                                        else {
                                            message = page.messagebox.value;
                                        }
                                        await page.okpgp.startEncryption(page.urlinputbox.value, page.urlinputbox2.value, message, file, async function(err, data) {
                                            if (page.messagebox && data)
                                                page.messagebox.value = data;
                                            $(page.messagebox).change();

                                            page.statusEvents.emit("completed", data);

                                        });
                                        break;

                                }

                        }
                    }, false);

                }

            },
            dispose: function(app, pathname) {
                //init = false;
                // terminal_applied = false;
                // console.log("disposed", pathname);
            }
        };

        page.init = $page.init;
        page.setup = $page.setup;

        pagesList["encrypt"] = $page;

        pagesList["encrypt-file"] = {
            view: require("./encrypt-file.page.html").default,
            init: $page.init,
            setup: $page.setup
        };


        register(null, {
            plugin_encrypt: {
                pagesList: pagesList
            }
        });


    }
};