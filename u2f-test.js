
var userDict = {}           // UserId -> KeyHandle
var keyHandleDict = {};     // KeyHandle -> PublicKey

var appId = window.location.origin;
var version = "U2F_V2";

var p256 = new ECC('p256');
var sha256 = function(s) { return p256.hash().update(s).digest(); };
var BN = p256.n.constructor;  // BN = BigNumber

function id(s) { return document.getElementById(s); }

function msg(s) { id('messages').innerHTML += "<br>" + s; }

function userId() { return id('userid').value; }

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

function mkchallenge() {
  var s = [];
  for(i=0;i<32;i++) s[i] = String.fromCharCode(Math.floor(Math.random()*256));
  return u2f_b64(s.join());
}

function enroll_local() {
  msg("Enrolling user " + userId());
  var challenge = mkchallenge();
  var req = { "challenge": challenge, "appId": appId, "version": version};
  u2f.register(appId, [req], [], function(response) {
    var result = process_enroll_response(response);
    msg("User " + userId() + " enroll " + (result ? "succeeded" : "failed"));
  });
}

function auth_local() {
  msg("Authorizing user " + userId());
  keyHandle = userDict[userId()];
  if (!keyHandle) {
    msg("User " + userId() + " not enrolled");
    return;
  }
  var challenge = mkchallenge();
  var req = { "challenge": challenge, "keyHandle": keyHandle,
               "appId": appId, "version": version };
  u2f.sign(appId, challenge, [req], function(response) {
    var result = verify_auth_response(response);
    msg("User " + userId() + " auth " + (result ? "succeeded" : "failed"));
  });
}

function process_enroll_response(response) {
  var err = response['errorCode'];
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

function verify_auth_response(response) {
  var err = response['errorCode'];
  if (err) {
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
