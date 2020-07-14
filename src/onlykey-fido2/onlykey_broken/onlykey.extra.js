module.exports = function(imports) {

  var console = imports.console;

  var forge = require("./forge.min.js");

  var $exports = {};
  
  $exports.sha256 = function(s) {
    var md = forge.md.sha256.create();
    md.update($exports.bytes2string(s));
    return Array.from(md.digest().toHex().match(/.{2}/g).map($exports.hexStrToDec));
  };

  $exports.wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  $exports.string2bytes = function string2bytes(s) {
    var len = s.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = s.charCodeAt(i);
    return bytes;
  };

  $exports.u2f_unb64 = function u2f_unb64(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    return window.atob(s + '==='.slice((s.length + 3) % 4));
  };

  $exports.IntToByteArray = function(int) {
    var byteArray = [0, 0, 0, 0];
    for (var index = 0; index < 4; index++) {
      var byte = int & 0xff;
      byteArray[(3 - index)] = byte;
      int = (int - byte) / 256;
    }
    return byteArray;
  };

  $exports.hexStrToDec = function hexStrToDec(hexStr) {
    return ~~(new Number('0x' + hexStr).toString(10));
  };

  $exports.mkchallenge = function mkchallenge(challenge) {
    var s = [];
    for (var i = 0; i < 32; i++) s[i] = String.fromCharCode(challenge[i]);
    return $exports.u2f_b64(s.join());
  };

  $exports.u2f_b64 = function u2f_b64(s) {
    return window.btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  $exports.noop = function noop() {};

  $exports.bytes2string = function bytes2string(bytes) {
    var ret = Array.from(bytes).map(function chr(c) {
      return String.fromCharCode(c);
    }).join('');
    return ret;
  };

  /*
  $exports.getstringlen = function getstringlen(bytes) {
    for (var i = 1; i <= bytes.length; i++) {
      // console.info("getstringlen ", i);
      if ((bytes[i] > 122 || bytes[i] < 97) && bytes[i] != 32) return i;
    }
  };
  */
  
  $exports.getstringlen = function getstringlen(bytes) {
    var c = 0;
    for (var i = 1; i <= bytes.length; i++) {
//       console.info("getstringlen ", i, String.fromCharCode(bytes[i));
      if ((bytes[i] > 122 || bytes[i] < 32) && bytes[i] != 32) 
        return i;
    }
    return c;
  };

  $exports.bytes2b64 = function bytes2b64(bytes) {
    return $exports.u2f_b64($exports.bytes2string(bytes));
  };

  //todo: move getAllUrlParams to pages plugin
  $exports.getAllUrlParams = function getAllUrlParams(url) {
    // get query string from url (optional) or window
    var queryString = url ? url.split('?')[1] : window.location.search.slice(1);
    // we'll store the parameters here
    var obj = {
      "#": window.location.hash.split('#')[1]// add the hash
    };
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
        //paramName = paramName.toLowerCase();
        //if (typeof paramValue === 'string') paramValue = paramValue.toLowerCase();
        
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

  $exports.getOS = function getOS() {
    if(typeof window == "undefined"){
      os = "Node";
      return os;
    }
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


  $exports.ctap_error_codes = {
      0x00: 'CTAP1_SUCCESS',//0
      0x01: 'CTAP1_ERR_INVALID_COMMAND',//1
      0x02: 'CTAP1_ERR_INVALID_PARAMETER',//2
      0x03: 'CTAP1_ERR_INVALID_LENGTH',//3
      0x04: 'CTAP1_ERR_INVALID_SEQ',//4
      0x05: 'CTAP1_ERR_TIMEOUT',//5
      0x06: 'CTAP1_ERR_CHANNEL_BUSY',//6
     0x0A: 'CTAP1_ERR_LOCK_REQUIRED',//10
     0x0B: 'CTAP1_ERR_INVALID_CHANNEL',//11
     
     0x10: 'CTAP2_ERR_CBOR_PARSING',//16
     0x11: 'CTAP2_ERR_CBOR_UNEXPECTED_TYPE',//17
     0x12: 'CTAP2_ERR_INVALID_CBOR',//18
     0x13: 'CTAP2_ERR_INVALID_CBOR_TYPE',//19
     0x14: 'CTAP2_ERR_MISSING_PARAMETER',//20
     0x15: 'CTAP2_ERR_LIMIT_EXCEEDED',//21
     0x16: 'CTAP2_ERR_UNSUPPORTED_EXTENSION',//22
     0x17: 'CTAP2_ERR_TOO_MANY_ELEMENTS',//23
     0x18: 'CTAP2_ERR_EXTENSION_NOT_SUPPORTED',//24
     0x19: 'CTAP2_ERR_CREDENTIAL_EXCLUDED',//25
     0x20: 'CTAP2_ERR_CREDENTIAL_NOT_VALID',//32
     0x21: 'CTAP2_ERR_PROCESSING',//33
     0x22: 'CTAP2_ERR_INVALID_CREDENTIAL',//34
     0x23: 'CTAP2_ERR_USER_ACTION_PENDING',//35
     0x24: 'CTAP2_ERR_OPERATION_PENDING',//36
     0x25: 'CTAP2_ERR_NO_OPERATIONS',//37
     0x26: 'CTAP2_ERR_UNSUPPORTED_ALGORITHM',//38
     0x27: 'CTAP2_ERR_OPERATION_DENIED',//39
     0x28: 'CTAP2_ERR_KEY_STORE_FULL',//40
     0x29: 'CTAP2_ERR_NOT_BUSY',//41
     0x2A: 'CTAP2_ERR_NO_OPERATION_PENDING',//42
     0x2B: 'CTAP2_ERR_UNSUPPORTED_OPTION',//43
     0x2C: 'CTAP2_ERR_INVALID_OPTION',//44
     0x2D: 'CTAP2_ERR_KEEPALIVE_CANCEL',//45
     0x2E: 'CTAP2_ERR_NO_CREDENTIALS',//46
     0x2F: 'CTAP2_ERR_USER_ACTION_TIMEOUT',//47
     0x30: 'CTAP2_ERR_NOT_ALLOWED',//48
     0x31: 'CTAP2_ERR_PIN_INVALID',//49
     0x32: 'CTAP2_ERR_PIN_BLOCKED',//50
     0x33: 'CTAP2_ERR_PIN_AUTH_INVALID',//51
     0x34: 'CTAP2_ERR_PIN_AUTH_BLOCKED',//52
     0x35: 'CTAP2_ERR_PIN_NOT_SET',//53
     0x36: 'CTAP2_ERR_PIN_REQUIRED',//54
     0x37: 'CTAP2_ERR_PIN_POLICY_VIOLATION',//55
     0x38: 'CTAP2_ERR_PIN_TOKEN_EXPIRED',//56
     0x39: 'CTAP2_ERR_REQUEST_TOO_LARGE',//57
  };
  
  
  var counter = 0;
  /**
   * Perform AES_256_GCM decryption using NACL shared secret
   * @param {Array} encrypted
   * @return {Array}
   */
  $exports.aesgcm_decrypt = function aesgcm_decrypt(encrypted, shared_sec) {
    return new Promise(resolve => {
      forge.options.usePureJavaScript = true;
      var key = $exports.sha256(shared_sec); //AES256 key sha256 hash of shared secret
      //console.log("Key", key);
      var iv = $exports.IntToByteArray(counter);
      while (iv.length < 12) iv.push(0);
      iv = Uint8Array.from(iv);
      //console.log("IV", iv);
      var decipher = forge.cipher.createDecipher('AES-GCM', key);
      decipher.start({
        iv: iv,
        tagLength: 0, // optional, defaults to 128 bits
      });
      //console.log("Encrypted", encrypted);
      var buffer = forge.util.createBuffer(Uint8Array.from(encrypted));
      //console.log("Encrypted length", buffer.length());
      //console.log(buffer);
      decipher.update(buffer);
      decipher.finish();
      var plaintext = decipher.output.toHex();
      //console.log("Plaintext", plaintext);
      //console.log("Decrypted AES-GCM Hex", forge.util.bytesToHex(decrypted).match(/.{2}/g).map(hexStrToDec));
      //encrypted = forge.util.bytesToHex(decrypted).match(/.{2}/g).map(hexStrToDec);
      resolve(plaintext.match(/.{2}/g).map($exports.hexStrToDec));
    });
  };

  /**
   * Perform AES_256_GCM encryption using NACL shared secret
   * @param {Array} plaintext
   * @return {Array}
   */
  $exports.aesgcm_encrypt = function aesgcm_encrypt(plaintext, shared_sec) {
    return new Promise(resolve => {
      forge.options.usePureJavaScript = true;
      var key = $exports.sha256(shared_sec); //AES256 key sha256 hash of shared secret
      //console.log("Key", key);
      var iv = $exports.IntToByteArray(counter);
      while (iv.length < 12) iv.push(0);
      iv = Uint8Array.from(iv);
      //console.log("IV", iv);
      //Counter used as IV, unique for each message
      var cipher = forge.cipher.createCipher('AES-GCM', key);
      cipher.start({
        iv: iv, // should be a 12-byte binary-encoded string or byte buffer
        tagLength: 0
      });
      //console.log("Plaintext", plaintext);
      cipher.update(forge.util.createBuffer(Uint8Array.from(plaintext)));
      cipher.finish();
      var ciphertext = cipher.output;
      ciphertext = ciphertext.toHex(),
        resolve(ciphertext.match(/.{2}/g).map($exports.hexStrToDec));
    });
  };


  return $exports;
};
