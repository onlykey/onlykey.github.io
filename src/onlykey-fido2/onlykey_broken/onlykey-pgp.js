module.exports = function(imports) {
  var console = imports.console;
  return function(onlykeyApi, usevirtru) {



    var {
      // wait,
      sha256,
      // hexStrToDec,
      bytes2string,
      noop,
      // getstringlen,
      // mkchallenge,
      // bytes2b64,
      // getOS,
      // ctap_error_codes,
      // getAllUrlParams,
      aesgcm_decrypt,
      aesgcm_encrypt
    } = require("./onlykey.extra.js")(imports);

    var KB_ONLYKEY = {};// the object we pass to kbpgp to enable custom changes
    //to identify REQURED properties 
    KB_ONLYKEY.custom_keyid;
    KB_ONLYKEY.auth_decrypt;
    KB_ONLYKEY.auth_sign;
    

    const kbpgp = require('./kbpgp.onlykey.js')(KB_ONLYKEY, console);
    const kbpgp2 = require('./kbpgp-2.1.0.js');
    // window.kbpgp = kbpgp2;

    /*globals Blob */
    // const url = require("url");
    var saveAs = require("file-saver").saveAs;
    const JSZip = require('jszip');

    let wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    var EventEmitter = require("events").EventEmitter;
    var onlykey_api_pgp = new EventEmitter();


    const OKDECRYPT = 240;
    const OKSIGN = 237;
    const OKPING = 243;

    var _status;
    var _mode;
    var pin;
    
    var statusEvents = new EventEmitter();
    onlykey_api_pgp.reset = function() {
      _$status("reset");
      statusEvents = new EventEmitter();
      _$status("ready");
      return statusEvents;
    };


    function ping(delay) {
      console.info("PING: poll_type=" + onlykey_api_pgp.poll_type + ", delay=" + (delay || onlykey_api_pgp.poll_delay));
      var p = msg_polling({ type: onlykey_api_pgp.poll_type, delay: delay });
      return p;
    }

    function msg_polling(params = {}, callback) {
      return new Promise(async function(resolve, reject) {

        function cb(err, data) {
          if (typeof callback === 'function') callback(err, data);
          if (err) return reject(err);
          resolve(data);
        }

        // var cb = callback || noop;

        var delay = params.delay || onlykey_api_pgp.poll_delay;
        var type = params.type || 0; // default type to 1
        if (onlykeyApi.OKversion == 'Original') {
          delay = delay * 4;
        }


        //setTimeout(async function() {
        // console.info("Requesting response from OnlyKey");
        var cmd;
        var encryptedkeyHandle;
        var message;

        //Ping and get Response From OKSIGN or OKDECRYPT
        // if (_$status_is('finished'))
        //   return encrypted_data;
        console.info("Sending Ping Request to OnlyKey");
        message = [];
        var ciphertext = new Uint8Array(64).fill(0);
        Array.prototype.push.apply(message, ciphertext);
        encryptedkeyHandle = await aesgcm_encrypt(message, onlykeyApi.sharedsec);
        //var encryptedkeyHandle = Uint8Array.from(message);
        _$status('waiting_ping');
        cmd = OKPING;
        //}

        await wait(delay * 1000);

        var ctaphid_response = await onlykeyApi.ctaphid_via_webauthn(cmd, 2, null, null, encryptedkeyHandle, 6000, function(aerr, data) {
          console.log(aerr,data);
        });

        var response;

        if (ctaphid_response.data && !ctaphid_response.error) {
          response = ctaphid_response.data;
        }
        else if (ctaphid_response.error) {
          _$status('finished');
        }
        // await wait(1000);

        var data; // = await Promise;
        var error = ctaphid_response.error;
        
        if (!ctaphid_response.error) {}

        if (!ctaphid_response.error) {
          console.info("Ping Successful");

          if (type == 3 && _$status_is('finished')) {
            data = response;
            imports.app.emit("ok-connected");
          }
          else if (type == 4 && _$status_is('finished')) {
            var oksignature = response.slice(0, response.length); //4+32+2+32
            data = oksignature;
            imports.app.emit("ok-connected");
          }
          else {
            console.log(ctaphid_response.status);
            if (ctaphid_response.status == "CTAP2_ERR_USER_ACTION_PENDING") {
              data = "PENDING";
              _$status('pending_challenge');
            }
            else {
              data = await aesgcm_decrypt(response, onlykeyApi.sharedsec);
              // console.log("DECODED RESPONSE:", response);
              console.log("DECODED RESPONSE(as string):", bytes2string(response));
              // console.log("DECRYPTED RESPONSE:", data);
              console.log("DECRYPTED RESPONSE(as string):", bytes2string(data));
            }


            if (_$status_is('finished')) {
              // console.info("Finished");
              imports.app.emit("ok-connected");
            }

            if (_$status_is('done_challenge')) {
              _$status('finished');
            }

            // if (_$status_is('waiting_ping')) {
            // _$status('pending_challenge');
            // data = 1;
            // }

          }
        }
        else {
          console.log(ctaphid_response);
        }

        cb(error, data);

        //}, (delay * 1000));

      });
    }
    /**
     * Break cipherText into chunks and send via u2f sign
     * @param {Array} cipherText
     */
    var packetnum = 0;
    async function u2fSignBuffer(slot, cipherText, mainCallback) {
      // this function should recursively call itself until all bytes are sent in chunks
      var message = []; //Add header and message type
      var maxPacketSize = 228; //57 (OK packet size) * 4, + 4 byte 0xFF header, has to be less than 255 - header
      var finalPacket = cipherText.length - maxPacketSize <= 0;
      var ctChunk;
      packetnum++;
      if (cipherText.length < maxPacketSize) {
        ctChunk = cipherText;
      }
      else {
        ctChunk = cipherText.slice(0, maxPacketSize);
      }

      Array.prototype.push.apply(message, ctChunk);

      //while (message.length < 228) message.push(0);
      // console.info("Handlekey bytes ", message);
      var encryptedmsg = await aesgcm_encrypt(message, onlykeyApi.sharedsec);
      // console.info("Encrypted Handlekey bytes ", encryptedmsg);


      if (OKSIGN == slot) imports.app.emit("ok-signing");
      if (OKDECRYPT == slot) imports.app.emit("ok-decrypting");

      var delay = 1;
      if (onlykeyApi.OKversion == 'Original') {
        delay = 4;
      }
      await wait(delay * 1000);

      var ctaphid_response = await onlykeyApi.ctaphid_via_webauthn(slot, slotid(slot), finalPacket, packetnum, encryptedmsg, 6000, function(aerr, data) {
        // console.log(data);
      });

      var response = 1;

      if (ctaphid_response.data && !ctaphid_response.error)
        response = ctaphid_response.data;

      if (finalPacket) packetnum = 0;

      // .then(async response => {
      //decrypt data
      if (response != 1) {
        // var decryptedparsedData = await aesgcm_decrypt(response, onlykeyApi.sharedsec);
        // console.log("DECODED RESPONSE:", response);
        // console.log("DECODED RESPONSE(as string):", bytes2string(response));
        // console.log("DECRYPTED RESPONSE:", decryptedparsedData);
        // console.log("DECRYPTED RESPONSE(as string):", bytes2string(decryptedparsedData));
      }
      // console.log("Returning just the decoded response:");
      var result = response;
      // msg((result ? "Successfully sent" : "Error sending") + " to OnlyKey");
      if (result) {
        if (finalPacket) {
          // console.info("Final packet ");
          _$status('pending_challenge');
          onlykey_api_pgp.doPinTimer().then(skey => {
            // console.info("skey ", skey);
            mainCallback(skey);
          }).catch(err => console.info(err));
        }
        else {
          imports.app.emit("ok-activity");
          //cb();
          u2fSignBuffer(slot, cipherText.slice(maxPacketSize), mainCallback);
        }
      }
      else {
        imports.app.emit("ok-error");
      }
      // });
    }


    /**
     * Decrypt ciphertext via OnlyKey
     * @param {Array} ct
     */
    KB_ONLYKEY.auth_decrypt = async function(ct_array, cb) { //OnlyKey decrypt request to keyHandle
      if ( /*ct_array.length > 1 &&*/ onlykeyApi.request_pgp_pubkey) {
        var key = await onlykeyApi.request_pgp_pubkey();
        if (!key.value) {
          if (key.on_error && ct_array.length > 1) {
            return key.on_error("Message for multiple recipients");
          }
          else
            return complete(ct_array[0]);
        }

        kbpgp.KeyManager.import_from_armored_pgp({
          armored: key.value
        }, (err, sender) => {
          if ((err || !sender) && key.on_error) {
            return key.on_error("Invalid");
          }
          else if (err || !sender) {
            return complete(ct_array[0]);
          }

          var mypubkeyids = sender.get_all_pgp_key_ids();

          for (var i in mypubkeyids) {
            var target = Array.from(mypubkeyids[i]).join("-");
            // msg("----input keyid " + target);
            for (var j in ct_array) {
              var check = Array.from(ct_array[j].key_id).join("-");
              // msg("msg-check keyid " + check);
              if (target == check) {
                // msg("----match keyid " + check);
                return complete(ct_array[j]);
              }
            }
          }

          if (key.on_error)
            return key.on_error("Not found in message");
          else
            complete(ct_array[0]);
        });
      }
      else {
        complete(ct_array[0]);
      }

      function complete(ct) {
        ct = ct.raw;
        if (!onlykeyApi.init) {
          throw new Error("OK NOT CONNECTED");
          // return;
        }
        cb = cb || noop;
        if (ct.length == 396) {
          onlykey_api_pgp.poll_delay = 5; //5 Second delay for RSA 3072
        }
        else if (ct.length == 524) {
          onlykey_api_pgp.poll_delay = 7; //7 Second delay for RSA 4096
        }
        // if (OKversion == 'Original') {
        //   onlykey_api_pgp.poll_delay = onlykey_api_pgp.poll_delay * 4;
        // }
        var padded_ct = ct.slice(12, ct.length);
        var keyid = ct.slice(1, 8);
        console.info("Key ID bytes", Array.from(keyid));
        var pin_hash = sha256(padded_ct);
        // console.info("Padded CT Packet bytes", Array.from(padded_ct));
        pin = [get_pin(pin_hash[0]), get_pin(pin_hash[15]), get_pin(pin_hash[31])];
        console.log("Generated PIN " + pin);
        return u2fSignBuffer(OKDECRYPT, typeof padded_ct === 'string' ? padded_ct.match(/.{2}/g) : padded_ct, function(oks) {
          cb(oks, ct);
        });
      }
    };

    /**
     * Sign message via OnlyKey
     * @param {Array} ct
     */
    KB_ONLYKEY.auth_sign = function(ct, cb) { //OnlyKey sign request to keyHandle
      if (!onlykeyApi.init) {
        throw new Error("OK NOT CONNECTED");
        // return;
      }
      var pin_hash = sha256(ct);
      cb = cb || noop;
      // console.info("Signature Packet bytes ", Array.from(ct));
      // msg("Signature Packet bytes " + Array.from(ct));
      pin = [get_pin(pin_hash[0]), get_pin(pin_hash[15]), get_pin(pin_hash[31])];
      //console.info("Generated PIN", pin);
      return u2fSignBuffer(OKSIGN, typeof ct === 'string' ? ct.match(/.{2}/g) : ct, cb);
    };



    function slotid(slot) {
      //_mode == "Encrypt and Sign" ? 2 : 1; << should be this ( mode should be set before running any process at start)
      return slot == OKSIGN ? 2 : 1;
    }


    onlykey_api_pgp.doPinTimer = async function(seconds) {
      return new Promise(async function updateTimer(resolve, reject, secondsRemaining) {
        secondsRemaining = typeof secondsRemaining === 'number' ? secondsRemaining : seconds || 10;
        var res;

        if (!_$status_is('pending_challenge') /* || _$status_is('waiting_ping')*/ ) {
          // _$status('done_challenge');
          onlykeyApi.emit("status", `Waiting for OnlyKey to process message.`);
          res = ping(); //Delay
        }
        else if (_$status_is('pending_challenge')) {
          if (secondsRemaining <= 1) {
            imports.app.emit("ok-waiting");
            _$status('done_challenge');
          }
          if (secondsRemaining > 1) {
            onlykeyApi.emit("status", `You have ${secondsRemaining} seconds to enter challenge code ${pin} on OnlyKey.`);
            // console.info("enter challenge code", pin);
          }

          if (!(onlykeyApi.os == 'Android') && [10, 5].indexOf(secondsRemaining) > -1) {
            //res = await ping(0); //Delay
            // pooling will cause the key to go into a stale state after sign/decrypt Operation #1, 
            // causing the #2 operation of sign/decrypt to be skipped until #3 re-atempt
            // for now, lets let the timer expire and complete the request when done.
          }
          //await ping(0); //Too many popups with FIDO2
        }

        if (res)
          res.then(next).catch(aerr => {
            console.log(aerr);
            onlykey_api_pgp.emit("error", aerr);
          });
        else next();

        async function next(results) {
          if (results) {
            // console.log("ping results",results);

            if (results instanceof Array) {
              if (_$status_is('finished'));
              return resolve(results);
            }

          }

          // if (_$status_is('finished')) {
          //   if (encrypted_data) {
          //     console.info("Parsed Encrypted Data: ", encrypted_data);
          //     var decrypted_data = await aesgcm_decrypt(encrypted_data, onlykeyApi.sharedsec);
          //     encrypted_data = false; //clear
          //     console.info("Parsed Decrypted Data: ", decrypted_data);
          //     return resolve(decrypted_data);
          //   }
          //   else {
          //     return reject("Error no data to decrypt for aesgcm_decrypt");
          //   }
          // }

          if (_$status_is('finished')) return;

          setTimeout(updateTimer.bind(null, resolve, reject, secondsRemaining -= 1), 1000);

        }
      });
    };



    function get_pin(byte) {
      if (onlykeyApi.FWversion == 'v0.2-beta.8c') {
        if (byte < 6) return 1;
        else {
          return (byte % 5) + 1;
        }
      }
      else {
        return (byte % 6) + 1;
      }
    }


    function _$status(newStatus) {
      if (newStatus) {
        _status = newStatus;
        if (statusEvents)
          statusEvents.emit(newStatus);
        // console.info("Changed _status to ", newStatus);
      }
      return _status;
    }
    //this script should only be allow set this remove soon 
    onlykey_api_pgp._$status = _$status;

    function _$status_is(status_check) {
      return !!(_$status() == status_check);
    }
    onlykey_api_pgp._$status_is = _$status_is;

    function _$mode(newMode) {
      if (newMode) {
        _mode = newMode;
        // console.info("Changed _status to ", newStatus);
      }
      return _mode;
    }
    onlykey_api_pgp._$mode = _$mode;

    function _$mode_is(mode_check) {
      return !!(_$mode() == mode_check);
    }
    onlykey_api_pgp._$mode_is = _$mode_is;


    // var ring = new kbpgp.keyring.KeyRing();

    onlykey_api_pgp.startDecryption = async function(signer, mypubkey,  message, file, callback) {
      var sender_public_key;

      onlykey_api_pgp.poll_type = 3;
      onlykey_api_pgp.poll_delay = 1;
      //console.info(onlykey_api_pgp.poll_type);
      // button.classList.remove('error');
      // button.classList.add('working');
      onlykey_api_pgp.emit("working");

      if (signer == "" && _$status_is('Decrypt and Verify')) {
        onlykey_api_pgp.emit("error", "I need senders's public pgp key to verify :(");
        return;
      }
      else if (signer != "" && _$status_is('Decrypt and Verify')) {
        if (signer.slice(0, 10) != '-----BEGIN') { // Check if its a pasted public key
          sender_public_key = await onlykeyApi.getKey(signer);
        }
        else {
          sender_public_key = signer;
        }
      }
      if (message != null)
        decryptText(sender_public_key, message, callback);
      else decryptFile(sender_public_key, file, callback);
    };

    function decryptText(key, encryptedMessage, callback) {
      return new Promise(async(resolve) => {

        var keyStore = pgpkeyStore();
        switch (_$status()) {
          case 'Decrypt and Verify':
            await keyStore.loadPublic(key);
            onlykey_api_pgp.emit("status", "Decrypting and verifying message ...");
            break;
          case 'Decrypt Only':
            onlykey_api_pgp.emit("status", "Decrypting message ...");
            var Decrypt_Only = true;
            break;
          default:
        }
        await keyStore.loadPrivate();
        kbpgp.unbox({
          keyfetch: keyStore.ring,
          armored: encryptedMessage,
          // strict: Decrypt_Only ? false : true
        }, (err, decryptedMessage) => {
          if (err) {
            onlykey_api_pgp.emit("error", err);
            return;
          }
          if (Decrypt_Only) {
            onlykey_api_pgp.emit("status", "Done :) Click here to copy message");
          }
          else {
            var recipient_public_key;
            var ds = null;
            ds = decryptedMessage[0].get_data_signer();
            if (ds == null) {
              onlykey_api_pgp.emit("status", "Done :) Message has no signature, Click here to copy message");
            }
            else {
              console.log(ds);
              if (ds) { recipient_public_key = ds.get_key_manager(); }
              if (recipient_public_key) {
                console.log("Signed by PGP Key");
                var keyid = recipient_public_key.get_pgp_fingerprint().toString('hex').toUpperCase();
                keyid = keyid.slice(24, 40);
                var userid = recipient_public_key.userids[0].components.email.split("@")[0];
                console.log(keyid);
                console.log(userid);
                onlykey_api_pgp.emit("status", "Done :) Signed by " + userid + " (Key ID: " + keyid + "), Click here to copy message");
              }
            }
          }
          console.info(decryptedMessage);
          // messagebox.value = ct;
          // messagebox.focus();
          // messagebox.select();
          onlykey_api_pgp.emit("done");
          callback(decryptedMessage);
          resolve(decryptedMessage);
        });
      });
    }

    function decryptFile(key, ct, callback) {
      return new Promise(async(resolve) => {
        var txt = "";
        if ('files' in ct) {
          var file = ct.files[0];
          if (!file.size) {
            onlykey_api_pgp.emit("error", "No files selected :(");
            return;
          }
          else {
            if ('name' in file) {
              txt += "file name: " + file.name;
            }
            if ('size' in file) {
              txt += " file size: " + file.size;
            }
            if ('type' in file) {
              txt += " file type: " + file.type;
            }
          }
        }
        else {
          onlykey_api_pgp.emit("error", "No files selected :(");
          return;
        }

        var reader = new FileReader();
        reader.filename = file.name;
        var filename = reader.filename;
        filename = filename.slice(0, filename.length - 4);
        reader.readAsArrayBuffer(file);
        var parsedfile = await myreaderload(reader);


        if (usevirtru != null) {
          console.info(usevirtru);
          console.info(typeof usevirtru);

          try {
            await encryptOrDecryptFile(parsedfile, filename, false, false);
            return resolve();
          }
          catch (err) {
            console.error(err);
            alert('An error occurred attempting to encrypt this file. Please be sure you have authenticated, and try again.');
          }
          // button.classList.remove('working');
          onlykey_api_pgp.emit("working");
        }

        var buffer = kbpgp.Buffer.from(parsedfile);
        var keyStore = pgpkeyStore();
        switch (_$status()) {
          case 'Decrypt and Verify':
            await keyStore.loadPublic(key);
            onlykey_api_pgp.emit("status", "Decrypting and verifying...");
            break;
          case 'Decrypt Only':
            onlykey_api_pgp.emit("status", "Decrypting...");
            var Decrypt_Only = true;
            break;
          default:
        }
        await keyStore.loadPrivate();
        kbpgp.unbox({
          keyfetch: keyStore.ring,
          raw: buffer,
          strict: Decrypt_Only ? false : true
        }, (err, ct) => {
          if (err) {
            onlykey_api_pgp.emit("error", err);
            return;
          }
          if (Decrypt_Only) {
            onlykey_api_pgp.emit("status", 'Done :)  downloading decrypted file ' + filename);
          }
          else {
            // var recipient_public_key;
            var ds = null;
            ds = ct[0].get_data_signer();
            if (ds == null) {
              onlykey_api_pgp.emit("status", 'Done :) file has no signature, downloading decrypted file ' + filename);
            }
            else {
              console.log(ds);
              var recipient_public_key;
              if (ds) { recipient_public_key = ds.get_key_manager(); }
              if (recipient_public_key) {
                console.log("Signed by PGP Key");
                var keyid = recipient_public_key.get_pgp_fingerprint().toString('hex').toUpperCase();
                keyid = keyid.slice(24, 40);
                var userid = recipient_public_key.userids[0].components.email.split("@")[0];
                console.log(keyid);
                console.log(userid);
                onlykey_api_pgp.emit("status", 'Done :) Signed by ' + userid + ' (Key ID: ' + keyid + '), downloading decrypted file ' + filename);
              }
            }
          }
          var finalfile = new Blob([ct[0].toBuffer()], { type: "text/plain;charset=utf-8" });
          //var finalfile2 = new Blob([result_buffer], {type: "octet/stream"});
          //new var blob = new Blob([xhr.response], {type: "octet/stream"});
          saveAs(finalfile, filename);
          onlykey_api_pgp.emit("done");
          callback();
          resolve();
        });

      });
    }

    onlykey_api_pgp.startEncryption = async function(to_pgpkeys, from_signer, message, file, callback) {
      onlykey_api_pgp.emit("working");
      onlykey_api_pgp.poll_type = 4;
      console.info(onlykey_api_pgp.poll_type);
      var r_inputs, keys;

      var sender_public_key, recipient_public_key;

      if (to_pgpkeys.value == "" && (_$status_is('Encrypt and Sign') || _$status_is('Encrypt Only'))) {
        onlykey_api_pgp.emit("error", "I need recipient's public pgp key to encrypt :(");
        return;
      }
      if (from_signer.value == "" && (_$status_is('Encrypt and Sign') || _$status_is('Sign Only'))) {
        onlykey_api_pgp.emit("error", "I need sender's public pgp key to sign :(");
        return;
      }
      if ( /*urlinputbox.value.slice(0,10) != '-----BEGIN' && */ !_$status_is('Sign Only')) { // Check if its a pasted public key
        //console.info(urlinputbox.value.slice(0,10));

        r_inputs = to_pgpkeys.split(",").map(function(val) {
          if (val.slice(0, 11) == '-----BEGIN%') // a pgp was escaped we should unescape it
            return unescape(val);
          else return val;
        });

        keys = [];
        for (var i in r_inputs) {
          var jquery_data_input = false; //$(urlinputbox).data("data-" + r_inputs[i]);
          if (jquery_data_input) {
            keys.push(jquery_data_input);
          }
          else {
            if (r_inputs[i].slice(0, 10) == '-----BEGIN')
              keys.push(r_inputs[i]);
            else
              keys.push(await onlykeyApi.getKey(r_inputs[i]));
            //keys.push(await this.downloadPublicKey(r_inputs[i])); 
          }
        }
        sender_public_key = keys;
        //sender_public_key = await this.downloadPublicKey(urlinputbox.value);
        console.info("sender_public_key" + sender_public_key);
      }

      if (from_signer.slice(0, 10) != '-----BEGIN' && !_$status_is('Encrypt Only')) { // Check if its a pasted public key
        console.info(from_signer.slice(0, 10));
        recipient_public_key = await onlykeyApi.getKey(from_signer);
        console.info("recipient_public_key" + recipient_public_key);
      }
      else {
        recipient_public_key = from_signer;
      }
      if (message != null) await encryptText(sender_public_key, recipient_public_key, message, callback);
      else await encryptFile(sender_public_key, recipient_public_key, file, callback);
    };

    async function encryptText(key1, key2, msg, callback) {
      return new Promise(async(resolve) => {
        var keyStore = pgpkeyStore();
        var keyList = [];
        var params;
        switch (_$status()) {
          case 'Encrypt and Sign':
            if (key1 instanceof Array) {
              for (var i in key1) {
                keyList.push(await keyStore.loadPublic(key1[i]));
              }
            }
            else {
              keyList.push(await keyStore.loadPublic(key1));
            }

            await keyStore.loadPublicSignerID(key2);
            params = {
              msg: msg,
              encrypt_for: keyList,
              sign_with: await keyStore.loadPrivate()
            };
            onlykey_api_pgp.emit("status", 'Encrypting and signing message ...');
            break;
          case 'Encrypt Only':
            if (key1 instanceof Array) {
              for (var i in key1) {
                keyList.push(await keyStore.loadPublic(key1[i]));
              }
            }
            else {
              keyList.push(await keyStore.loadPublic(key1));
            }
            params = {
              msg: msg,
              encrypt_for: keyList
            };
            onlykey_api_pgp.emit("status", 'Encrypting message ...');
            break;
          case 'Sign Only':
            await keyStore.loadPublicSignerID(key2);
            params = {
              msg: msg,
              sign_with: await keyStore.loadPrivate()
            };
            onlykey_api_pgp.emit("status", 'Signing message ...');
            break;
          default:
            break;
        }
        kbpgp.box(params, (err, results) => {
          if (err) {
            onlykey_api_pgp.emit("error", err);
            return;
          }
          if ((document.getElementById('onlykey_start').value) == 'Sign Only') {
            onlykey_api_pgp.emit("status", 'Done :)  Click here to copy message, then paste signed message into an email, IM, whatever.');
          }
          else {
            onlykey_api_pgp.emit("status", 'Done :)  Click here to copy message, then paste encrypted message into an email, IM, whatever.');
          }

          _$status("finished");
          onlykey_api_pgp.emit("done");
          callback(results);
          return resolve();
        });
      });
    }

    async function encryptFile(key1, key2, f, callback) {


      //console.info(f);
      //console.info(f.files[0]);
      // todo process multiple files
      // await readfiles(infile);
      var zip = new JSZip();
      //var folderzip = zip.folder("files");
      var txt = "";
      if ('files' in f) {
        for (var i = 0; i < f.files.length; i++) {
          var file = f.files[i];
          if (!file.size) {
            onlykey_api_pgp.emit("error", "No files selected :(");
            return;
          }
          else {
            if ('name' in file) {
              txt += "file name: " + file.name;
              zip.file(file.name, file);
            }
            if ('size' in file) {
              txt += " file size: " + file.size;
            }
            if ('type' in file) {
              txt += " file type: " + file.type;
            }
          }
        }
      }
      else {
        onlykey_api_pgp.emit("error", "No files selected :(");
      }

      var firstfilename = f.files[0].name;
      var filename = document.getElementById('filename').value ? document.getElementById('filename').value : firstfilename;
      if (typeof f.files[1] !== "undefined") onlykey_api_pgp.emit("status", 'Processing files');
      else onlykey_api_pgp.emit("status", 'Processing ' + filename);
      document.getElementById('filedetails').innerHTML = txt;
      return new Promise(resolve => {
        zip.generateAsync({
            type: "uint8array",
            //compression: "STORE",
            compression: "DEFLATE",
            compressionOptions: {
              level: 1
            }
          })
          .then(async function(zip) {
            //console.log(zip);
            //console.log(kbpgp.Buffer.from(zip));
            var keyStore = pgpkeyStore();
            var params;
            var keyList = [];
            var sender_private_key;
            switch (_$status()) {
              case 'Encrypt and Sign':
                if (key1 instanceof Array) {
                  for (var i in key1) {
                    keyList.push(await keyStore.loadPublic(key1[i]));
                  }
                }
                else {
                  keyList.push(await keyStore.loadPublic(key1));
                }
                // loadPublic(key1);
                await keyStore.loadPublicSignerID(key2);
                sender_private_key = await keyStore.loadPrivate();
                params = {
                  msg: kbpgp.Buffer.from(zip),
                  encrypt_for: keyList,
                  sign_with: sender_private_key
                };
                onlykey_api_pgp.emit("status", 'Encrypting and signing...');
                break;
              case 'Encrypt Only':
                if (key1 instanceof Array) {
                  for (var i in key1) {
                    keyList.push(await keyStore.loadPublic(key1[i]));
                  }
                }
                else {
                  keyList.push(await keyStore.loadPublic(key1));
                }
                params = {
                  msg: kbpgp.Buffer.from(zip),
                  encrypt_for: keyList
                };
                onlykey_api_pgp.emit("status", 'Encrypting...');
                break;
              case 'Sign Only':
                await keyStore.loadPublicSignerID(key2);
                sender_private_key = await keyStore.loadPrivate();
                params = {
                  msg: kbpgp.Buffer.from(zip),
                  sign_with: sender_private_key
                };
                onlykey_api_pgp.emit("status", 'Signing...');
                break;
              default:
            }

            kbpgp.box(params, async function(err, result_string, result_buffer) {
              if (err) {
                onlykey_api_pgp.emit("error", err);
                return;
              }
              //console.log(result_string);
              //console.log(result_buffer);
              //console.log(filename);
              if ((document.getElementById('onlykey_start').value) == 'Sign Only')
                onlykey_api_pgp.emit("status", 'Done :)  downloading signed file ' + filename + '.zip.gpg');
              else
                onlykey_api_pgp.emit("status", 'Done :)  downloading encrypted file ' + filename + '.zip.gpg');
              _$status("finished");
              if (usevirtru != null) {
                try {
                  onlykey_api_pgp.emit("status", 'Done :)  downloading encrypted file ' + filename + '.tdf');
                  await encryptOrDecryptFile(result_buffer, filename + ".zip.gpg", true, 1);
                  return resolve();
                }
                catch (err) {
                  console.error(err);
                  onlykey_api_pgp.emit("status", 'An error occurred attempting to encrypt this file. Please be sure you have authenticated, and try again.');
                }
                onlykey_api_pgp.emit("done");
                callback();
              }
              else {
                var finalfile = new Blob([result_buffer], { type: "text/plain;charset=utf-8" });
                saveAs(finalfile, filename + ".zip.gpg");
                onlykey_api_pgp.emit("done");
                callback();
                return resolve();
              }
            });
          });
      });
    }


    onlykey_api_pgp.keyStore = pgpkeyStore;

    function pgpkeyStore() {
      var keyStore = {};

      keyStore.ring = new kbpgp.keyring.KeyRing();

      // var sender_public_key;
      // var recipient_public_key;
      // var sender_private_key;

      keyStore.loadPublic = function loadPublic(key) {
        return new Promise(async function(resolve) {
          onlykey_api_pgp.emit("status", "Checking recipient's public key...");
          if (key == "") {
            onlykey_api_pgp.emit("error", "I need recipient's public pgp key :(");
            return;
          }

          kbpgp.KeyManager.import_from_armored_pgp({
            armored: key
          }, (error, recipient) => {
            if (error) {
              onlykey_api_pgp.emit("error", error);
              return;
            }
            else {
              resolve(recipient);
              keyStore.ring.add_key_manager(recipient);
            }
          });
        });
      };

      keyStore.loadPublicSignerID = function loadPublicSignerID(key) {

        return new Promise(async function(resolve) {
          onlykey_api_pgp.emit("status", "Checking sender's public key...");
          if (key == "") {
            onlykey_api_pgp.emit("error", "I need sender's public pgp key :(");
            return;
          }
          kbpgp.KeyManager.import_from_armored_pgp({
            armored: key
          }, (error, sender) => {
            if (error) {
              onlykey_api_pgp.emit("error", error);
              return;
            }
            else {
              var subkey;
              var keyids = sender.get_all_pgp_key_ids();
              if (typeof keyids[2] !== "undefined") {
                onlykey_api_pgp.poll_delay = 1; //Assuming RSA 2048
                subkey = 2;
              }
              else {
                onlykey_api_pgp.poll_delay = 8; //Assuming RSA 4096 or 3072
                subkey = 0;
              }
              KB_ONLYKEY.custom_keyid = keyids[subkey].toString('hex').toUpperCase();
              KB_ONLYKEY.custom_keyid = KB_ONLYKEY.custom_keyid.match(/.{2}/g).map(hexStrToDec);
              console.info("KB_ONLYKEY.custom_keyid" + KB_ONLYKEY.custom_keyid);
              resolve(KB_ONLYKEY.custom_keyid);
            }
          });
        });
      };

      keyStore.loadPrivate = function loadPrivate() {
        return new Promise(async function(resolve) {
          kbpgp.KeyManager.import_from_armored_pgp({
            armored: onlykey_api_pgp.test_pgp_key()
          }, (err, sender) => {
            if (err) {
              onlykey_api_pgp.emit("error", err);
              return;
            }

            if (sender.is_pgp_locked()) {
              let passphrase = 'test123';

              sender.unlock_pgp({
                passphrase: passphrase
              }, err => {
                if (!err) {
                  //console.log(`Loaded test private key using passphrase ${passphrase}`);
                  keyStore.ring.add_key_manager(sender);
                  resolve(sender);
                }
              });
            }
            else {
              //console.log("Loaded test private key w/o passphrase");
              resolve(sender);
            }
          });
        });
      };

      return keyStore;
    };

    onlykey_api_pgp.test_pgp_key = function test_pgp_key() {
      //this is public public key for the private key block that is returned
      //displayed for diagnostics purposes
      /*
      -----BEGIN PGP PUBLIC KEY BLOCK-----
      Version: Keybase OpenPGP v2.1.0
      Comment: https://keybase.io/crypto

      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
      T93J2CvJFKBr3QFlPST+
      =73ob
      -----END PGP PUBLIC KEY BLOCK-----
      */
      //PRIVATE KEY BLOCK pw `test123`
      return `-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: TEST KEY v1.0.0
Comment: THIS KEY IS JUST A PLACEHOLDER

xcaGBFms0QoBEAC9hQ0tnhwnSYlLQmVTsvVWyYnnS8woQnLLr0gz9gb2ZSxE
gh7SMQewx5xff7zsxhcRoID00tarP4KueEOx2sPwFFgbK5jhN1UDEA0zG3oA
/bkEet6c7Q4Y25wlp0eYRpW2KIEdVH9uzNyUS7S5Phw8QtvxWLI+rudmhrNk
Pvjm4c7kPT1TpfCYDMQmF7RVSaXYDH6vE/gqLKjiD/71LQZmQzDtLkvC2fh4
frBhdZUVHmIuZaDZ/8QtcslODovqAe6stBtCsgZ1lEx8otbTpt88PIYbPNGi
kiHrbjK3CYusoq1Rl4/LN/jFkJnO9J8KpfA5R+lnQ6GfzacQ3BfpkQ7Ib2Tu
NSwHOe5nSGIpbsujWh6GAmRzo+AOHmbUj6gbuaA8qIdD+VDXNh/O4g26be+l
RO12pz6VOCk2W+Gmvwmbk789atmNOIk0eUeJ/jPFyXVqM5DMfHuBssydqQr8
9EoQo+id2ev8glfmx1kT7oiN5d/WCpEq4SSxf7TxNawqIEK5LAgv6dONd8e0
GsTxibRVxqrTDc8q07dIgXU4nybCBHRrcd1gj785uJcSsuSSB5TnRRmcst+q
BsunUZbM8iw9g8OUqZj2k70utgIaP5kIIFhMgne9iLYd/g47pMLdoAWcQXdL
pwcHfB3jF8ukuQCpHg1FaKP8oU1jO6Yrk9FHwwARAQAB/gkDCHD+rb/6JEKx
YOw4tTZ1yyHEQRjSoFuwx2vsi1T96TTF4JlTvncVkaFsbvYrTdybEUjc8e6a
UuKDZoMKzr3VBJXbXXhtZLZlWhd+LWN4bFixn9wifoGHN9ptNzobMo3dibjA
cMkNB6ocxWrlbvq44WNYXPezFIloSzf6vb2puZjVcd1nJSLxHY5HaykTdqwi
2TCQhOTa3EBwlQpNNgUdetA3erf22r+FesfYSVjUt8bO6b7jwaXHUAg0RU9D
SCLPCrAqz4WY9RUxziMiUY531LeKffpALwoA8Qwt9F4i03ecrBw7XKbHvL9O
KRcg+3HUNxT9+3P3v4r3Vyqa80g2iYfiA/yd5f6wKWiYbuhaHiHnFljnPqjr
ufSB1hWJoQVfK7Lau/PIZQqZ3vpo3xQJkG7QyYF5hM5ZKlFd9vqxUQhn2mI4
zC1aOhg/CDLvatspb2J9JxH457YxWsXK4garUl0g6EYTdSZRalLfQ1EHpvzM
jSwwFN8d+UgaqO/X/I3G4oHfnaNRY4YdpIpAZZ1JvKS7v2O/r5ct46bVKQUg
TKffG+4QI/g9sizhmBzOTFWO2i8wdu5gvVxvl7dnPrgxyPBlZK9lryBW2++l
YsjQ41TxPmdzZGfzE3MPvQZ+Sni5QXA3icKDWzEcp8Zd8KukVyvKnVJiMM5F
mpvtcQbhnphpiFFt9aEPO1soid02lNG3qlO97EpS1KExZOW95hF9u2F2q9p/
0BTcahyxjoE1oinakjg/BEqcF8TgaEmpTtDYoljz87vpRyEHKAOl3IXyiubB
WMyZfraF6hZ3mRGKofOX8A7hdqFx1j/6myzywf1JsRSa6u8Dp4m38mDKKhcf
ERqDcVWuJafZBWOXPcdxIVBDmopTn7uM8Ii0wEYWBFqgf6dN2p6BprDcm2Om
qiqhDE3UoqjQXgHqh7Bn8AjpfqSkXFRsrkOhcbyqzYGt+kEbnFPFP1QhyWSj
60p7eMxW7bG6rJcyOWvq5GZaaVime3+sXTV37vYzuNWc0RQ3FklKbiLvVCjL
NHbWOUtQpHE/i39UUK31/Rncqzgoenn6ThqXZZZl+LP8FFIOZ80VnlSxM71U
d7XRqk1wjFE7NBzbtTypaDXbm3Wilq9SJ68kfOxZUC9asAvU5B1teiVshFA2
QmMTCz0hng8/HldlntUOVQjmh/gC5E52cva6QF0Cu8JKfVGoAC5wEIuV3gVx
Zu+IVEtHWpCA8bOudtYx4QZvKVCbjSaK6Rf1UE+cUfLESCnXt9BHzcPq0q90
WVMXNVSS0CQ84FCk3zAZgnrZBmOFuiXvXXqrpS8w2k8LFiP5or4ZCYTc0qUp
pSFk8QBnfdX63IXifBQtuaD1Iz49Lf2Vpfxv+F/qXaPQ6Bl3bfv1QY9nNh48
+OVZBpnMas8W4co/Ke7GiOJKqScpcW/MlaKZVLR2ywthC4vpTjFBiK3epLOF
J63bR/0TV5Koj62CdyVENtecbfWce5yx9s5AAdKDoA3Q18mMm13OJb868Nu0
O2ZlAXb/3PMWp8zS6zd6gP8Aw8q1a+NlZVtyFA7aaBEQyRbHMG/Qeyy6wmlE
nP/rfuWVuPLmSD7GsS6TkofmLsk/fuWbuAFBnYuoWM+XrRwWX0SOmZJzYELV
shnhPaTO+71B4vsCbuQVfNcMYBmpt7iAG23Ky1FNnKy8jszwq4S2XPRukT0+
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
=ayNx
-----END PGP PRIVATE KEY BLOCK-----`;
    };

    function hexStrToDec(hexStr) {
      return ~~(new Number('0x' + hexStr).toString(10));
    }

    async function myreaderload(reader) {
      return new Promise(resolve => {
        reader.onloadend = function() {
          return resolve(reader.result);
        };
      });
    }

    onlykey_api_pgp.getMessageKeyIds = function(message, callback) {
      var ring = new kbpgp2.keyring.KeyRing();
      kbpgp2.unbox({
        keyfetch: ring,
        armored: message
      }, function(err, literals) {
        var keyids;
        err = err.message.toString();
        if (err.indexOf("key not found: ") == 0) {
          err = err.replace("key not found: ", "");
          try { keyids = JSON.parse(err); }
          catch (e) {}
        }
        callback(keyids);
      });
    };

    onlykey_api_pgp.getPublicKeyIds = function(public_key, callback) {
      kbpgp2.KeyManager.import_from_armored_pgp({
        armored: public_key
      }, (error, keyObj) => {
        if (error) {
          return;
        }
        else {
          callback(keyObj.pgp.get_all_key_ids());
        }
      });
    };

    onlykey_api_pgp.getPublicKeyInfo = function(public_key, callback) {
      kbpgp2.KeyManager.import_from_armored_pgp({
        armored: public_key
      }, (error, keyObj) => {
        if (error) {
          return;
        }
        else {
          callback(keyObj);
        }
      });
    };

    return onlykey_api_pgp;
  };

};
