//change   _template_  to your plugin name  
module.exports = {
  consumes: ["app", "onlykey3rd", "newGun", "forge", "SEA"],
  provides: ["history"],

  setup: async function(options, imports, register) {
    var historyAPI = {};

    var onlykey3rd = imports.onlykey3rd;
    var ok = onlykey3rd(1, 0);
    var newGun = imports.newGun;
    var SEA = imports.SEA;
    var forge = imports.forge;
    
    var gun = newGun();

    /**/

    var disconnected_PK = window.localStorage.onlykey_has_history;
    if (!disconnected_PK) {
      disconnected_PK = JSON.stringify(await SEA.pair());
      window.localStorage.onlykey_has_history = disconnected_PK;
    }

    disconnected_PK = JSON.parse(disconnected_PK);

    // var disconnected_PUBKEY = disconnected_PK.epub;
    var disconnected_SECRET = await SEA.secret(disconnected_PK, disconnected_PK);

    historyAPI.historyEnabled = false;

    var historyPUBKEY = false;
    var historySECRET = false;

    historyAPI.ready = false;

    historyAPI.init = function() {

    }

    historyAPI.setup = function() {

    }

    function doGunAuth(finished) {
      var gunUID = forge.sha256.create().update(historyPUBKEY).digest().toHex();
      var gunPASS = forge.sha256.create().update(historySECRET).digest().toHex();
      gun.user().auth(gunUID, gunPASS, async function(err, res) {
        if (err.err) {
          gun.user().create(gunUID, gunPASS, finished);
        }
        else
          finished();
      });
    }

    var encrypt = function(message) {
      if (!historySECRET)
        return ok.encrypt(message, disconnected_SECRET);
      return ok.encrypt(message, historySECRET);
    };
    var decrypt = function(message) {
      if (!historySECRET)
        return ok.decrypt(message, disconnected_SECRET);
      return ok.decrypt(message, historySECRET);
    };


    historyAPI.history = {
      get: async function(key) {
        var hist = gun.user().get("history");
        return decrypt(await hist.get(key));
      },
      set: async function(key, message) {
        var hist = gun.user().get("history");
        return hist.get(key).put(await encrypt(message));
      }
    };
    /*

    if (ok.history) {
      $("#pgpkeyurl2").val(await ok.history.get("pgpkeyurl2"));
      $("#pgpkeyurl2").change(function() {
        ok.history.set("pgpkeyurl2", $("#pgpkeyurl2").val());
      });

      $("#pgpkeyurl").val(await ok.history.get("pgpkeyurl"));
      $("#pgpkeyurl").change(function() {
        ok.history.set("pgpkeyurl", $("#pgpkeyurl").val());
      });
    }*/

    function doConnect() {
      return new Promise(async function(resolve) {
        ok.connect(function() {
          if (ok.derive_public_key) {
            // disable_onlykey = false;
            ok.derive_public_key("onlykey-gun", function(error, historyPubkey) {
              ok.derive_shared_secret("onlykey-gun", historyPubkey, async function(error, historySecret) {

              });
            });
          }
        });
      });
    }
    
    register(null, {
      history: historyAPI
    });

  }

};