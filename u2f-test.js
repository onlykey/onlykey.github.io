
var userDict = {}           // UserId -> KeyHandle
var keyHandleDict = {};     // KeyHandle -> PublicKey

var appId = window.location.origin;
var version = "U2F_V2";

var p256 = new ECC('p256');
var sha256 = function(s) { return p256.hash().update(s).digest(); };
var BN = p256.n.constructor;  // BN = BigNumber

var ec = new EdDSA('ed25519');

function id(s) { return document.getElementById(s); }

function msg(s) { id('messages').innerHTML += "<br>" + s; }

function userId() {
    var el = id('userid');
    return el && el.value || 'u2ftest';
}

function slotId() { return id('slotid').value; }

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
  for(i=0;i<32;i++) s[i] = String.fromCharCode(Math.floor(Math.random()*256));
  s[0] = 0xFF;
  s[1] = 0xFF;
  s[2] = 0xFF;
  s[3] = 0xFF;
  return u2f_b64(s.join());
}

//Function to create new key to be sent via U2F auth message challenge
function mk_key() {
  var s = [];
  var Key = ec.genKeyPair();
  var pubKey = ec.keyFromPublic(toHex(pair.pubBytes()));
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

//Function to set time on OnlyKey via U2F auth message Keyhandle
function auth_timeset() { //OnlyKey settime to keyHandle
  simulate_enroll()
  var message = [255, 255, 255, 255, 228]; //Add header and message type

  //var epochTime = [89, 8, 219, 7]; //5908DB07
  var currentEpochTime = Math.round(new Date().getTime() / 1000.0).toString(16);
  msg("Setting current epoch time on OnlyKey to " + currentEpochTime);

  var timeParts = currentEpochTime.match(/.{2}/g).map(hexStrToDec);

  var empty = new Uint8Array(55).fill(0);

  Array.prototype.push.apply(message, timeParts);

  Array.prototype.push.apply(message, empty);

  msg("Handlekey bytes " + message);

  keyHandle = bytes2b64(message);

  msg("Sending Handlekey " + keyHandle);
  var challenge = mkchallenge();
  msg("Sending challenge " + challenge);
  var req = { "challenge": challenge, "keyHandle": keyHandle,
               "appId": appId, "version": version };
  u2f.sign(appId, challenge, [req], function(response) {
    var result = verify_auth_response(response);
    msg("Set Time " + (result ? "succeeded" : "failed"));
  });
}

//Function to get public key on OnlyKey via U2F auth message Keyhandle
function auth_getpub() { //OnlyKey get public key to keyHandle
  simulate_enroll()
  var message = [255, 255, 255, 255, 236, slotId()]; //Add header and message type

  var ciphertext = new Uint8Array(58).fill(0);

  Array.prototype.push.apply(message, ciphertext);

  msg("Handlekey bytes " + message);

  keyHandle = bytes2b64(message);

  msg("Sending Handlekey " + keyHandle);
  var challenge = mk_key();
  msg("Sending challenge " + challenge);
  var req = { "challenge": challenge, "keyHandle": keyHandle,
               "appId": appId, "version": version };
  u2f.sign(appId, challenge, [req], function(response) {
    var result = verify_auth_response(response);
    msg("Get Public Key " + (result ? "succeeded" : "failed"));
  });
  //setTimeout(function(){
  //enroll_poll_response() //Poll for response
  //}, 1000);

}

//Function to send ciphertext to decrypt on OnlyKey via U2F auth message Keyhandle
function auth_decrypt_request() { //OnlyKey decrypt request to keyHandle
  simulate_enroll()
  var message = [255, 255, 255, 255, 240, slotId()]; //Add header, message type, and key to use

  var ciphertext = new Uint8Array(58).fill(0);
  ciphertext[0] = 57;
  Array.prototype.push.apply(message, ciphertext);

  msg("Handlekey bytes " + message);

  keyHandle = bytes2b64(message);

  msg("Sending Handlekey " + keyHandle);
  var challenge = mkchallenge();
  msg("Sending challenge " + challenge);
  var req = { "challenge": challenge, "keyHandle": keyHandle,
               "appId": appId, "version": version };
  u2f.sign(appId, challenge, [req], function(response) {
    var result = verify_auth_response(response);
    msg("Decrypt Request Sent" + (result ? "Successfully" : "Error"));
  });
}

//Function to send hash to be signed on OnlyKey via U2F auth message Keyhandle
function auth_sign_request() { //OnlyKey sign request to keyHandle
  simulate_enroll()
  var message = [255, 255, 255, 255, 237, slotId()]; //Add header, message type, and key to use

  var ciphertext = new Uint8Array(58).fill(0);
  ciphertext[0] = 57;
  Array.prototype.push.apply(message, ciphertext);

  msg("Handlekey bytes " + message);

  keyHandle = bytes2b64(message);

  msg("Sending Handlekey " + keyHandle);
  var challenge = mkchallenge();
  msg("Sending challenge " + challenge);
  var req = { "challenge": challenge, "keyHandle": keyHandle,
               "appId": appId, "version": version };
  u2f.sign(appId, challenge, [req], function(response) {
    var result = verify_auth_response(response);
    msg("Sign Request Sent" + (result ? "Successfully" : "Error"));
  });
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

//Function to process U2F registration response
function process_poll_response(response) {
  var err = response['errorCode'];]
  if (err==1) { //OnlyKey uses err 1 from register as no message ready to send
    return true;
  }
  if (err) {
    msg("Polling failed with error code " + err);
    return false;
  }
  var clientData_b64 = response['clientData'];
  var regData_b64 = response['registrationData'];
  var clientData_str = u2f_unb64(clientData_b64);
  var clientData = JSON.parse(clientData_str);
  var origin = clientData['origin'];
  var v = string2bytes(u2f_unb64(regData_b64));
  var u2f_pk = v.slice(1, 66);                // PK = Public Key
  var kh_bytes = v.slice(67, 67 + v[66]);     // KH = Key Handle
  msg("Handlekey " + kh_bytes);
  var kh_b64 = bytes2b64(kh_bytes);
  msg("Handlekey b64 " + kh_b64);
  var cert_der = v.slice(67 + v[66]);
  msg("Data Received " + cert_der);  //Data encoded in cert field
  return true;
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
