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

var page = {

  init: function(app, $page, pathname) {
    init = true;

    console.log("page", "init");

    
    var $ = app.$;
    var onlykeyApi = app.onlykeyApi;
    var onlykeyPGP = app.onlykeyPGP;

    var tokenizer = require("../../../jquery.tokenizer.js");
    
    if (tokenizer) {
      tokenizer($, async function(itemName, returnValueFN) {
        returnValueFN(await onlykeyApi.getKey(itemName));
      });
    }
    
    page.gun = app.newGun();
    page.p2g = onlykeyPGP();

    var params = onlykeyApi.getAllUrlParams();

    onlykeyApi._status = $("#action")[0].select_one.value;

    if ((onlykeyApi._status) == 'Encrypt and Sign') {
      if (params.sender) document.getElementById('pgpkeyurl2').value = params.sender;
      if (params.recipients) document.getElementById('pgpkeyurl').value = params.recipients;
      if (params.type == 'e') {
        document.getElementById('encrypt_only').checked = true;
        onlykeyApi._status = 'Encrypt Only';
        document.getElementById('pgpkeyurl2').style.display = "none";
      }
      if (params.type == 'es') document.getElementById('encrypt_and_sign').checked = true;
      if (params.type == 's') {
        document.getElementById('sign_only').checked = true;
        onlykeyApi._status = 'Sign Only';
        document.getElementById('pgpkeyurl').style.display = "none";
      }
    }


    page.p2g.on("status", function(message) {
      page.button.textContent = message;
    });

    page.p2g.on("working", function() {
      page.button.classList.remove('error');
      page.button.classList.add('working');
    });

    page.p2g.on("done", function() {
      page.button.classList.remove('error');
      page.button.classList.remove('working');
    });

    page.p2g.on("error", function(msg) {
      console.log("pgp-error", msg);
      page.button.textContent = msg;
      page.button.classList.add('error');
      page.button.classList.remove('working');
    });


    page.setup(app, $page, pathname);
  },
  setup: function(app, $page, pathname) {
    if (!init)
      return page.init(app, $page, pathname);
    
    
    // History.replaceState()
    
    var $ = app.$;
    var onlykeyApi = app.onlykeyApi;

    $("input[data-provide='tokenizer']").each(function() {
        var $element = $(this);
        if ($element.data("tokenizer")) {
            return;
        }
        $element.tokenizer($element.data());
    });
    
    
    $("#message").focus(function(){
      $("#pgpkeyurl").data("tokenizer").addInput();
    });

    onlykeyApi.request_pgp_pubkey = function() {
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
          pubkey = await onlykeyApi.getKey(pubkey);
          resolve({
            value: pubkey,
            on_error: error_2
          });
        }
      });
    };


    onlykeyApi._status = $("#action")[0].select_one.value;


    document.getElementsByTagName('fieldset')[0].style.backgroundColor = app.randomColor({
      luminosity: 'bright',
      format: 'rgba'
    });

    page.urlinputbox = document.getElementById('pgpkeyurl');
    page.urlinputbox2 = document.getElementById('pgpkeyurl2');
    page.messagebox = document.getElementById('message');
    page.button = document.getElementById('onlykey_start');

    var pageType = false;
    
    if (onlykeyApi._status == 'Encrypt Only') {
      document.getElementById('pgpkeyurl2').style.display = "none";
      document.getElementById('pgpkeyurl').style.display = "initial";
      try { document.getElementById('pgpkeyurl_tokenizer').style.display = "block"; }
      catch (e) {}
      page.button.textContent = 'Encrypt';
      pageType = "e";
    }

    if (onlykeyApi._status == 'Sign Only') {
      document.getElementById('pgpkeyurl').style.display = "none";
      document.getElementById('pgpkeyurl2').style.display = "initial";
      try { document.getElementById('pgpkeyurl_tokenizer').style.display = "none"; }
      catch (e) {}
      page.button.textContent = 'Sign';
      pageType = "s";
    }

    if (onlykeyApi._status == 'Encrypt and Sign') {
      document.getElementById('pgpkeyurl').style.display = "initial";
      document.getElementById('pgpkeyurl2').style.display = "initial";
      try { document.getElementById('pgpkeyurl_tokenizer').style.display = "block"; }
      catch (e) {}
      page.button.textContent = 'Encrypt and Sign';
      pageType = "es";
    }
    
    if(pageType)
      History.replaceState({ pathname: pathname}, page.button.textContent , "./encrypt?type="+pageType);
      
    $(".messageLink").html("");
    
    if (!$("#action").data("changeSet")) {
      $("#action").data("changeSet", true);
      $("#action")[0].select_one.forEach(el => el.addEventListener('change', (function() {
        page.setup(app, $page, pathname);
      }).bind(null, false)));
      page.button.addEventListener('click', async function() {
        
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
        
        if(pageType)
          History.replaceState({ pathname: pathname}, page.button.textContent , "./encrypt?type="+pageType+"&recipients="+page.urlinputbox.value);
          
        switch (onlykeyApi._status) {
          case 'Encrypt and Sign':
          case 'Sign Only':


            console.log(onlykeyApi._status);
            if (!onlykeyApi.init) await onlykeyApi.initok();
            if (!onlykeyApi.init) return;
            console.log(onlykeyApi._status);

          case 'Encrypt Only':
            if (page.messagebox == null) {
              file = document.getElementById('file');
            }
            else {
              message = page.messagebox.value;
            }
            await page.p2g.startEncryption(page.urlinputbox.value, page.urlinputbox2.value, message, file, async function(data) {
              if (page.messagebox && data)
                page.messagebox.value = data;
              
                var cp = $('<hr/><input type="text" id="messageLink_url"/><button type="submit" id="copylink">Get and Copy Share Link</button>');
                $(".messageLink").append(cp);
                
                var $messageLink_url = $(".messageLink").find("#messageLink_url");
                var cpb = $(".messageLink").find("#copylink");
                
                $(".messageLink").show();
                $messageLink_url.hide();
                
                cpb.click(async function() {
                    var pair = await app.SEA.pair();
                    var secret = gm_encode(await app.SEA.secret(pair, pair));
                    secret = secret.substring(0, 16);
                    var $data = await app.SEA.encrypt(data, secret);
                    
                    var hash = await app.SEA.work($data, null, null, { name: "SHA-256" });
                    page.gun.get("ok-messages#").get(hash).put($data, function(res) {
                      console.log(hash, res);
                      $messageLink_url.val("https://" + window.location.host + "/app/decrypt?type=" + reverse_status + "&key="+secret+"&gm=" + gm_encode(hash));
                        $messageLink_url.show();
                        $messageLink_url.focus();
                        $messageLink_url.select();
                        document.execCommand('copy');
                        cpb.text(origTxt + " (copied)");
                        setTimeout(() => { cpb.text(origTxt); }, 5000);
                    });
                });


              
                var origTxt = cpb.text();
              
            });
            break;
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
            break;
        }
      }, false);

    }

    console.log("page", "setup");
  }
};

module.exports = page;