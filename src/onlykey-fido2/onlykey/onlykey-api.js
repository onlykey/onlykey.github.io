module.exports = function(imports) {

  var window = imports.window
  var console = imports.console;

  /* globals  */
  var EventEmitter = require("events").EventEmitter;
  var onlykey_api = new EventEmitter();


  var nacl = require("./nacl.min.js");

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


  async function digestBuff(buff) {
      const msgUint8 = buff;
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
      return hashHex;
  }
  
  onlykey_api.browser = "Chrome";
  onlykey_api.os = getOS();

  var appKey;
  var okPub;

  // const OKDECRYPT = 240;
  // const OKSIGN = 237;
  const OKCONNECT = 228;
  // const OKGETPUBKEY = 236;
  // const OKGETRESPONSE = 242;
  // const OKPING = 243;

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
      //Set time on OnlyKey, get firmware version, get ecc public
      OK_CONNECT(async function(aerr, status) {
        // console.log(err);
        if (status) {
          console.log("OKCONNECT STATUS", status);
        }

        if (typeof(onlykey_api.sharedsec) === "undefined") {
          if (onlykey_api.browser == 'Firefox') headermsg("<p class='text-danger'>OnlyKey not connected! Close this tab and open a new one to try again.</p>");
          else headermsg("<p class='text-danger'>OnlyKey not connected! Refresh this page to try again.</p>");
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

  };
  onlykey_api.check = function(cb) {
    onlykey_api.init = false;
    return onlykey_api.connect(cb);
  };
  onlykey_api.connect = onlykey_api.initok;

  async function OK_CONNECT(callback) {
    return new Promise(async function(resolve, reject) {

      function cb(err, data) {
        if (typeof callback === 'function') callback(err, data);
        resolve({ data: data, error: err });
      }

      var delay = 1;
      if (onlykey_api.OKversion == 'Original') {
        delay = delay * 4;
      }

      console.info("Connecting to OnlyKey");
      var cmd;
      var encryptedkeyHandle;
      var message;

      imports.app.emit("ok-connecting");
      cmd = OKCONNECT;
      message = [255, 255, 255, 255, OKCONNECT]; //Add header and message type
      var currentEpochTime = Math.round(new Date().getTime() / 1000.0).toString(16);
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
      encryptedkeyHandle = Uint8Array.from(message); // Not encrypted as this is the initial key exchange
      await wait(delay * 1000);
      var enc_resp = 1;
      var ctaphid_response = await ctaphid_via_webauthn(cmd, 2, null, null, encryptedkeyHandle, 6000, function(maybe_a_err, data) {
         console.info("ctaphid_response resp", maybe_a_err, data);
         
      });

      imports.app.emit("ok-waiting");

      var response;

      if (ctaphid_response.data && !ctaphid_response.error)
        response = ctaphid_response.data;
      
      if (!response) {
        if (onlykey_api.browser == 'Firefox') headermsg("<p class='text-danger'>OnlyKey not connected! Close this tab and open a new one to try again.</p>");
        else headermsg("<p class='text-danger'>OnlyKey not connected! Refresh this page to try again.</p>");
        imports.app.emit("ok-disconnected");
      }
      else {
        switch (ctaphid_response.status) {
          case "CTAP2_ERR_EXTENSION_NOT_SUPPORTED":
            break;
          case "CTAP1_SUCCESS":
            var BREAKING_BETA_8C = !!(bytes2string(response.slice(8, 20)) == "v0.2-beta.8c");
            
            if(!BREAKING_BETA_8C){
              okPub = response.slice(0, 32);
              
              // Decrypt with transit_key
              var transit_key = nacl.box.before(Uint8Array.from(okPub), appKey.secretKey);   
              console.info("Onlykey transit public", okPub);
              console.info("App transit public", appKey.publicKey);
              console.info("Transit shared secret", transit_key);
              transit_key = await digestBuff(Uint8Array.from(transit_key)); //AES256 key sha256 hash of shared secret
              console.info("App AES Key", transit_key);
              var encrypted  = response.slice(32, response.length);
              onlykey_api.FWversion = bytes2string(response.slice(32+8, 32+20));
              response = await aesgcm_decrypt(encrypted, transit_key);
              onlykey_api.OKversion = response[32+19] == 99 ? 'Color' : 'Go';
              onlykey_api.sharedsec = nacl.box.before(Uint8Array.from(okPub), appKey.secretKey);
              console.info("Version:",[onlykey_api.OKversion, onlykey_api.FWversion]);
              imports.app.emit("ok-connected");
              cb(null);
            }else{
              okPub = response.slice(21, 53);
              console.info("OnlyKey Public Key: ", okPub);
              onlykey_api.sharedsec = nacl.box.before(Uint8Array.from(okPub), appKey.secretKey);
              console.info("NACL shared secret: ", onlykey_api.sharedsec);
              onlykey_api.OKversion = response[19] == 99 ? 'Color' : 'Original';
              onlykey_api.FWversion = bytes2string(response.slice(8, 20));
              console.info("Version:",[onlykey_api.OKversion, onlykey_api.FWversion]);
              imports.app.emit("ok-connected");
              cb(null);
            }
            headermsg("<p class='text-success'>OnlyKey " + onlykey_api.FWversion + " Secure Connection Established</p>\n");
            break;
          default:
            imports.app.emit("ok-disconnected");
          
        }
        cb(null, ctaphid_response.status);

      }

    });
  }

  function encode_ctaphid_request_as_keyhandle(cmd, opt1, opt2, opt3, data) {
    // console.log('REQUEST CMD', cmd);
    // console.log('REQUEST OPT1', opt1);
    // console.log('REQUEST OPT2', opt2);
    // console.log('REQUEST OPT3', opt3);
    // console.log('REQUEST DATA', data);
    //var addr = 0;

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

    var signature_count;
    if (onlykey_api.os == "Node") {
      signature_count = (
        new DataView(toArrayBuffer(Buffer.from(response.authenticatorData.slice(33, 37))))
      ).getUint32(0, false); // get count as 32 bit BE integer
    }
    else {
      signature_count = (
        new DataView(
          response.authenticatorData.slice(33, 37)
        )
      ).getUint32(0, false); // get count as 32 bit BE integer
    }

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
          onlykey_api.unlocked = true;
        }
        else if (signature.length < 73 && bytes2string(data.slice(0, 6)) == 'Error ') {
          // Something went wrong, read the ascii response and display to user
          var msgtext = data.slice(0, getstringlen(data));
          error = bytes2string(msgtext);
        }
      default:
        console.warn("ctap_error_code", ctap_error_codes[error_code]);
        if (ctap_error_codes[error_code] == 'CTAP2_ERR_EXTENSION_NOT_SUPPORTED') {
           error = ctap_error_codes[error_code];
        }
        break;
    }

    return {
      count: signature_count,
      status: ctap_error_codes[error_code],
      data: data,
      error: error,
      signature: signature,
    };
  }

  function ctaphid_via_webauthn(cmd, opt1, opt2, opt3, data, timeout, cb) {
    var request = {
        cmd:cmd,
        opt1:opt1,
        opt2:opt2,
        opt3:opt3,
        input_data:data,
        timeout:timeout
      }
      
    //#define DERIVE_PUBLIC_KEY 1
    //#define DERIVE_SHARED_SECRET 2
    //#define NO_ENCRYPT_RESP 0
    //#define ENCRYPT_RESP 1
    var keyhandle = encode_ctaphid_request_as_keyhandle(cmd, opt1, opt2, opt3, data);
    var challenge = window.crypto.getRandomValues(new Uint8Array(32));
    
    var id = window.location.hostname;

    request.request_options = {
      challenge: challenge,
      allowCredentials: [{
        transports: ["usb"],
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
      
      console.log({ctaphid_request:request});
      var results = false;
      // console.log("REQUEST:", request_options);
      window.navigator.credentials.get({
        publicKey: request.request_options
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
        }

        results = response;

      }).then(assertion => {
        var response;
        if (!assertion && results) {
          response = results;
        }
        else {
          // console.log("GOT ASSERTION", assertion);
          // console.log("RESPONSE", assertion.response);
          response = decode_ctaphid_response_from_signature(assertion.response);
          response.request = request;
          // console.log("RESPONSE:", response);
        }
        console.log({ctaphid_response:response});
        
        if (cb) cb(response.error, response);
        resolve(response);
      });

    });

  }

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
  
  function id(s) { return document.getElementById(s); }
  
  function headermsg(s) { 
    //if(imports.app)
    //  imports.app.emit("ok-message",s);
    //else
      id('header_messages').innerHTML += "<br>" + s; 
    
  }
  

  return onlykey_api;
};
