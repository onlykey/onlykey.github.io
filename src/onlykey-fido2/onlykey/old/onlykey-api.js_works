module.exports = function(imports) {

  var console = imports.console;

  /* globals  */
  var EventEmitter = require("events").EventEmitter;
  var onlykey_api = new EventEmitter();


  var nacl = require("./nacl.min.js");
  // var forge = require("./forge.min.js");
  // const kbpgp = require('./kbpgp.onlykey.js')(onlykey_api, console);

  onlykey_api._status;
  onlykey_api.poll_delay;
  onlykey_api.poll_type;
  onlykey_api.custom_keyid;


  var {
    wait,
    sha256,
    hexStrToDec,
    bytes2string,
    // noop,
    getstringlen,
    // mkchallenge,
    // bytes2b64,
    getOS,
    ctap_error_codes,
    getAllUrlParams,
    // aesgcm_decrypt,
    // aesgcm_encrypt
  } = require("./onlykey.extra.js")(imports);
  onlykey_api.getAllUrlParams = getAllUrlParams; //<-- todo: move to pages plugin


  // var keyHandleDict = {}; // KeyHandle -> PublicKey
  // var hw_RNG = {};

  // var appId = window.location.origin;
  // var version = "U2F_V2";
  // var OKversion;
  // var FWversion;
  onlykey_api.browser = "Chrome";
  onlykey_api.os = getOS();


  var appKey;
  // var appPub;
  // var appPubPart;
  var okPub;

  // var sharedsec;

  // var pin;
  // var msgType;
  // var keySlot;
  // var browserid = 0; //Default Chrome
  // var counter = 0;
  // var encrypted_data;

  // const OKDECRYPT = 240;
  // const OKSIGN = 237;
  const OKCONNECT = 228;
  // const OKGETPUBKEY = 236;
  // const OKGETRESPONSE = 242;
  // const OKPING = 243;

  //const button = element_by_id('onlykey_start');

  /**
   * Initializes OnlyKey
   * Performs NACL key exchange to encrypt all future packets
   * Receives hardware generated entropy for future use
   */
  onlykey_api.init = false;
  onlykey_api.initok = async function(callback) {
    return new Promise(async function(resolve) {
      if (onlykey_api.init) {
        if (callback && typeof callback == "function")
          callback();
        resolve();
      }

      //Initialize OnlyKey
      if (window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
        onlykey_api.browser = "Firefox";
      
      imports.app.$().ready(function(){
        //Set time on OnlyKey, get firmware version, get ecc public
        OK_CONNECT(async function(err, status) {
          console.log(err);
          if(status){
            console.log("OKCONNECT STATUS", status);
          }
  
          if (typeof(onlykey_api.sharedsec) === "undefined") {
            // if (browser == 'Firefox') headermsg("OnlyKey not connected! Close this tab and open a new one to try again.");
            // else headermsg("OnlyKey not connected! Refresh this page to try again.");
            if (callback && typeof callback == "function")
              callback(true);
            resolve();
          }
          else {
            onlykey_api.init = true;
            //Initialize App
            if (callback && typeof callback == "function")
              callback();
            resolve();
  
          }
        });
      });

      // if (os == 'Android') await wait(6000);
      // else await wait(3000);
      // await wait(1000);

    });
  };
  onlykey_api.check = function(cb){
    onlykey_api.init = false;
    onlykey_api.connect(cb);
  };
  onlykey_api.connect = onlykey_api.initok;

  // setTimeout(() => {
  //   onlykey_api.initok(function() {
  //     console.log("okconnect done");
  //   });
  // }, 1000);

  async function OK_CONNECT(callback) {
    return new Promise(async function(resolve, reject) {

      function cb(err, data) {
        if (typeof callback === 'function') callback(err, data);
        // if (err) return reject(err);
        resolve({data: data, error:err});
      }

      var delay = 1;
      if (onlykey_api.OKversion == 'Original') {
        delay = delay * 4;
      }


      //setTimeout(async function() {
      console.info("Connecting to OnlyKey");
      var cmd;
      var encryptedkeyHandle;
      var message;

      imports.app.emit("ok-connecting");

      cmd = OKCONNECT;
      message = [255, 255, 255, 255, OKCONNECT]; //Add header and message type
      var currentEpochTime = Math.round(new Date().getTime() / 1000.0).toString(16);
      // msg("Setting current time on OnlyKey to " + new Date());
      var timePart = currentEpochTime.match(/.{2}/g).map(hexStrToDec);
      Array.prototype.push.apply(message, timePart);
      appKey = nacl.box.keyPair();
      // console.info(appKey);
      // console.info(appKey.publicKey);
      // console.info(appKey.secretKey);
      // console.info("Application ECDH Public Key: ", appKey.publicKey);
      Array.prototype.push.apply(message, appKey.publicKey);
      var env = [onlykey_api.browser.charCodeAt(0), onlykey_api.os.charCodeAt(0)];
      Array.prototype.push.apply(message, env);
      // msg(browser + " Browser running on " + os + " Operating System");
      encryptedkeyHandle = Uint8Array.from(message); // Not encrypted as this is the initial key exchange


      await wait(delay * 1000);

      var ctaphid_response = await ctaphid_via_webauthn(cmd, 2, null, null, encryptedkeyHandle, 6000, function(maybe_a_err, data) {
        console.log("ctaphid_response resp", maybe_a_err, data);
      });
      
      imports.app.emit("ok-waiting");

      var response;

      if (ctaphid_response.data && !ctaphid_response.error)
        response = ctaphid_response.data;

      if (!response) {
        //check errors
        // if(ctaphid_response.error && ctaphid_response.error.indexOf("Error NotAllowedError") > -1 )
        imports.app.emit("ok-disconnected");
      }
      else {
        switch (ctaphid_response.status) {
          case "CTAP2_ERR_EXTENSION_NOT_SUPPORTED":
            break;
          case "CTAP1_SUCCESS":
            okPub = response.slice(21, 53);
            // console.info("OnlyKey Public Key: ", okPub);
            onlykey_api.sharedsec = nacl.box.before(Uint8Array.from(okPub), appKey.secretKey);
            // console.info("NACL shared secret: ", onlykey_api.sharedsec);
            onlykey_api.OKversion = response[19] == 99 ? 'Color' : 'Original';
            onlykey_api.FWversion = bytes2string(response.slice(8, 20));
            // msg("OnlyKey " + OKversion + " " + FWversion + " secure encrypted connection established using NACL shared secret and AES256 GCM encryption\n");
            // element_by_id('header_messages').innerHTML = "<br>";
            // headermsg("OnlyKey " + FWversion + " Secure Connection Established\n");
            var key = sha256(onlykey_api.sharedsec); //AES256 key sha256 hash of shared secret
            // console.info("AES Key", key);

            imports.app.emit("ok-connected");
            cb(null);
            break;
        }
        cb(null, ctaphid_response.status);
        
      }

    });
  }

  // The idea is to encode CTAPHID_VENDOR commands
  // in the keyhandle, that is sent via WebAuthn or U2F
  // as signature request to the authenticator.
  //
  // The authenticator reacts to signature requests with
  // the four "magic" bytes set with a special signature,
  // which can then be decoded

  function encode_ctaphid_request_as_keyhandle(cmd, opt1, opt2, opt3, data) {
    // console.log('REQUEST CMD', cmd);
    // console.log('REQUEST OPT1', opt1);
    // console.log('REQUEST OPT2', opt2);
    // console.log('REQUEST OPT3', opt3);
    // console.log('REQUEST DATA', data);
    //var addr = 0;

    // should we check that `data` is either null or an Uint8Array?
    data = data || new Uint8Array();

    const offset = 10;

    if (offset + data.length > 255) {
      throw new Error("Max size exceeded");
    }

    // `is_extension_request` expects at least 16 bytes of data
    const data_pad = data.length < 16 ? 16 - data.length : 0;
    var array = new Uint8Array(offset + data.length + data_pad);

    array[0] = cmd & 0xff;

    array[1] = opt1 & 0xff;
    array[2] = opt2 & 0xff;
    array[3] = opt3 & 0xff;
    array[4] = 0x8C; // 140
    array[5] = 0x27; //  39
    array[6] = 0x90; // 144
    array[7] = 0xf6; // 246

    array[8] = 0;
    array[9] = data.length & 0xff;

    array.set(data, offset);

    // console.log('FORMATTED REQUEST:', array);
    return array;
  }

  function decode_ctaphid_response_from_signature(response) {
    // https://fidoalliance.org/specs/fido-v2.0-rd-20170927/fido-client-to-authenticator-protocol-v2.0-rd-20170927.html#using-the-ctap2-authenticatorgetassertion-command-with-ctap1-u2f-authenticators<Paste>
    //
    // compared to `parse_device_response`, the data is encoded a little differently here
    //
    // attestation.response.authenticatorData
    //
    // first 32 bytes: SHA-256 hash of the rp.id
    // 1 byte: zeroth bit = user presence set in U2F response (always 1)
    // last 4 bytes: signature counter (32 bit big-endian)
    //
    // attestation.response.signature
    // signature data (bytes 5-end of U2F response

    // console.log('UNFORMATTED RESPONSE:', response);

    var signature_count = (
      new DataView(
        response.authenticatorData.slice(33, 37)
      )
    ).getUint32(0, false); // get count as 32 bit BE integer

    var signature = new Uint8Array(response.signature);
    var error_code = signature[0];

    var data = null;
    var error = null;

    if (signature.length > 1)
      data = signature.slice(1, signature.length);

    switch (ctap_error_codes[error_code]) {
      case "CTAP1_SUCCESS":
        if (bytes2string(data.slice(0, 9)) == 'UNLOCKEDv') {
          // Reset shared secret and start over
          // _$status(element_by_id('onlykey_start').value);
          onlykey_api.unlocked = true;
        }
        else if (signature.length < 73 && bytes2string(data.slice(0, 6)) == 'Error ') {
          // Something went wrong, read the ascii response and display to user
          var msgtext = data.slice(0, getstringlen(data));
          /*const btmsg = `${bytes2string(msgtext)}. Refresh this page and try again.`;
          var button = element_by_id("onlykey_start");
          if (button) {
            button.textContent = btmsg;
            button.classList.remove('working');
            button.classList.add('error');
          }*/
          //onlykey_api.emit("error", `${bytes2string(msgtext)}. Refresh this page and try again.`);
          // _$status('finished');
          //throw new Error(bytes2string(msgtext));
          error = bytes2string(msgtext);
        }
        break;
        // case "CTAP2_ERR_NO_OPERATION_PENDING":
        //   error = 'no data received';
        //   break;
        // case "CTAP2_ERR_USER_ACTION_PENDING":

        //   break;
        // case "CTAP2_ERR_OPERATION_PENDING":
        //   break;
      default:
        console.warn("ctap_error_code", ctap_error_codes[error_code]);
        break;
    }


    /*
    if (error_code == ctap_error_codes['CTAP1_SUCCESS']) {

      if (bytes2string(data.slice(0, 9)) == 'UNLOCKEDv') {
        // Reset shared secret and start over
        // _$status(element_by_id('onlykey_start').value);
        onlykey_api.unlocked = true;
      }
      else if (signature.length < 73 && bytes2string(data.slice(0, 6)) == 'Error ') {
        // Something went wrong, read the ascii response and display to user
        var msgtext = data.slice(0, getstringlen(data));
        
        //onlykey_api.emit("error", `${bytes2string(msgtext)}. Refresh this page and try again.`);
        // _$status('finished');
        //throw new Error(bytes2string(msgtext));
        error = bytes2string(msgtext);
      }
      else if (_$status_is('waiting_ping') || _$status_is('done_challenge')) {
        // got data
        // encrypted_data = data;
        // $encrypted_data = data;
        // _$status('finished');
      }

    }
    else if (error_code == ctap_error_codes['CTAP2_ERR_NO_OPERATION_PENDING']) {
      // No data received, data has already been retreived or wiped due to 5 second timeout
      //onlykey_api.emit("error", 'no data received');

      // _$status('finished');
      //throw new Error('no data received');
      error = 'no data received';
    }
    else if (error_code == ctap_error_codes['CTAP2_ERR_USER_ACTION_PENDING']) {
      // Waiting for user to press button or enter challenge
      console.log('CTAP2_ERR_USER_ACTION_PENDING');
    }
    else if (error_code == ctap_error_codes['CTAP2_ERR_OPERATION_PENDING']) {
      // Waiting for user to press button or enter challenge
      console.log('CTAP2_ERR_OPERATION_PENDING');
    }
*/
    return {
      count: signature_count,
      status: ctap_error_codes[error_code],
      data: data,
      error: error,
      signature: signature,
    };
  }

  function ctaphid_via_webauthn(cmd, opt1, opt2, opt3, data, timeout, cb) {
    // if a token does not support CTAP2, WebAuthn re-encodes as CTAP1/U2F:
    // https://fidoalliance.org/specs/fido-v2.0-rd-20170927/fido-client-to-authenticator-protocol-v2.0-rd-20170927.html#interoperating-with-ctap1-u2f-authenticators
    //
    // the bootloader only supports CTAP1, so the idea is to drop
    // u2f-api.js and the Firefox about:config fiddling
    //
    // problem: the popup to press button flashes up briefly :(
    //

    //#define DERIVE_PUBLIC_KEY 1
    //#define DERIVE_SHARED_SECRET 2
    //#define NO_ENCRYPT_RESP 0
    //#define ENCRYPT_RESP 1
    var keyhandle = encode_ctaphid_request_as_keyhandle(cmd, opt1, opt2, opt3, data);
    var challenge = window.crypto.getRandomValues(new Uint8Array(32));
    var request_options;

    var id = window.location.hostname;

    request_options = {
      challenge: challenge,
      allowCredentials: [{
        id: keyhandle,
        type: 'public-key',
      }],
      timeout: timeout,
      //rpId: 'apps.crp.to',
      rpId: id,
      userVerification: 'discouraged',
      //userPresence: 'false',
      //mediation: 'silent',
      extensions: {
        // appid: 'https://apps.crp.to',
        appid: 'https://' + id
      },
    };

    return new Promise(async function(resolve) {
      // return 

      var results = false;
      console.log("REQUEST:", request_options);
      window.navigator.credentials.get({
        publicKey: request_options
      }).catch(error => {
        console.warn("ERROR CALLING:", cmd, opt1, opt2, opt3, data);
        console.warn("THE ERROR:", error);
        console.warn("NAME:", error.name);
        console.warn("MESSAGE:", error.message);
        var response = { error: "Error " + error.name + " " + error.message };
        if (error.name == 'NS_ERROR_ABORT' || error.name == 'AbortError' || error.name == 'InvalidStateError') {
          // _$status('done_challenge');
          response.error2 = response.error;
          response.error = "Error aborted or bad hw-key-state";
          // return resolve(-1); // 1 = set error: aborted or bad hw-key-state
        }

        if (error.name == 'NotAllowedError' && onlykey_api.os == 'Windows') {
          response.error2 = response.error;
          response.error = "Error Win 10 1903 issue maybe?";
          // return resolve(-2); // 2 = set error: Win 10 1903 issue
          // return 1;
        }

        // if (cb) cb(response.error, response);

        results = response;

        // return resolve(response); // 0 = unset error: 

      }).then(assertion => {
        var response;
        if (!assertion && results) {
          response = results;
        }
        else {
          // console.log("GOT ASSERTION", assertion);
          // console.log("RESPONSE", assertion.response);
          response = decode_ctaphid_response_from_signature(assertion.response);
          console.log("RESPONSE:", response);
        }
        if (cb) cb(response.error, response);
        resolve(response);
      });
      /*
      if (response.status) {
        switch (response.status) {
          case "CTAP2_ERR_OPERATION_PENDING":
            _$status('done_challenge');
          case "CTAP2_ERR_USER_ACTION_PENDING":
            resolve(response.status); //response.status;
            break;
          default:
            resolve(response.data);
        }
      }
      else { //no status: we have error
        resolve(response);
      }
      */

    });

  }

  onlykey_api.encode_ctaphid_request_as_keyhandle = encode_ctaphid_request_as_keyhandle;
  onlykey_api.decode_ctaphid_response_from_signature = decode_ctaphid_response_from_signature;
  onlykey_api.ctaphid_via_webauthn = ctaphid_via_webauthn;


  /**
   * Parse custom U2F sign response
   * @param {Array} response
   */
  /*
  async function custom_auth_response(response) {
    console.info("Response", response);
    var err = response['errorCode'];
    var errMes = response['errorMessage'];
    console.info("Response code ", err);
    console.info(errMes);
    var sigData = string2bytes(u2f_unb64(response['signatureData']));
    console.info("Data Received: ", sigData);
    var U2Fcounter = sigData.slice(1, 5);
    console.info("U2Fcounter: ", U2Fcounter);
    var parsedData = [];
    var halflen;
    //if (sigData[8] == 0) {
    //  halflen = 256;
    //} else {
    //  halflen = sigData[8];
    //}
    Array.prototype.push.apply(parsedData, sigData.slice(6, sigData.length));
    //Array.prototype.push.apply(parsedData, sigData.slice(9,(halflen+9)));
    //Array.prototype.push.apply(parsedData, sigData.slice((halflen+9+2), (halflen+9+2+halflen)));
    console.info("Parsed Data: ", parsedData);
    return parsedData;
  }
  */

  /*
  
  
  function _$status(newStatus) {
    onlykey_api._status = newStatus;
    console.info("Changed onlykey_api._status to ", newStatus);
  }
  
   function string2bytes(s) {
    var len = s.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = s.charCodeAt(i);
    return bytes;
  }

  function u2f_unb64(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    return window.atob(s + '==='.slice((s.length + 3) % 4));
  }

  let wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  var IntToByteArray = function(int) {
    var byteArray = [0, 0, 0, 0];
    for (var index = 0; index < 4; index++) {
      var byte = int & 0xff;
      byteArray[(3 - index)] = byte;
      int = (int - byte) / 256;
    }
    return byteArray;
  };

  function hexStrToDec(hexStr) {
    return ~~(new Number('0x' + hexStr).toString(10));
  }

  function mkchallenge(challenge) {
    var s = [];
    for (var i = 0; i < 32; i++) s[i] = String.fromCharCode(challenge[i]);
    return u2f_b64(s.join());
  }

  function u2f_b64(s) {
    return window.btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  function chr(c) {
    return String.fromCharCode(c);
  } // Because map passes 3 args

  function noop() {}

  function bytes2string(bytes) {
    var ret = Array.from(bytes).map(chr).join('');
    return ret;
  }

  function getstringlen(bytes) {
    for (var i = 1; i <= bytes.length; i++) {
      console.info("getstringlen ", i);
      if ((bytes[i] > 122 || bytes[i] < 97) && bytes[i] != 32) return i;
    }
  }

  function bytes2b64(bytes) {
    return u2f_b64(bytes2string(bytes));
  }

  onlykey_api.getAllUrlParams = getAllUrlParams;

  function getAllUrlParams(url) {
    // get query string from url (optional) or window
    var queryString = url ? url.split('?')[1] : window.location.search.slice(1);
    // we'll store the parameters here
    var obj = {};
    // if query string exists
    if (queryString) {
      // stuff after # is not part of query string, so get rid of it
      queryString = queryString.split('#')[0];
      // split our query string into its component parts
      var arr = queryString.split('&');
      for (var i = 0; i < arr.length; i++) {
        // separate the keys and the values
        var a = arr[i].split('=');
        // set parameter name and value (use 'true' if empty)
        var paramName = a[0];
        var paramValue = typeof(a[1]) === 'undefined' ? true : a[1];
        // (optional) keep case consistent
        paramName = paramName.toLowerCase();
        if (typeof paramValue === 'string') paramValue = paramValue.toLowerCase();
        // if the paramName ends with square brackets, e.g. colors[] or colors[2]
        if (paramName.match(/\[(\d+)?\]$/)) {
          // create key if it doesn't exist
          var key = paramName.replace(/\[(\d+)?\]/, '');
          if (!obj[key]) obj[key] = [];
          // if it's an indexed array e.g. colors[2]
          if (paramName.match(/\[\d+\]$/)) {
            // get the index value and add the entry at the appropriate position
            var index = /\[(\d+)\]/.exec(paramName)[1];
            obj[key][index] = paramValue;
          }
          else {
            // otherwise add the value to the end of the array
            obj[key].push(paramValue);
          }
        }
        else {
          // we're dealing with a string
          if (!obj[paramName]) {
            // if it doesn't exist, create property
            obj[paramName] = paramValue;
          }
          else if (obj[paramName] && typeof obj[paramName] === 'string') {
            // if property does exist and it's a string, convert it to an array
            obj[paramName] = [obj[paramName]];
            obj[paramName].push(paramValue);
          }
          else {
            // otherwise add the property
            obj[paramName].push(paramValue);
          }
        }
      }
    }
    return obj;
  }

  var sha256 = function(s) {
    var md = forge.md.sha256.create();
    md.update(bytes2string(s));
    return Array.from(md.digest().toHex().match(/.{2}/g).map(hexStrToDec));
  };


  // Perform AES_256_GCM decryption using NACL shared secret
  // @param {Array} encrypted
  // @return {Array}

  function aesgcm_decrypt(encrypted, shared_sec) {
    return new Promise(resolve => {
      forge.options.usePureJavaScript = true;
      var key = sha256(shared_sec); //AES256 key sha256 hash of shared secret
      console.log("Key", key);
      var iv = IntToByteArray(counter);
      while (iv.length < 12) iv.push(0);
      iv = Uint8Array.from(iv);
      console.log("IV", iv);
      var decipher = forge.cipher.createDecipher('AES-GCM', key);
      decipher.start({
        iv: iv,
        tagLength: 0, // optional, defaults to 128 bits
      });
      console.log("Encrypted", encrypted);
      var buffer = forge.util.createBuffer(Uint8Array.from(encrypted));
      console.log("Encrypted length", buffer.length());
      console.log(buffer);
      decipher.update(buffer);
      decipher.finish();
      var plaintext = decipher.output.toHex();
      console.log("Plaintext", plaintext);
      //console.log("Decrypted AES-GCM Hex", forge.util.bytesToHex(decrypted).match(/.{2}/g).map(hexStrToDec));
      //encrypted = forge.util.bytesToHex(decrypted).match(/.{2}/g).map(hexStrToDec);
      resolve(plaintext.match(/.{2}/g).map(hexStrToDec));
    });
  }


  // Perform AES_256_GCM encryption using NACL shared secret
  // @param {Array} plaintext
  // @return {Array}

  function aesgcm_encrypt(plaintext, shared_sec) {
    return new Promise(resolve => {
      forge.options.usePureJavaScript = true;
      var key = sha256(shared_sec); //AES256 key sha256 hash of shared secret
      console.log("Key", key);
      var iv = IntToByteArray(counter);
      while (iv.length < 12) iv.push(0);
      iv = Uint8Array.from(iv);
      console.log("IV", iv);
      //Counter used as IV, unique for each message
      var cipher = forge.cipher.createCipher('AES-GCM', key);
      cipher.start({
        iv: iv, // should be a 12-byte binary-encoded string or byte buffer
        tagLength: 0
      });
      console.log("Plaintext", plaintext);
      cipher.update(forge.util.createBuffer(Uint8Array.from(plaintext)));
      cipher.finish();
      var ciphertext = cipher.output;
      ciphertext = ciphertext.toHex(),
        resolve(ciphertext.match(/.{2}/g).map(hexStrToDec));
    });
  }

  var ctap_error_codes = {
    0x00: 'CTAP1_SUCCESS',
    0x01: 'CTAP1_ERR_INVALID_COMMAND',
    0x02: 'CTAP1_ERR_INVALID_PARAMETER',
    0x03: 'CTAP1_ERR_INVALID_LENGTH',
    0x04: 'CTAP1_ERR_INVALID_SEQ',
    0x05: 'CTAP1_ERR_TIMEOUT',
    0x06: 'CTAP1_ERR_CHANNEL_BUSY',
    0x0A: 'CTAP1_ERR_LOCK_REQUIRED',
    0x0B: 'CTAP1_ERR_INVALID_CHANNEL',

    0x10: 'CTAP2_ERR_CBOR_PARSING',
    0x11: 'CTAP2_ERR_CBOR_UNEXPECTED_TYPE',
    0x12: 'CTAP2_ERR_INVALID_CBOR',
    0x13: 'CTAP2_ERR_INVALID_CBOR_TYPE',
    0x14: 'CTAP2_ERR_MISSING_PARAMETER',
    0x15: 'CTAP2_ERR_LIMIT_EXCEEDED',
    0x16: 'CTAP2_ERR_UNSUPPORTED_EXTENSION',
    0x17: 'CTAP2_ERR_TOO_MANY_ELEMENTS',
    0x18: 'CTAP2_ERR_EXTENSION_NOT_SUPPORTED',
    0x19: 'CTAP2_ERR_CREDENTIAL_EXCLUDED',
    0x20: 'CTAP2_ERR_CREDENTIAL_NOT_VALID',
    0x21: 'CTAP2_ERR_PROCESSING',
    0x22: 'CTAP2_ERR_INVALID_CREDENTIAL',
    0x23: 'CTAP2_ERR_USER_ACTION_PENDING',
    0x24: 'CTAP2_ERR_OPERATION_PENDING',
    0x25: 'CTAP2_ERR_NO_OPERATIONS',
    0x26: 'CTAP2_ERR_UNSUPPORTED_ALGORITHM',
    0x27: 'CTAP2_ERR_OPERATION_DENIED',
    0x28: 'CTAP2_ERR_KEY_STORE_FULL',
    0x29: 'CTAP2_ERR_NOT_BUSY',
    0x2A: 'CTAP2_ERR_NO_OPERATION_PENDING',
    0x2B: 'CTAP2_ERR_UNSUPPORTED_OPTION',
    0x2C: 'CTAP2_ERR_INVALID_OPTION',
    0x2D: 'CTAP2_ERR_KEEPALIVE_CANCEL',
    0x2E: 'CTAP2_ERR_NO_CREDENTIALS',
    0x2F: 'CTAP2_ERR_USER_ACTION_TIMEOUT',
    0x30: 'CTAP2_ERR_NOT_ALLOWED',
    0x31: 'CTAP2_ERR_PIN_INVALID',
    0x32: 'CTAP2_ERR_PIN_BLOCKED',
    0x33: 'CTAP2_ERR_PIN_AUTH_INVALID',
    0x34: 'CTAP2_ERR_PIN_AUTH_BLOCKED',
    0x35: 'CTAP2_ERR_PIN_NOT_SET',
    0x36: 'CTAP2_ERR_PIN_REQUIRED',
    0x37: 'CTAP2_ERR_PIN_POLICY_VIOLATION',
    0x38: 'CTAP2_ERR_PIN_TOKEN_EXPIRED',
    0x39: 'CTAP2_ERR_REQUEST_TOO_LARGE',
  };

  function getOS() {
    var userAgent = window.navigator.userAgent,
      platform = window.navigator.platform,
      macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
      windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
      iosPlatforms = ['iPhone', 'iPad', 'iPod'],
      os = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
      os = 'Mac OS';
    }
    else if (iosPlatforms.indexOf(platform) !== -1) {
      os = 'iOS';
    }
    else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = 'Windows';
    }
    else if (/Android/.test(userAgent)) {
      os = 'Android';
    }
    else if (!os && /Linux/.test(platform)) {
      os = 'Linux';
    }

    return os;
  }
  
  
   //old
  onlykey_api.doPinTimer = async function(seconds) {
    return new Promise(async function updateTimer(resolve, reject, secondsRemaining) {
      secondsRemaining = typeof secondsRemaining === 'number' ? secondsRemaining : seconds || 10;
      var button = element_by_id("onlykey_start");

      if (onlykey_api._status === 'done_challenge' || onlykey_api._status === 'waiting_ping') {
        _$status('done_challenge');
        const btmsg = `Waiting for OnlyKey to process message.`;
        if (button) button.textContent = btmsg;
        console.info("Delay ", onlykey_api.poll_delay);
        await ping(onlykey_api.poll_delay - 2); //Delay
      }
      else if (onlykey_api._status === 'pending_challenge') {
        if (secondsRemaining <= 2) {
          _$status('done_challenge');
        }
        if (secondsRemaining >= 2) {
          const btmsg = `You have ${secondsRemaining} seconds to enter challenge code ${pin} on OnlyKey.`;
          if (button) button.textContent = btmsg;
          console.info("enter challenge code", pin);
        }
        //await ping(0); //Too many popups with FIDO2
      }

      if (onlykey_api._status === 'finished') {
        console.info("Parsed Encrypted Data: ", encrypted_data);
        var decrypted_data = await aesgcm_decrypt(encrypted_data);

        console.info("Parsed Decrypted Data: ", decrypted_data);
        return resolve(decrypted_data);
      }

      setTimeout(updateTimer.bind(null, resolve, reject, secondsRemaining -= 4), 4000);
    });
  };
  
*/

  return onlykey_api;
};
