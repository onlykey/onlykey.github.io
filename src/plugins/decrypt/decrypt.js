//change   _template_  to your plugin name  

var pagesList = {
    "decrypt": {
        sort: 15,
        icon: "fa-unlock"
    },
    "decrypt-file": {
        sort: 25,
        icon: "fa-file-text"
    }
};

module.exports = {
    pagesList: pagesList,
    consumes: ["app"],
    provides: ["plugin_decrypt"],
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

        var page = {}; //encrypt and encrypt-file will take over this object;

        var $page = {
            view: require("./decrypt.page.html").default,
            init: function(app, $page, pathname) {
                init = true;
                page.setup(app, $page, pathname, init);
            },
            setup: function(app, $page, pathname, doInit) {
                if (!init)
                    return page.init(app, $page, pathname);

                var $ = app.$;
                var onlykeyApi = app.onlykeyApi;

                page.okpgp = onlykeyApi.pgp().api();
                
                if (doInit) {
                    page.gun = app.newGun();
                
                    var params = app.pages.getAllUrlParams();
                    if (params.type == 'dv') document.getElementById('decrypt_and_verify').checked = true;
                    if (params.type == 'd') document.getElementById('decrypt_only').checked = true;
                    if (params.sender) document.getElementById('pgpkeyurl').value = params.sender;
                    
                    if (params.gm == 1) {
                        var gm = params["#"].split("-");
                        page.gun_message_key = gm[1];
                        page.gun_message = gm_decode(gm[0]);
                    }
                    
                    onlykeyApi.api.on("status", function(message) {
                        page.button.textContent = message;
                    });
    
                    onlykeyApi.api.on("error", function(message) {
                        console.log("okapi-error", message);
                        page.button.textContent = message;
                        page.button.classList.add('error');
                        page.button.classList.remove('working');
                    });
                }
                
                page.okpgp._$mode($("#action")[0].select_one.value);
                

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
                    if (page.okpgp) page.okpgp.emit("completed");
                });


                app.xterm.writeln("PGP Mode to " + page.okpgp._$mode());

                $(".messageLink").html("");
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


                document.getElementsByTagName('fieldset')[0].style.backgroundColor = app.randomColor({
                    luminosity: 'bright',
                    format: 'rgba'
                });

                page.urlinputbox = document.getElementById('pgpkeyurl');
                page.urlinputbox2 = document.getElementById('pgpkeyurl2');
                page.messagebox = document.getElementById('message');
                page.button = document.getElementById('onlykey_start');

                page.button.classList.remove('error');
                page.button.classList.remove('working');

                var dlgmI = 0;
                var dlGM = async function() {
                    if (page.gun_message && page.gun_message_key) {
                        page.messagebox.value = "Loading Stored Message";
                        var m = page.gun_message;
                        var stored = await page.gun.get("ok-messages#").get(m);
                        if (stored) {
                            page.gun_message = false;
                            page.messagebox.value = await app.SEA.decrypt(stored, page.gun_message_key);
                            mb.change();
                        }
                        else if (dlgmI < 30) {
                            dlgmI += 1;
                            var ex = "";
                            for (var i = 0; i < dlgmI; i++)
                                ex += ".";
                            page.messagebox.value = "Loading Stored Message" + ex;
                            setTimeout(dlGM, 1000);
                        }
                        else {
                            page.gun_message = false;
                            page.messagebox.value = "Unable to load Stored Message";
                        }
                    }
                };
                dlGM();

                var pageType = false;

                switch (page.okpgp._$mode()) {
                    case 'Decrypt and Verify':
                        $("#pgpkeyurl").show();
                        $("#pgpkeyurl2").show();
                        $("#pgpkeyurl_tokenizer").show();
                        $("#message").show();
                        page.button.textContent = 'Decrypt and Verify';
                        pageType = "dv";
                        break;
                    case 'Decrypt Only':
                        $("#pgpkeyurl").show();
                        $("#pgpkeyurl2").show();
                        $("#pgpkeyurl_tokenizer").show();
                        $("#message").show();
                        pageType = "d";
                        page.button.textContent = 'Decrypt';
                        break;
                }


                if (pageType)
                    app.pages.state.replace({ pathname: pathname }, $("title").text(), "./" + pathname + "?type=" + pageType);


                //$(window).scrollTo("h1", 1000);

                page.okpgp.on("completed", function(data) {
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

                    $(".messageLink").show();

                });


                if (!$("#action").data("changeSet")) {
                    $("#action").data("changeSet", true);
                    $("#action")[0].select_one.forEach(el => el.addEventListener('change', (function() {
                        page.setup(app, $page, pathname);
                    }).bind(null, false)));
                    page.button.addEventListener('click', async function() {

                        var message = null;
                        var file = null;

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
                                page.okpgp.emit("completed");
                                break;
                            default:
                                switch (page.okpgp._$mode()) {
                                    case 'Decrypt and Verify':
                                    case 'Decrypt Only':

                                        console.log(page.okpgp._$mode());
                                        if (!onlykeyApi.api.init) await onlykeyApi.api.connect();
                                        if (!onlykeyApi.api.init) return;
                                        console.log(page.okpgp._$mode());

                                        if (page.messagebox == null) {
                                            file = document.getElementById('file');
                                        }
                                        else {
                                            message = page.messagebox.value;
                                        }
                                        page.okpgp.startDecryption(page.urlinputbox.value, page.urlinputbox2.value, message, file, function(err, data) {
                                            if (page.messagebox && data)
                                                page.messagebox.value = data;

                                            page.okpgp.emit("completed");
                                        });
                                        break;
                                }
                        }
                    }, false);
                }
            },
            dispose: function(app, pathname) {
                //init = false;
                // console.log("disposed", pathname);
            }
        };

        page.init = $page.init;
        page.setup = $page.setup;

        pagesList["decrypt"] = $page;

        pagesList["decrypt-file"] = {
            view: require("./decrypt-file.page.html").default,
            init: $page.init,
            setup: $page.setup
        };

        register(null, {
            plugin_decrypt: {
                pagesList: pagesList
            }
        });


    }
};