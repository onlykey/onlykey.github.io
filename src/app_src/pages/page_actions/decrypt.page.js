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

  init: function(app, pages) {
    init = true;

    console.log("page", "init");

    var $ = app.$;
    var onlykeyApi = app.onlykeyApi;
    var onlykeyPGP = app.onlykeyPGP;

    page.gun = app.newGun();
    page.p2g = onlykeyPGP();

    var params = onlykeyApi.getAllUrlParams();

    onlykeyApi._status = $("#action")[0].select_one.value;


    if ((onlykeyApi._status) == 'Decrypt and Verify') {
      if (params.sender) document.getElementById('pgpkeyurl').value = params.sender;
      if (params.type == 'dv') document.getElementById('decrypt_and_verify').checked = true;
      if (params.type == 'd') document.getElementById('decrypt_only').checked = true;
      if (params.gm) {
        page.gun_message = gm_decode(params.gm);
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

    page.setup(app, pages);
  },
  setup: function(app, pages) {
    if (!init)
      page.init(app, pages);

    var $ = app.$;
    var onlykeyApi = app.onlykeyApi;


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


    (async function() {
      if (page.gun_message) {
        page.messagebox.value = "Loading Stored Message";
        var m = page.gun_message;
        page.gun_message = false;
        var stored = await page.gun.get("ok-messages#").get(m);
        if (stored)
          page.messagebox.value = stored;
      }
    })();

    if (onlykeyApi._status == 'Decrypt and Verify') {
      $("#pgpkeyurl").show();
      $("#pgpkeyurl2").show();
      $("#pgpkeyurl_tokenizer").show();
      $("#message").show();
      History.replaceState({ pathname: "decrypt" }, "Decrypt", "./decrypt?type=dv");
      page.button.textContent = 'Decrypt and Verify';
    }

    if (onlykeyApi._status == 'Decrypt Only') {
      $("#pgpkeyurl").hide();
      $("#pgpkeyurl2").show();
      $("#pgpkeyurl_tokenizer").show();
      $("#message").show();
      History.replaceState({ pathname: "decrypt" }, "Decrypt", "./decrypt?type=d");
      page.button.textContent = 'Decrypt';
    }

    if (!$("#action").data("changeSet")) {
      $("#action").data("changeSet", true);
      $("#action")[0].select_one.forEach(el => el.addEventListener('change', (function() {
        page.setup(app, pages);
      }).bind(null, false)));
      page.button.addEventListener('click', async function() {

        var message = null;
        var file = null;
        switch (onlykeyApi._status) {
          case 'Decrypt and Verify':
          case 'Decrypt Only':

            console.log(onlykeyApi._status);
            if (!onlykeyApi.init) await onlykeyApi.initok();
            if (!onlykeyApi.init) return;
            console.log(onlykeyApi._status);

            if (page.messagebox == null) {
              file = document.getElementById('file');
            }
            else {
              message = page.messagebox.value;
            }
            page.p2g.startDecryption(page.urlinputbox.value, message, file, function(data) {
              if (page.messagebox && data)
                page.messagebox.value = data;
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