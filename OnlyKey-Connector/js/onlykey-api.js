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
var appKey = curve25519.genKeyPair();
var appPub = appKey.getPublic();
var okPub;
var shared;

var _status;
var pin;
var poll_type, poll_delay;
var custom_keyid;
var msgType;
var keySlot;

function init() {
  //enroll_polling({ type: 1, delay: 0 }); //Set time on OnlyKey, get firmware version, get ecc public
}

function id(s) { return document.getElementById(s); }

function msg(s) { id('messages').innerHTML += "<br>" + s; }

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
  }, 3);
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

//Function to send and retrive custom U2F messages
function enroll_polling(params = {}, cb) {
  const delay = params.delay || 0; // no delay by default
  const type = params.type || 1; // default type to 1

  setTimeout(() => {
    msg("Requesting response from OnlyKey");
    if (type == 1) { //OKSETTIME
      var message = [255, 255, 255, 255, 228]; //Same header and message type used in App
      var currentEpochTime = Math.round(new Date().getTime() / 1000.0).toString(16);
      msg("Setting current time on OnlyKey to " + new Date());
      var timePart = currentEpochTime.match(/.{2}/g).map(hexStrToDec);
      var empty = new Array(23).fill(0);
      Array.prototype.push.apply(message, timePart);
      var appPubPart = appPub.encode('hex').match(/.{2}/g).map(hexStrToDec);
      msg("Application ECDH Public Key: " + appPubPart);
      Array.prototype.push.apply(message, appPubPart);
      Array.prototype.push.apply(message, empty);
      var keyHandle = bytes2b64(message);
    } else if (type == 2) { //OKGETPUB
        var message = [255, 255, 255, 255, 236]; //Add header and message type
        msg("Checking to see if this key is assigned to an OnlyKey Slot " + custom_keyid);
        var empty = new Array(50).fill(0);
        Array.prototype.push.apply(message, custom_keyid);
        Array.prototype.push.apply(message, empty);
        var keyHandle = bytes2b64(message);
    } else { //OKSIGN or OKDECRYPT
        var keyHandle = bytes2b64(new Array(64).fill(255));
    }
    var challenge = mkchallenge();
    var req = { "challenge": challenge, "keyHandle": keyHandle,
                 "appId": appId, "version": version };
    u2f.sign(appId, challenge, [req], function(response) {
      var result = custom_auth_response(response);
      let data;
      if (result == 3) {
          msg("Polling succeeded but no data was received");
          return;
      }
      if (type == 1) {
        if (result) {
          okPub = result.slice(0, 32);
          msg("OnlyKey ECDH Public Key: " + okPub );
          okPub = curve25519.keyFromPublic(result.slice(0, 32), 'der');
          OKversion = result[51] == 99 ? 'Color' : 'Original';
          var FWversion = bytes2string(result.slice(40, 52));
          msg("OnlyKey " + OKversion + " " + FWversion);
          headermsg("OnlyKey " + OKversion + " Connected\n" + FWversion);
          hw_RNG.entropy = result.slice(53, result.length);
          msg("HW generated entropy: " + hw_RNG.entropy);
          shared = appKey.derive(okPub.getPublic());
          msg("ECDH shared: " + shared);
        } else {
          msg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
          headermsg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
        }
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
      } else if (type == 3) {
        if (result) {
          var sessKey = result.slice(0, result.length);
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
  }, delay * 1000);
}

//Function to get see if OnlyKey responds via U2F auth message Keyhandle
function auth_ping() {
  var message = [255, 255, 255, 255]; //Add header and message type
  msg("Sending Ping Request to OnlyKey");
  var ciphertext = new Uint8Array(60).fill(0);
  Array.prototype.push.apply(message, ciphertext);
  msg("Handlekey bytes " + message);
  var keyHandle = bytes2b64(message);
  msg("Sending Handlekey " + keyHandle);
  var challenge = mkchallenge();
  var req = { "challenge": challenge, "keyHandle": keyHandle,
               "appId": appId, "version": version };
  var result;
    u2f.sign(appId, challenge, [req], function(response) {
      result = process_ping_response(response);
      msg("Ping " + (result ? "Successful" : "Failed"));
      if (!result) {
        console.info("Ping Failed");
      }
      _status = result ? _status : 'done_pin';
    }, 2.5);
}

//Function to send ciphertext to decrypt on OnlyKey via U2F auth message Keyhandle
function auth_decrypt(params = {}, cb) { //OnlyKey decrypt request to keyHandle
  params = {
    msgType: params.msgType || 240,
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
function auth_sign(params = {}, cb) { //OnlyKey sign request to keyHandle
  params = {
    msgType: params.msgType || 237,
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

function process_ping_response(response) {
  console.info("Response", response);
  var err = response['errorCode'];
  console.info("Response code ", err);
  if (err==1) { //OnlyKey uses err 1 from auth as ACK
    return true;
  } else if (err) {
    msg("Auth failed with error code " + err);
    return false;
  }
}

//Function to process U2F auth response
function process_auth_response(response) {
  var err = response['errorCode'];
  console.info("Response code ", err);
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

//Function to parse custom U2F auth response
function custom_auth_response(response) {
  var err = response['errorCode'];
  console.info("Response code ", err);
  if (err==1) { //OnlyKey uses err 1 as no message ready to send
    return 3;
  }
  if (err) {
    msg("Failed with error code " + err);
    return 0;
  }
  var clientData_b64 = response['clientData'];
  var clientData_str = u2f_unb64(clientData_b64);
  var clientData_bytes = string2bytes(clientData_str);
  var clientData = JSON.parse(clientData_str);
  var origin = clientData['origin'];
  msg("Origin: " + origin);
  var kh = response['keyHandle'];
  msg("Key Handle: " + kh);
  var sigData = string2bytes(u2f_unb64(response['signatureData']));
  msg("Data Received: " + sigData);
  var parsedData = [];
  Array.prototype.push.apply(parsedData, sigData.slice(8,(sigData[7]+8)));
  Array.prototype.push.apply(parsedData, sigData.slice((sigData[7]+8+2),(sigData[(sigData[7]+8+1)]+(sigData[7]+8+2))));
  msg("Parsed Data: " + parsedData);
  return parsedData;
}

function u2fSignBuffer(params, mainCallback) {
    // this function should recursively call itself until all bytes are sent in chunks
    var message = [255, 255, 255, 255, params.msgType, params.keySlot]; //Add header, message type, and key to use
    var maxPacketSize = 57;
    var finalPacket = params.ct.length - maxPacketSize <= 0;
    var ctChunk = params.ct.slice(0, maxPacketSize);
    message.push(finalPacket ? ctChunk.length : 255); // 'FF'
    Array.prototype.push.apply(message, ctChunk);

    params.ct = params.ct.slice(maxPacketSize);
    var cb = finalPacket ? doPinTimer.bind(null, 20, params) : u2fSignBuffer.bind(null, params, mainCallback);

    var keyHandle = bytes2b64(message);
    var challenge = mkchallenge();
    var req = { "challenge": challenge, "keyHandle": keyHandle,
                 "appId": appId, "version": version };

    msg("Handlekey bytes " + message);
    msg("Sending Handlekey " + keyHandle);
    msg("Sending challenge " + challenge);

    u2f.sign(appId, challenge, [req], function(response) {
      var result = process_auth_response(response);
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

    if (_status === 'done_pin') {
      msg(`Delay ${poll_delay} seconds`);
      return enroll_polling({ type: poll_type, delay: poll_delay }, (err, data) => {
        msg(`Executed enroll_polling after PIN confirmation: skey = ${data}`);
        resolve(data);
      });
    }

    setButtonTimerMessage(secondsRemaining);
    setTimeout(updateTimer.bind(null, resolve, reject, secondsRemaining-=3), 3000);
  });
};

function setButtonTimerMessage(seconds) {
  if (_status !== 'done_pin') {
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
