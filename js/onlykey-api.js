var userDict = {}           // UserId -> KeyHandle
var keyHandleDict = {};     // KeyHandle -> PublicKey
var hw_RNG = {};

var appId = window.location.origin;
var version = "U2F_V2";
var OKversion;

var sha256 = function(s) {
  var md = forge.md.sha256.create();
  md.update(bytes2string(s));
  return Array.from(md.digest().toHex().match(/.{2}/g).map(hexStrToDec));
};

var appKey;
var appPub;
var appPubPart;
var okPub;
var sharedsec;
var _status;
var pin;
var poll_type, poll_delay;
var custom_keyid;
var msgType;
var keySlot;
var browserid = 0; //Default Chrome
var counter = 0;
var encrypted_data;
const OKDECRYPT = 240;
const OKSIGN = 237;
const OKSETTIME = 228;
const OKGETPUBKEY = 236;
const OKGETRESPONSE = 242;
const OKPING = 243;


const button = document.getElementById('onlykey_start');

/**
 * Initializes OnlyKey
 * Performs NACL key exchange to encrypt all future packets
 * Receives hardware generated entropy for future use
 */
okinit = async function() {
  //Initialize OnlyKey
    if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1 || navigator.userAgent.toLowerCase().indexOf('android') > -1) {
    browserid = 128; //Firefox
    console.info("Firefox browser");
  } else {
    console.info("Chrome browser (Default)");
  }
    msg_polling({ type: 1, delay: 0 }); //Set time on OnlyKey, get firmware version, get ecc public
    await wait(3000);
    if (typeof(sharedsec) === "undefined") {
    headermsg("OnlyKey not connected! Remove/reinsert OnlyKey and then refresh page");
  } else {
    //Initialize App
     window.initapp();
  }
}

/**
 * Use promise and setTimeout to wait x seconds
 */
let wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Request response from OnlyKey using U2F authentication message
 * @param {number} params.delay
 * Number of seconds to delay before requesting response
 * @param {number} params.type
 * Type of response requested - OKSETTIME, OKGETPUBKEY, OKSIGN, OKDECRYPT
 */
async function msg_polling(params = {}, cb) {
  var delay = params.delay || 0;
  const type = params.type || 1; // default type to 1
  if (OKversion == 'Original') {
    delay = delay*4;
  }

  setTimeout(async function() {
  console.info("Requesting response from OnlyKey");
  if (type == 1) { //OKSETTIME
    var message = [255, 255, 255, 255, (OKSETTIME-browserid)]; //Same header and message type used in App
    var currentEpochTime = Math.round(new Date().getTime() / 1000.0).toString(16);
    msg("Setting current time on OnlyKey to " + new Date());
    var timePart = currentEpochTime.match(/.{2}/g).map(hexStrToDec);
    var empty = new Array(23).fill(0);
    Array.prototype.push.apply(message, timePart);
    appKey = nacl.box.keyPair();
    console.info(appKey);
    console.info(appKey.publicKey);
    console.info(appKey.secretKey);
    console.info("Application ECDH Public Key: ", appKey.publicKey);
    Array.prototype.push.apply(message, appKey.publicKey);
    Array.prototype.push.apply(message, empty);
    var b64keyhandle = bytes2b64(message);
    counter = 0;
  } else if (type == 2) { //OKGETPUB
      var message = [255, 255, 255, 255, (OKGETPUBKEY-browserid)]; //Add header and message type
      msg("Checking to see if this key is assigned to an OnlyKey Slot " + custom_keyid);
      var empty = new Array(50).fill(0);
      Array.prototype.push.apply(message, custom_keyid);
      Array.prototype.push.apply(message, empty);
      while (message.length < 64) message.push(0);
      var encryptedkeyHandle = await aesgcm_encrypt(message);
      var b64keyhandle = bytes2b64(encryptedkeyHandle);
  } else { //Ping and get Response From OKSIGN or OKDECRYPT
      if (_status == 'done_challenge') counter++;
      if (_status == 'finished') return encrypted_data;
      console.info("Sending Ping Request to OnlyKey");
      var message = [255, 255, 255, 255]; //Add header and message type
      var ciphertext = new Uint8Array(60).fill(0);
      ciphertext[0] = (OKPING-browserid);
      Array.prototype.push.apply(message, ciphertext);
      while (message.length < 64) message.push(0);
      var encryptedkeyHandle = await aesgcm_encrypt(message);
      var b64keyhandle = bytes2b64(encryptedkeyHandle);
      _setStatus('waiting_ping');
  }
  var challenge = mkchallenge();
  var req = { "challenge": challenge, "keyHandle": b64keyhandle,
               "appId": appId, "version": version };
  u2f.sign(appId, challenge, [req], async function(response) {
    var result = await custom_auth_response(response);
    var data = await Promise;
    if (_status === 'finished') {
      console.info("Finished");
    } else if (_status === 'waiting_ping') {
      console.info("Ping Successful");
      _setStatus('pending_challenge');
      data = 1;
    }
    if (result == 2) {
        msg("Polling succeeded but no data was received");
        data = 1;
    } else if (result <= 5) {
      data = 1;
    }
    if (type == 1) {
      if (result) {
        okPub = result.slice(21, 53);
        console.info("OnlyKey Public Key: ", okPub );
        sharedsec = nacl.box.before(Uint8Array.from(okPub), appKey.secretKey);
        console.info("NACL shared secret: ", sharedsec );
        OKversion = result[19] == 99 ? 'Color' : 'Original';
        var FWversion = bytes2string(result.slice(8, 20));
        msg("OnlyKey " + OKversion + " " + FWversion);
        headermsg("OnlyKey " + OKversion + " Connected\n" + FWversion);
        hw_RNG.entropy = result.slice(53, result.length);
        msg("HW generated entropy: " + hw_RNG.entropy);
        var key = sha256(sharedsec); //AES256 key sha256 hash of shared secret
        console.info("AES Key", key);
      } else {
        msg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
      }
      return;
    } else if (type == 2) {
      if (result) {
        var pubkey = result.slice(0, 1); //slot number containing matching key
        msg("Public Key found in slot" + pubkey);
        var entropy = result.slice(2, result.length);
        msg("HW generated entropy" + entropy);
      } else {
        msg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
        headermsg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
      }
      return pubkey;
    } else if (type == 3 && _status == 'finished') {
      if (result) {
        data = result;
      } else {
        msg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
        headermsg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
      }
    } else if (type == 4 && _status == 'finished') {
      if (result) {
        var oksignature = result.slice(0, result.length); //4+32+2+32
        data = oksignature;
      } else {
        msg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
        headermsg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
      }
    }
    if (typeof cb === 'function') cb(null, data);
  });
}, (delay * 1000));
}

/**
 * Decrypt ciphertext via OnlyKey
 * @param {Array} ct
 */
auth_decrypt = function(ct, cb) { //OnlyKey decrypt request to keyHandle
  if (typeof(sharedsec) === "undefined"){
    button.textContent = "Insert OnlyKey and reload page";
    return;
  }
  cb = cb || noop;
  if (ct.length == 396) {
    poll_delay = 5; //5 Second delay for RSA 3072
  } else if (ct.length == 524) {
    poll_delay = 7; //7 Second delay for RSA 4096
  }
  if (OKversion == 'Original') {
    poll_delay = poll_delay*4;
  }
  var padded_ct = ct.slice(12, ct.length);
  var keyid = ct.slice(1, 8);
  var pin_hash = sha256(padded_ct);
  console.info("Padded CT Packet bytes", Array.from(padded_ct));
  console.info("Key ID bytes", Array.from(keyid));
  pin  = [ get_pin(pin_hash[0]), get_pin(pin_hash[15]), get_pin(pin_hash[31]) ];
  msg("Generated PIN" + pin);
  return u2fSignBuffer(typeof padded_ct === 'string' ? padded_ct.match(/.{2}/g) : padded_ct, cb);
};

/**
 * Sign message via OnlyKey
 * @param {Array} ct
 */
auth_sign = function(ct, cb) { //OnlyKey sign request to keyHandle
  if (typeof(sharedsec) === "undefined"){
    button.textContent = "Insert OnlyKey and reload page";
    return;
  }
  var pin_hash = sha256(ct);
  cb = cb || noop;
  console.info("Signature Packet bytes ", Array.from(ct));
  pin  = [ get_pin(pin_hash[0]), get_pin(pin_hash[15]), get_pin(pin_hash[31]) ];
  console.info("Generated PIN", pin);
  return u2fSignBuffer(typeof ct === 'string' ? ct.match(/.{2}/g) : ct, cb);
};

/**
 * Parse custom U2F sign response
 * @param {Array} response
 */
async function custom_auth_response(response) {
  console.info("Response", response);
  var err = response['errorCode'];
  var errMes = response['errorMessage'];
  console.info("Response code ", err);
  console.info(errMes);
  if (browserid != 128) { //Chrome
    if (err) {
      if (errMes === "device status code: -7f") { //OnlyKey uses err 127 as ping reply, ack
        console.info("Ack message received");
      } else if (errMes === "device status code: -80") { //incorrect challenge code entered
          if (_status === 'waiting_ping') {
          console.info("incorrect challenge code entered");
          button.textContent = "Incorrect challenge code entered";
          _setStatus('wrong_challenge');
        }
      } else if (errMes === "device status code: -81") { //key type not set as signature/decrypt
        console.info("key type not set as signature/decrypt");
        button.textContent = "key type not set as signature/decrypt";
        _setStatus('wrong_type');
      } else if (errMes === "device status code: -82") { //no key set in this slot
        console.info("no key set in this slot");
        button.textContent = "no key set in this slot";
        _setStatus('no_key');
      } else if (errMes === "device status code: -83") { //invalid key, key check failed
        console.info("invalid key, key check failed");
        button.textContent = "invalid key, key check failed";
        _setStatus('bad_key');
      } else if (errMes === "device status code: -84") { //invalid data, or data does not match key
        console.info("invalid data, or data does not match key");
        button.textContent = "invalid data, or data does not match key";
        _setStatus('bad_data');
      } else if (errMes === "device status code: -85") { //no data ready
        console.info("no data ready");
        button.textContent = "no data ready";
      } else if (errMes === "device status code: -b") {
        console.info("Timeout or challenge pin entered ");
        counter-=3;
        _setStatus('done_challenge');
        ping(0);
      } else if (err == 5) { //Ping failed meaning correct challenge entered
        console.info("Timeout or challenge pin entered ");
        _setStatus('done_challenge');
        counter-=2;
        return 1;
      } else if (err) {
        console.info("Failed with error code ", err);
        counter--;
        //other error
        return 1;
      }
    counter++;
    return 1;
    }
  } else if (err) {
    _setStatus('done_challenge');
    return 1;
  }
  var sigData = string2bytes(u2f_unb64(response['signatureData']));
  console.info("Data Received: ", sigData);
  var U2Fcounter = sigData.slice(1,5);
  console.info("U2Fcounter: ", U2Fcounter);
  var parsedData = [];
  var halflen;
  if (sigData[8] == 0) {
    halflen = 256;
  } else {
    halflen = sigData[8];
  }
  Array.prototype.push.apply(parsedData, sigData.slice(9,(halflen+9)));
  Array.prototype.push.apply(parsedData, sigData.slice((halflen+9+2), (halflen+9+2+halflen)));
  if (U2Fcounter[0] + U2Fcounter[1] + U2Fcounter[2] + U2Fcounter[3] == 0) { //unencrypted data
    console.info("Parsed Data: ", parsedData);
    return parsedData;
  }
  else { //encrypted data
    var decryptedparsedData = await aesgcm_decrypt(parsedData);
    console.info("Parsed Data: ", decryptedparsedData);
    if(decryptedparsedData[0] == 69 && decryptedparsedData[1] == 114 && decryptedparsedData[2] == 114 && decryptedparsedData[3] == 111 && decryptedparsedData[4] == 114) {
      //Using Firefox Quantum's incomplete U2F implementation... so bad
      console.info("Decode response message");
      if (decryptedparsedData[6] == 0) {
        console.info("Ack message received");
      } else if(decryptedparsedData[6] == 1) {
        console.info("incorrect challenge code entered");
        button.textContent = "Incorrect challenge code entered";
        _setStatus('wrong_challenge');
      } else if (decryptedparsedData[6] == 2) {
        console.info("key type not set as signature/decrypt");
        button.textContent = "key type not set as signature/decrypt";
        _setStatus('wrong_type');
      } else if (decryptedparsedData[6] == 3) {
        console.info("no key set in this slot");
        button.textContent = "no key set in this slot";
        _setStatus('no_key');
      } else if (decryptedparsedData[6] == 4) {
        console.info("invalid key, key check failed");
        button.textContent = "invalid key, key check failed";
        _setStatus('bad_key');
      } else if (decryptedparsedData[6] == 5) {
        console.info("invalid data, or data does not match key");
        button.textContent = "invalid data, or data does not match key";
        _setStatus('bad_data');
      } else if (decryptedparsedData[6] == 6) {
        console.info("no data ready");
        button.textContent = "no data ready";
        return 6;
      }
      return 1;
    }
    _setStatus('finished');
    encrypted_data = parsedData;
    return parsedData;
  }
}

/**
 * Perform AES_256_GCM decryption using NACL shared secret
 * @param {Array} encrypted
 * @return {Array}
 */
function aesgcm_decrypt(encrypted) {
  return new Promise(resolve => {
    counter++;
    forge.options.usePureJavaScript = true;
    var key = sha256(sharedsec); //AES256 key sha256 hash of shared secret
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
    decipher.update(forge.util.createBuffer(Uint8Array.from(encrypted)));
    var plaintext = decipher.output.toHex()
    decipher.finish();

    //console.log("Decrypted AES-GCM Hex", forge.util.bytesToHex(decrypted).match(/.{2}/g).map(hexStrToDec));
    //encrypted = forge.util.bytesToHex(decrypted).match(/.{2}/g).map(hexStrToDec);
    resolve(plaintext.match(/.{2}/g).map(hexStrToDec));
  });
}

/**
 * Perform AES_256_GCM encryption using NACL shared secret
 * @param {Array} plaintext
 * @return {Array}
 */
function aesgcm_encrypt(plaintext) {
  return new Promise(resolve => {
    counter++;
    forge.options.usePureJavaScript = true;
    var key = sha256(sharedsec); //AES256 key sha256 hash of shared secret
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
    ciphertext = ciphertext.toHex();
    resolve(ciphertext.match(/.{2}/g).map(hexStrToDec));
  });
}

/**
 * Break cipherText into chunks and send via u2f sign
 * @param {Array} cipherText
 */
async function u2fSignBuffer(cipherText, mainCallback) {
    // this function should recursively call itself until all bytes are sent in chunks
    var message = [255, 255, 255, 255, type = document.getElementById('onlykey_start').value == 'Encrypt and Sign' ? (OKSIGN-browserid) : (OKDECRYPT-browserid), slotId()]; //Add header, message type, and key to use
    var maxPacketSize = 57;
    var finalPacket = cipherText.length - maxPacketSize <= 0;
    var ctChunk = cipherText.slice(0, maxPacketSize);
    message.push(finalPacket ? ctChunk.length : 255); // 'FF'
    Array.prototype.push.apply(message, ctChunk);

    var cb = finalPacket ? doPinTimer.bind(null, 20) : u2fSignBuffer.bind(null, cipherText.slice(maxPacketSize), mainCallback);

    var challenge = mkchallenge();
    while (message.length < 64) message.push(0);
    var encryptedkeyHandle = await aesgcm_encrypt(message);
    var b64keyhandle = bytes2b64(encryptedkeyHandle);
    var req = { "challenge": challenge, "keyHandle": b64keyhandle,
                 "appId": appId, "version": version };

    console.info("Handlekey bytes ", message);
    console.info("Sending Handlekey ", encryptedkeyHandle);
    console.info("Sending challenge ", challenge);

    u2f.sign(appId, challenge, [req], function(response) {
      var result = custom_auth_response(response);
      msg((result ? "Successfully sent" : "Error sending") + " to OnlyKey");
      if (result) {
        if (finalPacket) {
          console.info("Final packet ");
          _setStatus('pending_challenge');
          cb().then(skey => {
            console.info("skey ", skey);
            mainCallback(skey);
          }).catch(err => msg(err));
        } else {
          cb();
        }
      }
    }, 3);
}

/**
 * Display number of seconds remaining to enter challenge code on OnlyKey
 * @param {number} seconds
 */
window.doPinTimer = async function (seconds) {
  return new Promise(async function updateTimer(resolve, reject, secondsRemaining) {
    secondsRemaining = typeof secondsRemaining === 'number' ? secondsRemaining : seconds || 20;

    if (_status === 'done_challenge' || _status === 'waiting_ping') {
      _setStatus('done_challenge');
      const btmsg = `Waiting ${poll_delay} seconds for OnlyKey to process message.`;
      button.textContent = btmsg;
      console.info("Delay ", poll_delay);
      await ping(poll_delay); //Delay
    } else if (_status === 'pending_challenge') {
        if (secondsRemaining <= 4) {
          const err = 'Time expired for PIN confirmation';
          return reject(err);
        }
        const btmsg = `You have ${secondsRemaining} seconds to enter challenge code ${pin} on OnlyKey.`;
        button.textContent = btmsg;
        console.info("enter challenge code", pin);
        await ping(0);
    }

    if (_status === 'finished') {
      if(browserid == 128 && encrypted_data.length != 64) counter-=2;
      var decrypted_data = await aesgcm_decrypt(encrypted_data);
      if (decrypted_data.length == 64) {
        var entropy = decrypted_data.slice(36, 64);
        decrypted_data = decrypted_data.slice(0, 35);
        console.info("HW generated entropy =", entropy);
      }
      console.info("Parsed Decrypted Data: ", decrypted_data);
      return resolve(decrypted_data);
    }

    setTimeout(updateTimer.bind(null, resolve, reject, secondsRemaining-=4), 4000);
  });
};

/**
 * Ping OnlyKey for resoponse after delay
 * @param {number} delay
 */
async function ping (delay) {
  return await msg_polling({ type: poll_type, delay: delay });
}

IntToByteArray = function(int) {
    var byteArray = [0, 0, 0, 0];
    for ( var index = 0; index < 4; index ++ ) {
        var byte = int & 0xff;
        byteArray [ (3 - index) ] = byte;
        int = (int - byte) / 256 ;
    }
    return byteArray;
};

function get_pin (byte) {
  if (byte < 6) return 1;
  else {
    return (byte % 5) + 1;
  }
}

function id(s) { return document.getElementById(s); }

function msg(s) { id('messages').innerHTML += "<br>" + s; }

function headermsg(s) { id('header_messages').innerHTML += "<br>" + s; }

function _setStatus(newStatus) {
  _status = newStatus;
  console.info("Changed _status to ", newStatus);
}

function userId() {
    var el = id('userid');
    return el && el.value || 'u2ftest';
}

function slotId() { return id('slotid') ? id('slotid').value : type = document.getElementById('onlykey_start').value == 'Encrypt and Sign' ? 2 : 1; }

function b64EncodeUnicode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
}

function u2f_b64(s) {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function u2f_unb64(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  return atob(s + '==='.slice((s.length+3) % 4));
}
function string2bytes(s) {
  var len = s.length;
  var bytes = new Uint8Array(len);
  for (var i=0; i<len; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}
hexStrToDec = function(hexStr) {
    return ~~(new Number('0x' + hexStr).toString(10));
};

function bcat(buflist) {
  var len = 0;
  for (var i=0; i<buflist.length; i++) {
    if (typeof(buflist[i])=='string') buflist[i]=string2bytes(buflist[i]);
    len += buflist[i].length;
  }
  var buf = new Uint8Array(len);
  len = 0;
  for (var i=0; i<buflist.length; i++) {
    buf.set(buflist[i], len);
    len += buflist[i].length;
  }
  return buf;
}

function chr(c) { return String.fromCharCode(c); } // Because map passes 3 args
function bytes2string(bytes) { return Array.from(bytes).map(chr).join(''); }
function bytes2b64(bytes) { return u2f_b64(bytes2string(bytes)); }

//Generate a random number for challenge value
function mkchallenge() {
  var s = [];
  for(i=0;i<32;i++) s[i] = String.fromCharCode(Math.floor(Math.random()*256));
  return u2f_b64(s.join());
}

function noop() {}
