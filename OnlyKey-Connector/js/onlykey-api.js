var userDict = {}           // UserId -> KeyHandle
var keyHandleDict = {};     // KeyHandle -> PublicKey
var hw_RNG = {};

var appId = window.location.origin;
var version = "U2F_V2";
var OKversion;

var p256 = new ECC('p256');
var sha256 = function(s) { return p256.hash().update(s).digest(); };
var BN = p256.n.constructor;  // BN = BigNumber

var curve25519 = new ECC('curve25519');
var appKey;
var appPub;
var appPubPart;
var okPub;
var sharedsec;

var pin;
var poll_type, poll_delay;
var custom_keyid;
var msgType;
var keySlot;
var counter = 0;
const OKDECRYPT = 240;
const OKSIGN = 237;
const OKSETTIME = 228;
const OKGETPUBKEY = 236;
const OKGETRESPONSE = 242;
const OKPING = 243;

async function init() {
  await msg_polling({ type: 1, delay: 0 }); //Set time on OnlyKey, get firmware version, get ecc public
}

function id(s) { return document.getElementById(s); }

function msg(s) {
  id('messages').innerHTML += "<br>" + s;
  console.info(s);
}


var _status;
function _setStatus(newStatus) {
  _status = newStatus;
  msg(`Changed _status to ${newStatus}`);
}

function headermsg(s) { id('header_messages').innerHTML += "<br>" + s; }

function userId() {
    var el = id('userid');
    return el && el.value || 'u2ftest';
}

function slotId() { return id('slotid') ? id('slotid').value : 1; }

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
function hexStrToDec(hexStr) {
    return ~~(new Number('0x' + hexStr).toString(10));
}

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

function asn1bytes(asn1) {
  return asn1.stream.enc.slice(
    asn1.stream.pos, asn1.stream.pos + asn1.length + asn1.header);
}

//Generate a random number for challenge value
function mkchallenge() {
  var s = [];
  for(i=0;i<32;i++) s[i] = String.fromCharCode(Math.floor(Math.random()*256));
  return u2f_b64(s.join());
}

//Basic U2F enroll test
function enroll_local() {
  msg("Enrolling user " + userId());
  var challenge = mkchallenge();
  var req = { "challenge": challenge, "appId": appId, "version": version};
  u2f.register(appId, [req], [], function(response) {
    var result = process_enroll_response(response);
    msg("User " + userId() + " enroll " + (result ? "succeeded" : "failed"));
  });
}

//Basic U2F auth test
function auth_local() {
  msg("Authorizing user " + userId());
  keyHandle = userDict[userId()];
  if (!keyHandle) {
    msg("User " + userId() + " not enrolled");
    return;
  }
  msg("Sending Handlekey " + keyHandle);
  var challenge = mkchallenge();
  msg("Sending challenge " + challenge);
  var req = { "challenge": challenge, "keyHandle": keyHandle,
               "appId": appId, "version": version };
  u2f.sign(appId, challenge, [req], function(response) {
    var result = process_auth_response(response);
    msg("User " + userId() + " auth " + (result ? "succeeded" : "failed"));
  });
    msg("Finsihed");
}

let wait = ms => new Promise(resolve => setTimeout(resolve, ms));

//Function to send and retrive custom U2F messages
async function msg_polling(params = {}, cb) {
  const delay = params.delay || 0; // no delay by default
  const type = params.type || 1; // default type to 1
  await wait(delay*1000);
  msg("Requesting response from OnlyKey");
  if (type == 1) { //OKSETTIME
    var message = [255, 255, 255, 255, OKSETTIME]; //Same header and message type used in App
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
      var message = [255, 255, 255, 255, OKGETPUBKEY]; //Add header and message type
      msg("Checking to see if this key is assigned to an OnlyKey Slot " + custom_keyid);
      var empty = new Array(50).fill(0);
      Array.prototype.push.apply(message, custom_keyid);
      Array.prototype.push.apply(message, empty);
      while (message.length < 64) message.push(0);
      var encryptedkeyHandle = await aesgcm_encrypt(message);
      var b64keyhandle = bytes2b64(encryptedkeyHandle);
  } else { //Get Response From OKSIGN or OKDECRYPT
      var message = new Array(64).fill(255);
      message[4] = OKGETRESPONSE;
      while (message.length < 64) message.push(0);
      counter++;
      var encryptedkeyHandle = await aesgcm_encrypt(message);
      var b64keyhandle = bytes2b64(encryptedkeyHandle);
  }
  var challenge = mkchallenge();
  var req = { "challenge": challenge, "keyHandle": b64keyhandle,
               "appId": appId, "version": version };
  u2f.sign(appId, challenge, [req], async function(response) {
    var result = await custom_auth_response(response);
    var data = await Promise;
    if (result == 2) {
        msg("Polling succeeded but no data was received");
        data = 2;
    } else if (result <= 5) {
      data = 5;
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
        data = 0;
      } else {
        msg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
        headermsg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
      }
      data = 0;
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
      data = pubkey;
    } else if (type == 3) {
      if (result) {
        if (result.length == 64) {
          var sessKey = result.slice(0, 35);
          var entropy = result.slice(36, 64);
          msg("HW generated entropy" + entropy);
        } else {
          var sessKey = result.slice(0, result.length);
        }
        msg("Session Key " + sessKey);
        data = sessKey;
      } else {
        msg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
        headermsg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
      }
    } else if (type == 4) {
      if (result) {
        var oksignature = result.slice(0, result.length); //4+32+2+32
        msg("Signed by OnlyKey " + oksignature);
        data = oksignature;
      } else {
        msg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
        headermsg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
      }
    }

    if (typeof cb === 'function') cb(null, data);
  }, 3);
}


//Function to get see if OnlyKey responds via U2F auth message Keyhandle
async function auth_ping() {
  await wait(1000);
  console.info("Sending Ping Request to OnlyKey");
  if (_status === 'done_code') return;
  var message = [255, 255, 255, 255]; //Add header and message type
  var ciphertext = new Uint8Array(60).fill(0);
  ciphertext[0] = OKPING;
  Array.prototype.push.apply(message, ciphertext);
  var challenge = mkchallenge();
  while (message.length < 64) message.push(0);
  var encryptedkeyHandle = await aesgcm_encrypt(message);
  var b64keyhandle = bytes2b64(encryptedkeyHandle);
  var req = { "challenge": challenge, "keyHandle": b64keyhandle,
               "appId": appId, "version": version };
  u2f.sign(appId, challenge, [req], async function(response) {
    var result = await custom_auth_response(response);
    if (_status === 'done_code') {
      console.info("Ping Timed Out");
    } else console.info("Ping Successful");
  }, 2.5);
}

//Function to send ciphertext to decrypt on OnlyKey via U2F auth message Keyhandle
async function auth_decrypt(params = {}, cb) { //OnlyKey decrypt request to keyHandle
  await init();
  await wait(2000);
  if (sharedsec === 'undefined'){
    button.textContent = "Insert OnlyKey and reload page";
    return;
  }
  params = {
    msgType: params.msgType || OKDECRYPT,
    keySlot: params.keySlot || 1,
    poll_type: params.poll_type || 3,
    ct: params.ct
  };

  cb = cb || noop;
  if (params.ct.length == 396) {
    params.poll_delay = 4; //6 Second delay for RSA 3072
  } else if (params.ct.length == 524) {
    params.poll_delay = 7; //9 Second delay for RSA 4096
  }
  var padded_ct = params.ct.slice(12, params.ct.length);
  var keyid = params.ct.slice(1, 8);
  var pin_hash = sha256(padded_ct);
  msg("Padded CT Packet bytes " + Array.from(padded_ct));
  msg("Key ID bytes " + Array.from(keyid));
  pin  = [ get_pin(pin_hash[0]), get_pin(pin_hash[15]), get_pin(pin_hash[31]) ];
  msg("Generated PIN" + pin);
  params.ct = typeof padded_ct === 'string' ? padded_ct.match(/.{2}/g) : padded_ct;
  return u2fSignBuffer(params, cb);
}

//Function to send hash to sign on OnlyKey via U2F auth message Keyhandle
async function auth_sign(params = {}, cb) { //OnlyKey sign request to keyHandle
  await init();
  await wait(2000);
  if (sharedsec === 'undefined'){
    button.textContent = "Insert OnlyKey and reload page";
    return;
  }
  params = {
    msgType: params.msgType || OKSIGN,
    keySlot: params.keySlot || 2,
    poll_type: params.poll_type || 4,
    poll_delay: params.poll_delay,
    ct: params.ct
  };

  var pin_hash = sha256(params.ct);
  cb = cb || noop;
  msg("Signature Packet bytes " + Array.from(params.ct));
  pin = [ get_pin(pin_hash[0]), get_pin(pin_hash[15]), get_pin(pin_hash[31]) ];
  msg("Generated PIN" + pin);
  params.ct = typeof params.ct === 'string' ? params.ct.match(/.{2}/g) : params.ct;
  return u2fSignBuffer(params, cb);
}

//Function to process U2F registration response
function process_enroll_response(response) {
  var err = response['errorCode'];
  if (err) {
    msg("Registration failed with error code " + err);
    console.info(errMes);
    return false;
  }
  var clientData_b64 = response['clientData'];
  var regData_b64 = response['registrationData'];
  var clientData_str = u2f_unb64(clientData_b64);
  var clientData = JSON.parse(clientData_str);
  var origin = clientData['origin'];
  if (origin != appId) {
    msg("Registration failed.  AppId was " + origin + ", should be " + appId);
    return false;
  }
  var v = string2bytes(u2f_unb64(regData_b64));
  var u2f_pk = v.slice(1, 66);                // PK = Public Key
  var kh_bytes = v.slice(67, 67 + v[66]);     // KH = Key Handle
  var kh_b64 = bytes2b64(kh_bytes);
  var cert_der = v.slice(67 + v[66]);
  var cert_asn1 = ASN1.decode(cert_der);
  var cert_pk_asn1 = cert_asn1.sub[0].sub[6].sub[1];
  var cert_pk_bytes = asn1bytes(cert_pk_asn1);
  var cert_key = p256.keyFromPublic(cert_pk_bytes.slice(3), 'der');
  var sig = cert_der.slice(cert_asn1.length + cert_asn1.header);
  var l = [[0], sha256(appId), sha256(clientData_str), kh_bytes, u2f_pk];
  var v = cert_key.verify(sha256(bcat(l)), sig);
  if (v) {
    userDict[userId()] = kh_b64;
    keyHandleDict[kh_b64] = u2f_pk;
  }
  return v;
}

//Function to process U2F auth response
function process_auth_response(response) {
  console.info("Response", response);
  var err = response['errorCode'];
  if (err) {
    msg("Auth failed with error code " + err);
    console.info(errMes);
    return false;
  }
  var clientData_b64 = response['clientData'];
  var clientData_str = u2f_unb64(clientData_b64);
  var clientData_bytes = string2bytes(clientData_str);
  var clientData = JSON.parse(clientData_str);
  var origin = clientData['origin'];
  var kh = response['keyHandle'];
  var pk = keyHandleDict[kh];
  var key = p256.keyFromPublic(pk, 'der');
  var sigData = string2bytes(u2f_unb64(response['signatureData']));
  var sig = sigData.slice(5);
  var appid = document.location.origin;
  var m = bcat([sha256(appid), sigData.slice(0,5), sha256(clientData_bytes)]);
  if (!key.verify(sha256(m), sig)) return false;
  var userPresent = sigData[0];
  var counter2 = new BN(sigData.slice(1,5)).toNumber();
  msg("User present: " + userPresent);
  msg("Counter: " + counter2);
  return true;
}

//Function to parse custom U2F auth response
async function custom_auth_response(response) {
  console.info("Response", response);
  var err = response['errorCode'];
  var errMes = response['errorMessage'];
  console.info("Response code ", err);
  console.info(errMes);

    if (err) {
      if (errMes === "device status code: -7f") { //OnlyKey uses err 127 as ping reply, ack
        console.info("Ack message received");
      } else if (errMes === "device status code: -80") { //incorrect challenge code entered
          if (_status === 'pending_pin') {
          console.info("incorrect challenge code entered");
          button.textContent = "Incorrect challenge code entered";
          _setStatus('wrong_code');
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
      } else if (err == 5) { //Ping failed meaning correct challenge entered
        console.info("Timeout or challenge pin entered ");
        _setStatus('done_code');
        counter--;
        return 5;
      } else if (err) {
        console.info("Failed with error code ", err);
        //other error
        return 1;
      }
    return 2;
    }

  var sigData = string2bytes(u2f_unb64(response['signatureData']));
  console.info("Data Received: ", sigData);
  var U2Fcounter = sigData.slice(1,5);
  console.info("U2Fcounter: ", U2Fcounter);
  var parsedData = [];
  Array.prototype.push.apply(parsedData, sigData.slice(9,(sigData[8]+9)));
  Array.prototype.push.apply(parsedData, sigData.slice((sigData[8]+9+2),(sigData[(sigData[8]+9+1)]+(sigData[8]+9+2))));
  if (U2Fcounter[0] + U2Fcounter[1] + U2Fcounter[2] + U2Fcounter[3] == 0) { //unencrypted data
    console.info("Parsed Data: ", parsedData);
    return parsedData;
  }
  else { //encrypted data
    counter-=2;
    var decryptedparsedData = await aesgcm_decrypt(parsedData);
    counter++;
    console.info("Parsed Data: ", decryptedparsedData);
    if(bytes2string(parsedData.slice(0, 5)) === 'Error') {
      //Using Firefox Quantums incomplete U2F implementation... so bad
      console.info("Decode response message");
      if (decryptedparsedData[6] == 0) {
        console.info("Ack message received");
      } else if(decryptedparsedData[6] == 1) {
        console.info("incorrect challenge code entered");
        button.textContent = "Incorrect challenge code entered";
        _setStatus('wrong_code');
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
      }
      return 2;
    }
    return decryptedparsedData;
  }
}


/**
 * @param {Uint8Array} plaintext
 * @returns {Promise<String>}
 */
function aesencrypt(plaintext) {
  try {
    var iv = IntToByteArray(counter);
    while (iv.length < 12) iv.push(0);
    console.log("IV", iv);
    iv = Uint8Array.from(iv);
    var data = Uint8Array.from(plaintext);
    console.log("Data", data);
    return crypto.subtle.encrypt({ name: "AES-GCM", iv}, aeskey, data).then(ciphertext => new Uint8Array(ciphertext));
    }
  catch(err) {
    console.log("Error", err);
  }
}


/**
 * @param {Uint8Array} ciphertext
 * @returns {Promise<String>}
 */
function aesdecrypt(ciphertext) {
    //var iv_part = Uint8Array.from(toBytesInt32(counter));
    //var iv = new Uint8Array(12).fill(0);
    //iv_part.map(function(value, i){iv[i] = value});
    try {
      var iv = IntToByteArray(counter);
      while (iv.length < 12) iv.push(0);
      iv = Uint8Array.from(iv);
      console.log("IV", iv);
      var data = Uint8Array.from(ciphertext);
      console.log("Data", data);
      return crypto.subtle.decrypt({ name: "AES-GCM", iv, }, aeskey, data).then(v => new Uint8Array(v));
    }
    catch(err) {
      console.log("Error", err);
    }
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

//Function to decrypt
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

//Function to encrypt
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
    //plaintext = cipher.output;
    //console.log("Encrypted AES-GCM Hex", plaintext.toHex());
    //console.log("Encrypted AES-GCM Hex", cipher.output.getBytes());
    //console.log("Encrypted AES-GCM Hex", forge.util.hexToBytes(cipher.output.toHex()));
    var ciphertext = cipher.output;
    ciphertext = ciphertext.toHex();
    resolve(ciphertext.match(/.{2}/g).map(hexStrToDec));
  });
}

async function test_encryption () {
  appKey = nacl.box.keyPair();
  shared = appKey.secretKey;
  var keybuffer = new ArrayBuffer(32);
  key = sha256(shared);
  key.map(function(value, i){keybuffer[i] = value});
  console.info("Key", keybuffer);
  var plaintext = str2buf(buf2str(keybuffer));
  aeskey = await crypto.subtle.importKey("raw", keybuffer, "AES-GCM", false, ["encrypt", "decrypt"]);
  var encrypted = await aesencrypt(plaintext);
  console.info("encrypted", encrypted);
  var decrypted = await aesdecrypt(encrypted);
  console.info("decrypted", decrypted);
  var encrypted2 = await aesgcm_encrypt(decrypted);
  console.info("encrypted2", encrypted2);
  var decrypted2 = await aesgcm_decrypt(encrypted2);
  console.info("decrypted2", decrypted2);
}


/**
 * Encodes a utf8 string as a byte array.
 * @param {String} str
 * @returns {Uint8Array}
 */
function str2buf(str) {
  return new TextEncoder("utf-8").encode(str);
}

/**
 * Decodes a byte array as a utf8 string.
 * @param {Uint8Array} buffer
 * @returns {String}
 */
function buf2str(buffer) {
  return new TextDecoder("utf-8").decode(buffer);
}

/**
 * Decodes a string of hex to a byte array.
 * @param {String} hexStr
 * @returns {Uint8Array}
 */
function hex2buf(hexStr) {
  return new Uint8Array(hexStr.match(/.{2}/g).map(h => parseInt(h, 16)));
}

/**
 * Encodes a byte array as a string of hex.
 * @param {Uint8Array} buffer
 * @returns {String}
 */
function buf2hex(buffer) {
  return Array.prototype.slice
    .call(new Uint8Array(buffer))
    .map(x => [x >> 4, x & 15])
    .map(ab => ab.map(x => x.toString(16)).join(""))
    .join("");
}

async function u2fSignBuffer(params, mainCallback) {
    // this function should recursively call itself until all bytes are sent in chunks
    var message = [255, 255, 255, 255, params.msgType, params.keySlot]; //Add header, message type, and key to use
    var maxPacketSize = 57;
    var finalPacket = params.ct.length - maxPacketSize <= 0;
    var ctChunk = params.ct.slice(0, maxPacketSize);
    message.push(finalPacket ? ctChunk.length : 255); // 'FF'
    Array.prototype.push.apply(message, ctChunk);

    params.ct = params.ct.slice(maxPacketSize);
    var cb = finalPacket ? doPinTimer.bind(null, 20, params) : u2fSignBuffer.bind(null, params, mainCallback);

    var challenge = mkchallenge();
    while (message.length < 64) message.push(0);
    var encryptedkeyHandle = await aesgcm_encrypt(message);
    var b64keyhandle = bytes2b64(encryptedkeyHandle);
    var req = { "challenge": challenge, "keyHandle": b64keyhandle,
                 "appId": appId, "version": version };

     console.info("Handlekey bytes ", message);
     console.info("Sending Handlekey ", encryptedkeyHandle);
     console.info("Sending challenge ", challenge);

    u2f.sign(appId, challenge, [req], async function(response) {
      var result = await custom_auth_response(response);
      msg((result ? "Successfully sent" : "Error sending") + " to OnlyKey");
      if (result) {
        if (finalPacket) {
          console.info("Final packet ");
          _setStatus('pending_pin');
          cb().then(skey => {
            msg("skey " + skey);
            mainCallback(skey);
          }).catch(err => msg(err));
        } else {
          cb();
        }
      }
    }, 3);
}

window.doPinTimer = function (seconds, params) {
  const { poll_type, poll_delay } = params;

  return new Promise(function updateTimer(resolve, reject, secondsRemaining) {
    secondsRemaining = typeof secondsRemaining === 'number' ? secondsRemaining : seconds || 20;

    if (secondsRemaining <= 0) {
      const err = 'Time expired for PIN confirmation';
      return reject(err);
    }

    if (_status === 'done_code') {
      msg(`Delay ${poll_delay} seconds`);
      return msg_polling({ type: poll_type, delay: poll_delay }, (err, data) => {
        msg(`Executed msg_polling after PIN confirmation: skey = ${data}`);
        if (data<=5){
           counter--;
           data = msg_polling({ type: poll_type, delay: 0 });
        }
        resolve(data);
      });
    }

    setButtonTimerMessage(secondsRemaining);
    setTimeout(updateTimer.bind(null, resolve, reject, secondsRemaining-=3), 3000);
  });
};

function setButtonTimerMessage(seconds) {
  if (_status === 'pending_pin') {
    msg(`You have ${seconds} seconds to enter challenge code ${pin} on OnlyKey.`);
    console.info("enter challenge code", pin);
    auth_ping();
  }
}

function get_pin (byte) {
  if (byte < 6) return 1;
  else {
    return (byte % 5) + 1;
  }
}

function noop() {}
