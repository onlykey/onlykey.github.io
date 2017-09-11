
var userDict = {}           // UserId -> KeyHandle
var keyHandleDict = {};     // KeyHandle -> PublicKey
var data_blob = {};
var hw_RNG = {};

var appId = window.location.origin;
var version = "U2F_V2";
var OKversion;

var p256 = new ECC('p256');
var sha256 = function(s) { return p256.hash().update(s).digest(); };
var BN = p256.n.constructor;  // BN = BigNumber

var _status;
var pin;
var poll_type, poll_delay;
const button = document.getElementById('onlykey_start');

var custom_keyid;

function init() {
  auth_timeset();
  updateStatusFromSelection();

  document.action.select_one.forEach(el => el.addEventListener('change', updateStatusFromSelection.bind(null, false)));
}

function updateStatusFromSelection(skipBtn) {
  const val = document.action.select_one.value;
  _status = val;
  if (!skipBtn) button.textContent = val;
}

//var ECDH = require('elliptic').ec;
//var ec = new ECDH('curve25519');

function id(s) { return document.getElementById(s); }

function msg(s) { id('messages').innerHTML += "<br>" + s; }

function headermsg(s) { id('header_messages').innerHTML += "<br>" + s; }

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

//Generate a polling request
function mk_polling() {
  var s = [];
  for(i=0;i<32;i++) s[i] = String.fromCharCode(0);
  return u2f_b64(s.join());
}

//Function to create new key to be sent via U2F auth message challenge
function mk_key() {
  var ecdh = new elliptic.ec(curve25519);
  var Key = ec.genKeyPair();
  var pubKey = Key.getPublic('hex');
  //pubKey.toString(16);
  //ec.keyFromPublic(publicKey).getPublic()
  msg("Creating Curve25519 Public" + pubKey);
  return u2f_b64(pubKey.join());
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

//Poll OnlyKey for response to previous request
function enroll_poll_response() {
  msg("Enrolling user " + userId());
  var challenge = mk_polling();
  var req = { "challenge": challenge, "appId": appId, "version": version};
  u2f.register(appId, [req], [], function(response) {
    var result = process_poll_response(response);
    msg("Poll Response" + (result ? "succeeded" : "failed"));
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
    var result = verify_auth_response(response);
    msg("User " + userId() + " auth " + (result ? "succeeded" : "failed"));
  });
    msg("Finsihed");
}

//Function to simulate U2F registration so we can send U2F auth
function simulate_enroll() {
  var u2f_pk = new Uint8Array(64).fill(0);
  var kh_bytes = new Uint8Array(64).fill(0);
  var kh_b64 = bytes2b64(kh_bytes);
  userDict[userId()] = kh_b64;
  keyHandleDict[kh_b64] = u2f_pk;
  //Simulate Registration
}


//Function to set time on OnlyKey via U2F enroll message Keyhandle, returned are OnlyKey version and public key for ECDH
function auth_timeset() { //OnlyKey settime to keyHandle
  simulate_enroll();
  //msg("Sending Set Time to OnlyKey");
  var message = [255, 255, 255, 255, 228]; //Same header and message type used in App
  var currentEpochTime = Math.round(new Date().getTime() / 1000.0).toString(16);
  msg("Setting current time on OnlyKey to " + new Date());
  var timeParts = currentEpochTime.match(/.{2}/g).map(hexStrToDec);
  var empty = new Array(55).fill(0);
  Array.prototype.push.apply(message, timeParts);
  Array.prototype.push.apply(message, empty);
  var keyHandle = bytes2b64(message);
  //msg("Sending Handlekey " + keyHandle);
  var challenge = mkchallenge();
  var req = { "challenge": challenge, "keyHandle": keyHandle,
               "appId": appId, "version": version };
  u2f.sign(appId, challenge, [req], function(response) {
    var result = verify_auth_response(response);
    msg("Your OnlyKey is " + (result ? "Connected" : "Not Connected, Connect Unlocked OnlyKey and Refresh Page"));
    headermsg("Your OnlyKey is " + (result ? "Connected" : "Not Connected, Connect Unlocked OnlyKey and Refresh Page"));
    return result && enroll_polling({ type: 1, delay: .5 });
  });
}

function enroll_polling(params = {}, cb) {
  const delay = params.delay || 0; // no delay by default
  const type = params.type || 1; // default type to 1

  setTimeout(() => {
    msg("Requesting response from OnlyKey");
    var challenge = mk_polling();
    var req = { "challenge": challenge, "appId": appId, "version": version};
    u2f.register(appId, [req], [], function(response) {
      const result = process_custom_response(response);
      let data;
      msg("Polling " + (result ? "succeeded" : "failed"));
      if (result == 3) {
          msg("Polling succeeded but no data was received");
      } else if (result) {
        if (type == 1) {
            msg("ECDH Public Key from OnlyKey " + data_blob.slice(0, 32));
            OKversion = data_blob[51] == 99 ? 'Color' : 'Original';
            var FWversion = bytes2string(data_blob.slice(40, 52));
            msg("OnlyKey " + OKversion + " " + FWversion);
            headermsg("OnlyKey " + OKversion + " " + FWversion);
        } else if (type == 2) {
            var pubkey = data_blob.slice(0, ((data_blob.length)-0x46)); //4+32+2+32
            msg("Public Key " + pubkey);
            data = pubkey;
        } else if (type == 3) {
            var sessKey = data_blob.slice(0, ((data_blob.length)-0x46)); //4+32+2+32
            msg("Session Key " + sessKey);
            data = sessKey;
        } else if (type == 4) {
            var oksignature = data_blob.slice(0, ((data_blob.length)-0x46)); //4+32+2+32
            msg("Signed by OnlyKey " + oksignature);
            data = oksignature;
        }
      }

      if (typeof cb === 'function') cb(null, data);
    });
  }, delay * 1000);
}

//Function to process custom U2F registration response
function process_custom_response(response) {
  var err = response['errorCode'];
  if (err==1) { //OnlyKey uses err 1 from register as no message ready to send
    return 3;
  }
  if (err) {
    msg("Failed with error code " + err);
    return 0;
  }
  var clientData_b64 = response['clientData'];
  var regData_b64 = response['registrationData'];
  var v = string2bytes(u2f_unb64(regData_b64));
  hw_RNG = v.slice(67, 67 + v[66]);     // Hardware Generated Random number stored in KH = Key Handle
  msg("Hardware Generated Random Number " + hw_RNG);
  data_blob = v.slice(67 + v[66]);
  //msg("Data Received " + data_blob);  //Data encoded in cert field
  return 1;
}

//Function to get public key on OnlyKey via U2F auth message Keyhandle
function auth_getpub() { //OnlyKey get public key to keyHandle
  simulate_enroll();
  var message = [255, 255, 255, 255, 236, slotId()]; //Add header and message type
  msg("Sending Get Public Request to OnlyKey Slot " + slotId());
  var ciphertext = new Uint8Array(58).fill(0);
  Array.prototype.push.apply(message, ciphertext);
  msg("Handlekey bytes " + message);
  var keyHandle = bytes2b64(message);
  msg("Sending Handlekey " + keyHandle);
  var challenge = mkchallenge();
  var req = { "challenge": challenge, "keyHandle": keyHandle,
               "appId": appId, "version": version };
  u2f.sign(appId, challenge, [req], function(response) {
    var result = verify_auth_response(response);
    msg("Get Public Request Sent " + (result ? "Successfully" : "Error"));
    return result && enroll_polling({ type: 2, delay: 1 });
  });
}

//Function to send ciphertext to decrypt on OnlyKey via U2F auth message Keyhandle
function auth_decrypt(ct, cb) { //OnlyKey decrypt request to keyHandle
  //simulate_enroll();
  cb = cb || noop;
  if (ct.length == 396) {
    poll_delay = 6; //6 Second delay for RSA 3072
  } else if (ct.length == 524) {
    poll_delay = 9; //9 Second delay for RSA 4096
  }
  var padded_ct = ct.slice(12, ct.length);
  var keyid = ct.slice(1, 8);
  var pin_hash = sha256(padded_ct);
  msg("Padded CT Packet bytes " + Array.from(padded_ct));
  msg("Key ID bytes " + Array.from(keyid));
  pin  = [ get_pin(pin_hash[0]), get_pin(pin_hash[15]), get_pin(pin_hash[31]) ];
  msg("Generated PIN" + pin);
  return u2fSignBuffer(typeof padded_ct === 'string' ? padded_ct.match(/.{2}/g) : padded_ct, cb);
}

//Function to send hash to sign on OnlyKey via U2F auth message Keyhandle
function auth_sign(ct, cb) { //OnlyKey sign request to keyHandle
  //simulate_enroll();
  var pin_hash = sha256(ct);
  cb = cb || noop;
  msg("Signature Packet bytes " + Array.from(ct));
  pin  = [ get_pin(pin_hash[0]), get_pin(pin_hash[15]), get_pin(pin_hash[31]) ];
  msg("Generated PIN" + pin);
  return u2fSignBuffer(typeof ct === 'string' ? ct.match(/.{2}/g) : ct, cb);
}

//Function to process U2F registration response
function process_enroll_response(response) {
  var err = response['errorCode'];
  if (err==1) { //OnlyKey uses err 1 from register as no message ready to send
    return true;
  }
  if (err) {
    msg("Registration failed with error code " + err);
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
  msg("Handlekey " + kh_bytes);
  var kh_b64 = bytes2b64(kh_bytes);
  msg("Handlekey b64 " + kh_b64);
  var cert_der = v.slice(67 + v[66], v[67 + v[66]]);
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
function verify_auth_response(response) {
  var err = response['errorCode'];
  if (err==1) { //OnlyKey uses err 1 from auth as ACK
    return true;
  } else if (err) {
    msg("Auth failed with error code " + err);
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
  var counter = new BN(sigData.slice(1,5)).toNumber();
  msg("User present: " + userPresent);
  msg("Counter: " + counter);
  return true;
}

function u2fSignBuffer(cipherText, mainCallback) {
    // this function should recursively call itself until all bytes are sent in chunks
    var message = [255, 255, 255, 255, type = document.getElementById('onlykey_start').value == 'Encrypt and Sign' ? 237 : 240, slotId()]; //Add header, message type, and key to use
    var maxPacketSize = 57;
    var finalPacket = cipherText.length - maxPacketSize <= 0;
    var ctChunk = cipherText.slice(0, maxPacketSize);
    message.push(finalPacket ? ctChunk.length : 255); // 'FF'
    Array.prototype.push.apply(message, ctChunk);

    var cb = finalPacket ? doPinTimer.bind(null, 20) : u2fSignBuffer.bind(null, cipherText.slice(maxPacketSize), mainCallback);

    var keyHandle = bytes2b64(message);
    var challenge = mkchallenge();
    var req = { "challenge": challenge, "keyHandle": keyHandle,
                 "appId": appId, "version": version };

    msg("Handlekey bytes " + message);
    msg("Sending Handlekey " + keyHandle);
    msg("Sending challenge " + challenge);

    u2f.sign(appId, challenge, [req], function(response) {
      var result = verify_auth_response(response);
      msg((result ? "Successfully sent" : "Error sending") + " to OnlyKey");
      if (result) {
        if (finalPacket) {
          _status = 'pending_pin';
          cb().then(skey => {
            msg("skey " + skey);
            mainCallback(skey);
          }).catch(err => msg(err));
        } else {
          cb();
        }
      }
    });
}

function get_pin (byte) {
  if (byte < 6) return 1;
  else {
    return (byte % 5) + 1;
  }
}

function noop() {}
