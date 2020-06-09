module.exports = {
  consumes: ["app", "$", "pages", "onlykeyApi", "onlykeyPGP", "onlykey3rd", "gun", "newGun", "forge", "SEA"],
  provides: ["main"],
  setup: function(options, imports, register) {
    var app = imports.app;

    var default_anonymous_email = "onlykey@crp.to";

    const pgpDecoder = require("./pgp-decoder/pgp.decoder.js");

    const enable_tokenizer = true;

    var newGun = imports.newGun;
    var SEA = imports.SEA;
    var $ = imports.$;
    var onlykeyApi = imports.onlykeyApi;
    var onlykeyPGP = imports.onlykeyPGP;
    var onlykey3rd = imports.onlykey3rd;
    var gun = imports.gun;

    var forge = imports.forge;

    const randomColor = require('randomcolor');

    var tokenizer = require("../jquery.tokenizer.js");

    $(".startHidden").hide().removeClass("startHidden");

    var init_page_id = $("body").data("page");
    
    if (init_page_id == "index") return;
    

    var app_initilized = false;
    var disable_onlykey = false;

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

    var ok = onlykey3rd(1, 0);

    function startConnect(done) {
      ok.connect(function() {
        if (ok.derive_public_key) {
          disable_onlykey = false;
          ok.derive_public_key("onlykey-gun", function(error, historyPubkey) {
            ok.derive_shared_secret("onlykey-gun", historyPubkey, async function(error, historySecret) {

              (function(gun) {
                var gunUID = forge.sha256.create().update(historyPubkey).digest().toHex();
                var gunPASS = forge.sha256.create().update(historySecret).digest().toHex();
                gun.user().auth(gunUID, gunPASS, async function(err, res) {
                  if (err.err) {
                    gun.user().create(gunUID, gunPASS, finished);
                  }
                  else
                    finished();
                });

                function finished(err) {
                  var encrypt = function(message) {
                    return ok.encrypt(message, historySecret);
                  };
                  var decrypt = function(message) {
                    return ok.decrypt(message, historySecret);
                  };
                  if (!err || !err.err) {
                    var hist = gun.user().get("history");
                    ok.history = {
                      get: async function(key) {
                        return decrypt(await hist.get(key));
                      },
                      set: async function(key, message) {
                        return hist.get(key).put(await encrypt(message));
                      }
                    };
                  }
                  done();
                }
              })(newGun());


            });
          });
        }
        else {
          disable_onlykey = true;
          done();
        }
      });
    }
    startConnect(finish);

    async function finish() {



      register(null, {
        main: {
          init: function() {
            var initapp;

            imports.app.on("state.change", function(pathname) {
              if (initapp) {
                app_initilized = false;
                $("body").data("page", pathname);
                if (disable_onlykey)
                  startConnect(initapp);
                else
                  initapp();
              }
            });

            imports.app.on("start", initapp = async function() {

              const urlinputbox = document.getElementById('pgpkeyurl');
              const urlinputbox2 = document.getElementById('pgpkeyurl2');
              const messagebox = document.getElementById('message');
              const button = document.getElementById('onlykey_start');
              const usevirtru = document.getElementById('virtrudetails');


              //echeck
              if ($("#action")[0]) {
                onlykeyApi._status = $("#action")[0].select_one.value;
              }

              if (disable_onlykey) {
                if (onlykeyApi._status == "Encrypt and Sign" || onlykeyApi._status == "Sign Only") {
                  $("#action")[0].select_one.value = "Encrypt Only";
                }

                switch (onlykeyApi._status) {
                  case "Encrypt and Sign":
                  case "Sign Only":
                    $("#action")[0].select_one.value = "Encrypt Only";
                    break;
                  case "Decrypt and Verify":
                  case "Decrypt Only":
                    $("#message").hide();
                    $("#pgpkeyurl2").hide();
                    $("#pgpkeyurl").hide();
                    break;
                  default:
                    break;
                }

              }

              //recheck
              if ($("#action")[0]) {
                onlykeyApi._status = $("#action")[0].select_one.value;
              }

              switch ($("body").data("page")) {
                case "encrypt-file":
                case "encrypt":
                  if (!app_initilized) {
                    if ((onlykeyApi._status) == 'Encrypt and Sign') {
                      if (onlykeyApi.getAllUrlParams().sender) document.getElementById('pgpkeyurl2').value = onlykeyApi.getAllUrlParams().sender;
                      if (onlykeyApi.getAllUrlParams().recipients) document.getElementById('pgpkeyurl').value = onlykeyApi.getAllUrlParams().recipients;
                      if (onlykeyApi.getAllUrlParams().type == 'e') {
                        document.getElementById('encrypt_only').checked = true;
                        onlykeyApi._status = 'Encrypt Only';
                        document.getElementById('pgpkeyurl2').style.display = "none";
                      }
                      if (onlykeyApi.getAllUrlParams().type == 'es') document.getElementById('encrypt_and_sign').checked = true;
                      if (onlykeyApi.getAllUrlParams().type == 's') {
                        document.getElementById('sign_only').checked = true;
                        onlykeyApi._status = 'Sign Only';
                        document.getElementById('pgpkeyurl').style.display = "none";
                      }
                    }
                  }

                  if (onlykeyApi._status == 'Encrypt Only') {
                    document.getElementById('pgpkeyurl2').style.display = "none";
                    document.getElementById('pgpkeyurl').style.display = "initial";
                    try { document.getElementById('pgpkeyurl_tokenizer').style.display = "block"; }
                    catch (e) {}
                    button.textContent = 'Encrypt';
                  }

                  if (onlykeyApi._status == 'Sign Only') {
                    document.getElementById('pgpkeyurl').style.display = "none";
                    document.getElementById('pgpkeyurl2').style.display = "initial";
                    try { document.getElementById('pgpkeyurl_tokenizer').style.display = "none"; }
                    catch (e) {}
                    button.textContent = 'Sign';
                  }

                  if (onlykeyApi._status == 'Encrypt and Sign') {
                    document.getElementById('pgpkeyurl').style.display = "initial";
                    document.getElementById('pgpkeyurl2').style.display = "initial";
                    try { document.getElementById('pgpkeyurl_tokenizer').style.display = "block"; }
                    catch (e) {}
                    button.textContent = 'Encrypt and Sign';
                  }

                  break;
                case "decrypt-file":
                case "decrypt":
                  if (!app_initilized) {
                    if ((onlykeyApi._status) == 'Decrypt and Verify') {
                      if (onlykeyApi.getAllUrlParams().sender) document.getElementById('pgpkeyurl').value = onlykeyApi.getAllUrlParams().sender;
                      if (onlykeyApi.getAllUrlParams().type == 'dv') document.getElementById('decrypt_and_verify').checked = true;
                      if (onlykeyApi.getAllUrlParams().type == 'd') document.getElementById('decrypt_only').checked = true;
                      if (onlykeyApi.getAllUrlParams().gm) {
                        var m = gm_decode(onlykeyApi.getAllUrlParams().gm);

                        var stored = await gun.get("ok-messages#").get(m);
                        if (stored)
                          messagebox.value = stored;

                      }
                    }
                  }

                  if (disable_onlykey) {
                    button.textContent = 'Insert OnlyKey and Click Here :)';
                    button.addEventListener('click', async function() {
                      if (disable_onlykey) {
                        startConnect(initapp);
                      }
                    });
                    break;
                  }

                  if (onlykeyApi._status == 'Decrypt and Verify') {
                    $("#pgpkeyurl").show();
                    $("#pgpkeyurl2").show();
                    $("#pgpkeyurl_tokenizer").show();
                    $("#message").show();
                    button.textContent = 'Decrypt and Verify';
                  }

                  if (onlykeyApi._status == 'Decrypt Only') {
                    $("#pgpkeyurl").hide();
                    $("#pgpkeyurl2").show();
                    $("#pgpkeyurl_tokenizer").show();
                    $("#message").show();
                    button.textContent = 'Decrypt';
                  }
                  break;

                case 'search':
                  disable_onlykey = true;

                  if (!app_initilized) {

                    
                    if(ok.history){
                      $("#user").val(await ok.history.get("search-user"));
                      $("#user").change(function() {
                        ok.history.set("search-user", $("#user").val());
                      });
  
                      $("#sites option[value='" + await ok.history.get("search-searchSelect") + "']").prop('selected', true);
                      $("#sites").change(function() {
                        var sel = $(this).children("option:selected").val();
                        ok.history.set("search-searchSelect", sel);
                      });
                    }


                    $('#submit').click(function() {

                      var sites = {
                        q: $("#sites option:selected").val(),
                        rpp: 5
                      };
                      var users = {
                        q: $('#user').val(),
                        rpp: 5
                      };
                      searchKeybase(sites, users);
                    });

                    if (onlykeyApi.getAllUrlParams().q) {
                      $('#user').val(onlykeyApi.getAllUrlParams().q);
                      // $('#submit').click();
                    }

                    if ($('#user').val())
                      $('#submit').click();

                  }
                  break;
                case 'password-generator':
                  disable_onlykey = true;
                  button.addEventListener('click', async function() {
                    var phrase = $("#phrase").val();
                    ok.derive_public_key(phrase, function(error, phrasePubkey) {
                      ok.derive_shared_secret(phrase, phrasePubkey, async function(error, phrasePubkeySecret) {
                        $("#phrase_out").val(phrasePubkeySecret);
                      });
                    });
                  });
                  break;
                default:
                  break;
              }


              if (ok.history) {
                $("#pgpkeyurl2").val(await ok.history.get("pgpkeyurl2"));
                $("#pgpkeyurl2").change(function() {
                  ok.history.set("pgpkeyurl2", $("#pgpkeyurl2").val());
                });

                $("#pgpkeyurl").val(await ok.history.get("pgpkeyurl"));
                $("#pgpkeyurl").change(function() {
                  ok.history.set("pgpkeyurl", $("#pgpkeyurl").val());
                });
              }


              if (enable_tokenizer) {
                tokenizer($, async function(itemName, returnValueFN) {
                  returnValueFN(await onlykeyApi.getKey(itemName));
                });
              }


              if (!app_initilized) realInit();


              async function realInit() {
                
                if(document.getElementsByTagName('fieldset')[0])
                document.getElementsByTagName('fieldset')[0].style.backgroundColor = randomColor({
                  luminosity: 'bright',
                  format: 'rgba'
                });

                $(window).scrollTo("h4", 800);

                app_initilized = true;

                if (onlykeyApi._status) {
                  console.info('OnlyKey Action selected' + onlykeyApi._status);

                  if ($("#action")[0])
                    $("#action")[0].select_one.forEach(el => el.addEventListener('change', initapp.bind(null, false)));

                  if (!disable_onlykey) {
                    onlykeyApi.initok(() => {

                      var p2g = onlykeyPGP(usevirtru);

                      onlykeyApi.request_pgp_pubkey = function() {
                        function error_1(err) {
                          button.textContent = err;
                        }

                        function error_2(err) {
                          button.textContent = 'Your PublicKey is ' + err;
                        }
                        return new Promise(async function(resolve) {
                          var pubkey = $("#pgpkeyurl2").val();
                          if (pubkey == "" || !pubkey) {
                            resolve({ value: false, on_error: error_1 });
                          }
                          else {
                            pubkey = await onlykeyApi.getKey(pubkey);
                            resolve({
                              value: pubkey,
                              on_error: error_2
                            });
                          }
                        });
                      };

                      p2g.on("status", function(message) {
                        button.textContent = message;
                      });

                      p2g.on("working", function() {
                        button.classList.remove('error');
                        button.classList.add('working');
                      });

                      p2g.on("done", function() {
                        button.classList.remove('error');
                        button.classList.remove('working');
                      });

                      p2g.on("error", function(msg) {
                        console.log("pgp-error", msg);
                        button.textContent = msg;
                        button.classList.add('error');
                        button.classList.remove('working');
                      });

                      // urlinputbox.onkeyup = function() {
                      //   let rows_current = Math.trunc((urlinputbox.value.length * parseFloat(window.getComputedStyle(urlinputbox, null).getPropertyValue('font-size'))) / (urlinputbox.offsetWidth * 1.5)) + 1;
                      //   urlinputbox.rows = (rows_current > 10) ? 10 : rows_current;
                      // };

                      button.addEventListener('click', async function() {
                        var message = null;
                        var file = null;
                        var reverse_status;
                        switch (onlykeyApi._status) {
                          case 'Encrypt and Sign':
                            reverse_status = "dv";
                            break;
                          case 'Encrypt Only':
                            reverse_status = "d";
                            break;
                        }
                        switch (onlykeyApi._status) {
                          case 'Encrypt and Sign':
                          case 'Encrypt Only':
                          case 'Sign Only':
                            if (messagebox == null) {
                              file = document.getElementById('file');
                            }
                            else {
                              message = messagebox.value;
                            }
                            await p2g.startEncryption(urlinputbox.value, urlinputbox2.value, message, file, async function(data) {
                              if (messagebox && data)
                                messagebox.value = data;

                              var hash = await SEA.work(data, null, null, { name: "SHA-256" });
                              gun.get("ok-messages#").get(hash).put(data, function(res) {
                                console.log(hash, res);
                                var cp = $('<hr/><input type="text" id="messageLink_url"/><button type="submit" id="copylink">Copy Share Link</button>');
                                $(".messageLink").append(cp);
                                $(".messageLink").find("#messageLink_url").val("https://" + window.location.host + "/decrypt?type=" + reverse_status + "&gm=" + gm_encode(hash));
                                $(".messageLink").show();
                                var cpb = $(".messageLink").find("button");
                                var origTxt = cpb.text();
                                cpb.click(function() {
                                  var $copybox = $(".messageLink").find("input");
                                  $copybox.focus();
                                  $copybox.select();
                                  document.execCommand('copy');
                                  cpb.text(origTxt + " (copied)");
                                  setTimeout(() => { cpb.text(origTxt); }, 5000);
                                });
                              });

                            });
                            break;
                          case 'Decrypt and Verify':
                          case 'Decrypt Only':
                            if (messagebox == null) {
                              file = document.getElementById('file');
                            }
                            else {
                              message = messagebox.value;
                            }
                            p2g.startDecryption(urlinputbox.value, message, file, function(data) {
                              if (messagebox && data)
                                messagebox.value = data;
                            });
                            break;
                          case 'pending_pin':
                            break;
                          case 'finished':
                            if (messagebox != null) {
                              try {
                                messagebox.focus();
                                messagebox.select();
                                var successful = document.execCommand('copy');
                                var msg = successful ? 'successful' : 'unsuccessful';
                                button.textContent = 'Done :)  Message copied to clipboard';
                                setTimeout(function() {
                                  initapp();
                                }, 5000);
                                console.info('Copying text command was ' + msg);
                                if (!successful) button.textContent = 'Oops, unable to copy message to clipboard, try copying message manually';
                              }
                              catch (err) {
                                button.textContent = 'Oops, unable to copy message to clipboard, try copying message manually';
                                console.info('Oops, unable to copy');
                              }
                            }
                            else {
                              // send file to user
                            }
                            break;
                        }
                      }, false);

                      initapp();
                    });
                  }
                }

              }


              function searchLayout() {
                var outDiv = $("<div class='outline'>");
                $("#results").append(outDiv);
                var leftDiv_outter = $("<div class='yui3-u-1-2'>");
                outDiv.append(leftDiv_outter);
                var rightDiv_outter = $("<div class='yui3-u-1-2'>");
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

                var $user = user.q;

                switch (sites.q) {
                  //https://keybase.io/_/api/1.0/user/lookup.json?uid=4a4f61cdab6a13fb904599ef0159bd19
                  case 'protonmail':

                    if ($user && !($user.indexOf("0x") == 0) && !$user.split("@")[1])
                      $user += "@protonmail.com";

                    var response_text = await onlykeyApi.getKey($user, "protonmail");
                    console.log(response_text);


                    var sl = searchLayout();

                    var decodedkey = pgpDecoder(response_text);
                    console.log(decodedkey);

                    var p2g_search = onlykeyPGP(usevirtru);
                    p2g_search.getPublicKeyInfo(response_text, function(theKey) {
                      if (theKey) {

                        var email = theKey.pgp.userids[0].components.email;
                        var username = theKey.pgp.userids[0].components.username;
                        var keyid = "0x" + theKey.find_crypt_pgp_key().get_key_id().toString("hex");
                        var keyid_short = theKey.find_crypt_pgp_key().get_short_key_id();


                        sl.leftDiv.append("<img src='https://www.gravatar.com/avatar/" + forge.md5.create().update(email).digest().toHex() + "?s=1024default=https%3A%2F%2Fgravatar.com%2Favatar%2F" + forge.md5.create().update(default_anonymous_email).digest().toHex() + "' />");
                        sl.rightDiv.append("<font color='red'>Protonmail Username = " + username + "</font><br>");
                        sl.rightDiv.append("<pre color='red'>GPG KeyID = " + keyid + " (" + keyid_short + ")" + "</pre><br>");
                        sl.rightDiv.append("Send Encrypted <a href='/encrypt-dev.html?type=e&recipients=" + username + "'>Message</a> <a href='/encrypt-file-dev.html?type=e&recipients=" + username + "'>File</a><br>");

                        var $getpgp_btn = $("<button>Copy PGP Key</button>");
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
                        console.log(theKey);
                      }
                    });

                    break;
                  case 'keybase':
                    var kburl = 'https://keybase.io/_/api/1.0/user/user_search.json?q=' + user.q;
                    $.ajax({
                      url: kburl,
                      async: true,
                      dataType: 'json',
                      success: function(data) {
                        console.info(data);
                        var result = data.list;
                        result.forEach(function(element) {
                          console.log(element);
                          console.log(element.components);
                          var listItem = element.keybase;

                          if (listItem.uid) {
                            $.ajax({
                              url: 'https://keybase.io/_/api/1.0/user/lookup.json?uid=' + listItem.uid,
                              async: true,
                              dataType: 'json',
                              success: function(data) {
                                console.log(data)
                                if (listItem.username) {

                                  var sl = searchLayout()
                                  if (listItem.picture_url != null)
                                    sl.leftDiv.append("<img src='" + listItem.picture_url + "' width='10' height='auto'/><br>");
                                  else sl.leftDiv.append("<img src='https://raw.githubusercontent.com/keybase/client/master/browser/images/icon-keybase-logo-128.png' />");


                                  sl.rightDiv.append("<font color='red'>Keybase Username = " + listItem.username + "</font><br>");
                                  if (listItem.full_name) sl.rightDiv.append("Full Name = " + listItem.full_name + "<br><br>");
                                  sl.rightDiv.append("View Keybase Profile <a href='https://keybase.io/" + listItem.username + "'>Here</a><br>");
                                  sl.rightDiv.append("Send Encrypted <a href='/encrypt?type=e&recipients=" + listItem.username + "'>Message</a> <a href='/encrypt-file?type=e&recipients=" + listItem.username + "'>File</a><br>");

                                  for (var i in element.services_summary) {
                                    sl.rightDiv.append("<font color='blue'>" + element.services_summary[i].service_name.toUpperCase() + " Username = " + element.services_summary[i].username + "</font><br>");
                                  }
                                  var $getpgp_btn = $("<button>Copy PGP Key</button>");
                                  var $pgp_copybox = $("<textarea>&nbsp;</textarea>");
                                  sl.rightDiv.append($getpgp_btn);
                                  sl.rightDiv.append($pgp_copybox);
                                  $pgp_copybox.hide();
                                  $getpgp_btn.click(async function() {
                                    var url = 'https://keybase.io/' + listItem.username + '/pgp_keys.asc';
                                    var response_text = await onlykeyApi.getKey(url)
                                    $pgp_copybox.val(response_text)
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
                              }
                            });
                          }
                          // else {
                          //   $("#results").append("<br>No matchs found!");
                          // }
                        });
                      }
                    });
                    break;
                  case 'protonmail':
                    break;

                }


                $(window).scrollTo("h4", 800)
              }

            });

          }
        }
      });

    }
  }
};