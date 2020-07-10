module.exports = function(imports) {

  var window = imports.window
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
    aesgcm_decrypt,
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
  
  const COMMANDS = {
    "OKCONNECT": 228,
    "OKPING": 243,
    // "OKGETRESPONSE": 242,
    // "OKGETPUBKEY": 236,
    "OKDECRYPT": 240,
    "OKSIGN": 237
  }
  
  
  function getCMD(nameOrNumber){
    if(typeof nameOrNumber == "string"){
      if(COMMANDS[nameOrNumber]) 
        return COMMANDS[nameOrNumber];
    }else{
      for(var i in COMMANDS)  {
        if(nameOrNumber == COMMANDS[i])
        return i;
      }
    }
    return false;
  }
  onlykey_api.getCMD = getCMD;
  
  // const OKDECRYPT = 240;
  // const OKSIGN = 237;
  const OKCONNECT = getCMD('OKCONNECT');//228;
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
  onlykey_api.connect = async function(callback) {
    return new Promise(async function(resolve) {
      if (onlykey_api.init) {
        if (callback && typeof callback == "function")
          callback();
        resolve();
      }

      //Initialize OnlyKey
      if (window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
        onlykey_api.browser = "Firefox";

      (function() {
        //Set time on OnlyKey, get firmware version, get ecc public
        OK_CONNECT(async function(err, status) {
          //console.log(err);
          if (status) {
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
      })();

      // if (os == 'Android') await wait(6000);
      // else await wait(3000);
      // await wait(1000);

    });
  };


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
        resolve({ data: data, error: err });
      }

      var delay = 1;
      if (onlykey_api.OKversion == 'Original') {
        delay = delay * 4;
      }


      //setTimeout(async function() {
      //console.info("Connecting to OnlyKey");
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


      // await wait(delay * 1000);
      await wait(1000);
      var ctaphid_response = await ctaphid_via_webauthn(cmd, null, null, null, encryptedkeyHandle,6000, function(maybe_a_err, data) {
        //console.log("ctaphid_response resp", maybe_a_err, data);
      });

      imports.app.emit("ok-waiting");

      var response;

      if (ctaphid_response.data && !ctaphid_response.error)
        response = ctaphid_response.data;

      if (!response) {
        //check errors
        // if(ctaphid_response.error && ctaphid_response.error.indexOf("Error NotAllowedError") > -1 )
        if (onlykey_api.init == false)
          imports.app.emit("ok-disconnected");
        else if (ctaphid_response.abort) {
          imports.app.emit("ok-error");
        }
        else if (ctaphid_response.error)
          onlykey_api.emit("error", ctaphid_response.error);
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
            // var key = sha256(onlykey_api.sharedsec); //AES256 key sha256 hash of shared secret
            // console.info("AES Key", key);

            imports.app.emit("ok-connected");
            //cb(null);
            break;
        }
        cb(null, ctaphid_response.status);

      }

    });
  }



  onlykey_api.check = function(callback) {
    return new Promise(async function(resolve) {
      // if (onlykey_api.init) {
      //   if (typeof callback === 'function') 
      //     callback();
      //     resolve();
      // }

      (function() {
        //Set time on OnlyKey, get firmware version, get ecc public
        OK_CHECK(async function(err, status) {
          if (err)
            if (typeof callback === 'function') 
              callback(err);
          else if (typeof callback === 'function') 
            callback(null, status);
            
            resolve();
        });
      })();
    });
  };;

  async function OK_CHECK(callback) {
    return new Promise(async function(resolve, reject) {

      function cb(err, data) {
        if (typeof callback === 'function') callback(err, data);
        // if (err) return reject(err);
        resolve({ data: data, error: err });
      }

      var delay = 0;
      if (onlykey_api.OKversion == 'Original') {
        delay = delay * 4;
      }

      //setTimeout(async function() {
      console.info("Checking OnlyKey");

      imports.app.emit("ok-connecting");


      appKey = nacl.box.keyPair();
      // console.info(appKey);
      // console.info(appKey.publicKey);
      // console.info(appKey.secretKey);
      // console.info("Application ECDH Public Key: ", appKey.publicKey);

      var cmd = OKCONNECT;

      var message = ctaphid_custom_message_header(appKey.publicKey, cmd)

      var encryptedkeyHandle = Uint8Array.from(message); // Not encrypted as this is the initial key exchange


//       await wait(delay * 1000);
//       await wait(1000);
      var ctaphid_response = await ctaphid_via_webauthn(cmd, null, null, null, encryptedkeyHandle, 6000, function(maybe_a_err, data) {
        //console.log("ctaphid_response resp", maybe_a_err, data);
      });

      imports.app.emit("ok-waiting");

      var response;

      if (ctaphid_response.data && !ctaphid_response.error)
        response = ctaphid_response.data;

      if (!response) {
        //check errors
        // if(ctaphid_response.error && ctaphid_response.error.indexOf("Error NotAllowedError") > -1 )
        if (onlykey_api.init == false)
          imports.app.emit("ok-disconnected");
        else if (ctaphid_response.abort) {
          imports.app.emit("ok-error");
        }
        else if (ctaphid_response.error)
          onlykey_api.emit("error", ctaphid_response.error);
      }
      else {
        console.log("CHECK STATUS",ctaphid_response.status);
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
            // var key = sha256(onlykey_api.sharedsec); //AES256 key sha256 hash of shared secret
            // console.info("AES Key", key);

            imports.app.emit("ok-connected", onlykey_api.FWversion);
            //cb(null);
            break;
        }
        cb(null, ctaphid_response.status);

      }

    });
  }


  function ctaphid_custom_message_header(publicKey, CMD) {
    var message = [255, 255, 255, 255, CMD];

    //Add current epoch time
    var currentEpochTime = Math.round(new Date().getTime() / 1000.0).toString(16);
    var timePart = currentEpochTime.match(/.{2}/g).map(hexStrToDec);
    Array.prototype.push.apply(message, timePart);

    //Add transit pubkey
    Array.prototype.push.apply(message, publicKey);

    //Add Browser and OS codes
    var env = [onlykey_api.browser.charCodeAt(0), onlykey_api.os.charCodeAt(0)];
    Array.prototype.push.apply(message, env);

    return message;
  }

  // The idea is to encode CTAPHID_VENDOR commands
  // in the keyhandle, that is sent via WebAuthn or U2F
  // as signature request to the authenticator.
  //
  // The authenticator reacts to signature requests with
  // the four "magic" bytes set with a special signature,
  // which can then be decoded

  function encode_ctaphid_request_as_keyhandle(cmd, opt1, opt2, opt3, data) {
    //console.log('REQUEST CMD', getCMD(cmd));
    //console.log('REQUEST OPT1', opt1);
    //console.log('REQUEST OPT2', opt2);
    //console.log('REQUEST OPT3', opt3);
    //console.log('REQUEST DATA', data);
    //var addr = 0;

    // should we check that `data` is either null or an Uint8Array?
    data = data || new Uint8Array();

    const offset = 10;

    if (offset + data.length > 255) {
      throw new Error("Max size exceeded");
    }

    // `is_extension_request` expects at least 16 bytes of data
    const data_pad = data.length < 16 ? 16 - data.length : 0;
    // const data_pad = 255-data.length-offset;
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

    //console.log('FORMATTED REQUEST:', array);
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

    console.log('UNFORMATTED RESPONSE:', response);

    if (onlykey_api.os == "Node") {
      var signature_count = (
        new DataView(toArrayBuffer(Buffer.from(response.authenticatorData.slice(33, 37))))
      ).getUint32(0, false); // get count as 32 bit BE integer
    }
    else {
      var signature_count = (
        new DataView(
          response.authenticatorData.slice(33, 37)
        )
      ).getUint32(0, false); // get count as 32 bit BE integer
    }
    var signature = new Uint8Array(response.signature);
    var status_code = signature[0];

    var data = null;
    var error = null;

    if (signature.length > 1)
      data = signature.slice(1, signature.length);
    
    switch (ctap_error_codes[status_code]) {
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
          console.warn("decode_ctaphid_response_from_signature",error);
          break;
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
        console.log(bytes2string(data));
        console.warn("ctap_error_code", ctap_error_codes[status_code]);
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
    var decryptedData;
    
    try{
      decryptedData = aesgcm_decrypt(data, onlykey_api.sharedsec).catch(() => void(0));
    }catch(e){}
    
    console.log("FORMATED RESPONSE", {
      count: signature_count,
      status: ctap_error_codes[status_code],
      data: data,
      data_decrypted:decryptedData,
      error: error,
      signature: signature,
    })

    return {
      count: signature_count,
      status: ctap_error_codes[status_code],
      data: data,
      data_decrypted:decryptedData,
      error: error,
      signature: signature,
    };
  }

  function ctaphid_via_webauthn(cmd, opt1, opt2, opt3, data, timeout, cb) {
    
    console.log("ctaphid_via_webauthn", getCMD(cmd), opt1, opt2, opt3, data, timeout);
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
//       console.log("REQUEST:", request_options);
      wait(100);
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
          response.abort = true;
          // return resolve(-1); // 1 = set error: aborted or bad hw-key-state
        }

        if (error.name == 'NotAllowedError' && onlykey_api.os == 'Windows') {
          response.error2 = response.error;
          response.error = "Error Win 10 1903 issue maybe? or a CANCEL/ABORT ";
          response.abort = true;
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
          //console.log("GOT ASSERTION", assertion);
          //console.log("RESPONSE", assertion.response);
          response = decode_ctaphid_response_from_signature(assertion.response);
          //console.log("RESPONSE:", response);
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

  onlykey_api.ctaphid_custom_message_header = ctaphid_custom_message_header;
  onlykey_api.encode_ctaphid_request_as_keyhandle = encode_ctaphid_request_as_keyhandle;
  onlykey_api.decode_ctaphid_response_from_signature = decode_ctaphid_response_from_signature;
  onlykey_api.ctaphid_via_webauthn = ctaphid_via_webauthn;


  function toArrayBuffer(buf) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
      view[i] = buf[i];
    }
    return ab;
  }


  return onlykey_api;
};
