//debugger;

const crypto = require('node-webcrypto-shim');
const atob = require("atob");
const btoa = require("btoa");

async function setTime(){

  var { FIDO2Client } = require("@vincss-public-projects/fido2-client");
  var fido2 = new FIDO2Client();
  var nacl = require("tweetnacl");
	
	var message = [];
	function pushToMessage(msg_section_name, message_section){
		var msg = {};msg[msg_section_name] = toHexString(message_section);
		console.log(msg)
		Array.prototype.push.apply(message, message_section);
	}
	

  const OKCONNECT = 228;

  pushToMessage("message",[255, 255, 255, 255, OKCONNECT]); //Add header and message type
//   var currentEpochTime = Math.round(new Date().getTime() / 1000.0).toString(16);
  var currentEpochTime = Math.round(1593590900007 / 1000.0).toString(16);
  var timePart = currentEpochTime.match(/.{2}/g).map(hexStrToDec);
  pushToMessage("timePart", timePart);

  var appKey = 
  nacl.box.keyPair();
  //{
  //  publicKey: Uint8Array.from([207, 148, 246, 173, 237, 92, 82, 218, 43, 28, 156, 222, 232, 7, 254, 45, 27, 93, 175, 139, 18, 178, 23, 86, 30, 225, 86, 44, 183, 87, 133, 95]),
  //  secretKey: Uint8Array.from([6, 213, 150, 12, 91, 72, 242, 31, 211, 36, 201, 199, 60, 108, 209, 13, 164, 35, 226, 234, 62, 11, 228, 187, 3, 197, 196, 39, 9, 46, 59, 128])
  //}

  pushToMessage("appKey.publicKey",appKey.publicKey);
  
  var env = ["N".charCodeAt(0), "W".charCodeAt(0)];
  pushToMessage("env",env);
  
  var additionalData_a = "test";

//   if (!additionalData_a) {
//     // SHA256 hash of empty buffer
//     additionalData_a = await digestArray(Uint8Array.from(new Uint8Array(32)));
//   } else {
//     // SHA256 hash of input data
//     additionalData_a = await digestArray(Uint8Array.from(additional_d));
//   }
  
  //additionalData_a = Uint8Array.from([1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]);
	//pushToMessage("additionalData_a",additionalData_a);

	//var additionalData_b = Uint8Array.from([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);  
	//pushToMessage("additionalData_b",additionalData_b);
	
  // optype
  // #define DERIVE_PUBLIC_KEY 1
  // #define DERIVE_SHARED_SECRET 2
  // keytype
  //#define KEYTYPE_NACL 0
  //#define KEYTYPE_P256R1 1 
  //#define KEYTYPE_P256K1 2 
  //#define KEYTYPE_CURVE25519 3
  // enc_resp
  //#define NO_ENCRYPT_RESP 0
  //#define ENCRYPT_RESP 1

  encryptedkeyHandle = Uint8Array.from(message); // Not encrypted as this is the initial key exchange

  var optype = 1;
  var keytype = 1;
  var enc_resp = 0;
  
  const cmd = OKCONNECT,
	  opt1 = optype, 
	  opt2 = keytype, 
	  opt3 = enc_resp, 
	  data = encryptedkeyHandle;
  

  //cmd, optype, keytype, enc_resp, encryptedkeyHandle
  //var keyhandle = encode_ctaphid_request_as_keyhandle(OKCONNECT,  2, null, null, encryptedkeyHandle)
  var keyhandle = encode_ctaphid_request_as_keyhandle(cmd, opt1, opt2, opt3, data)

  var challenge = Uint8Array.from(crypto.getRandomValues(new Uint8Array(32)));

  var timeout = 6000

  var domain = "apps.crp.to"

fido2.getAssertion({
    publicKey:{
      challenge: challenge,
      allowCredentials: [{
        id: keyhandle,
        type: 'public-key',
      }],
      timeout: timeout,
//       rpId: domain,
      userVerification: 'discouraged',
//       extensions: {
//         appid: 'https://' + domain
//       }
    }
  }, "https://apps.crp.to").catch(function(error){
    
    console.warn("ERROR CALLING:", cmd, opt1, opt2, opt3, data);
    console.warn("THE ERROR:", error);
    console.warn("NAME:", error.name);
    console.warn("MESSAGE:", error.message);
    
  }).then((assertion) => {

    if(!assertion){
      console.log("no assertion")
      return;
    }
    //console.log(assertion)
    var response = assertion.response;

    console.log("RESPONCE:",{
      clientDataJSON:toHexString(response.clientDataJSON),
      authenticatorData:toHexString(response.authenticatorData),
      signature:toHexString(response.signature)
    })

    var signature_count = (
    new DataView(toArrayBuffer(Buffer.from(response.authenticatorData.slice(33, 37))))
    ).getUint32(0, false); // get count as 32 bit BE integer


    var signature = new Uint8Array(response.signature);
    var status_code = signature[0];

    var data;

    if (signature.length > 1)
    data = signature.slice(1, signature.length);

    response = data;

    var results = {};

    console.log(ctap_error_codes[status_code])
    results.unlocked = false;    
    if (bytes2string(data.slice(0, 9)) == 'UNLOCKEDv') {
      results.unlocked = true;
    }

    results.okPub = response.slice(21, 53);
    results.sharedsec = nacl.box.before(Uint8Array.from(results.okPub), appKey.secretKey);
    results.OKversion = response[19] == 99 ? 'Color' : 'Original';
    results.FWversion = bytes2string(response.slice(8, 20));
    

    

    // Public ECC key will be an uncompressed ECC key, 65 bytes for P256, 32 bytes for NACL/CURVE25519 padded with 0s
    
    if (keytype == 0 || keytype == 3) {
      results.sharedPub = response.slice(response.length - 65, response.length - 33);
    }
    else {
      results.sharedPub = response.slice(53, response.length);
    }
    
    
    
    ONLYKEY_ECDH_P256_to_EPUB(results.sharedPub, function(epub) {
      results.epub = epub;
      console.log("results",{
          unlocked:results.unlocked,
          okPub:toHexString(results.okPub),
          sharedsec:toHexString(results.sharedsec),
          OKversion:results.OKversion,
          FWversion:results.FWversion,
          sharedPub:toHexString(results.sharedPub),
          epub:epub
        });
    })


  });
}


setTime();
function byteToHex(byte) {
  // convert the possibly signed byte (-128 to 127) to an unsigned byte (0 to 255).
  // if you know, that you only deal with unsigned bytes (Uint8Array), you can omit this line
  const unsignedByte = byte & 0xff;

  // If the number can be represented with only 4 bits (0-15), 
  // the hexadecimal representation of this number is only one char (0-9, a-f). 
  if (unsignedByte < 16) {
    return unsignedByte.toString(16).toUpperCase();
  } else {
    return unsignedByte.toString(16).toUpperCase();
  }
}

// bytes is an typed array (Int8Array or Uint8Array)
function toHexString(bytes) {
  // Since the .map() method is not available for typed arrays, 
  // we will convert the typed array to an array using Array.from().
  return Array.from(bytes)
    .map(byte => byteToHex(byte))
    .join(' ');
}


async function sha256(s) {
    var hash = await crypto.subtle.digest({
        name: 'SHA-256'
    }, new window.TextEncoder().encode(s));
    hash = buf2hex(hash);
    hash = Array.from(hash.match(/.{2}/g).map(hexStrToDec));
    return hash;
}

async function digestArray(buff) {
    const msgUint8 = buff;
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    return hashArray;
}

function hexStrToDec(hexStr) {
  return ~~(new Number('0x' + hexStr).toString(10));
};

function bytes2string(bytes) {
  var ret = Array.from(bytes).map(function chr(c) {
    return String.fromCharCode(c);
  }).join('');
  return ret;
};

function toArrayBuffer(buf) {
  var ab = new ArrayBuffer(buf.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}

function encode_ctaphid_request_as_keyhandle(cmd, opt1, opt2, opt3, data) {
	console.log({
		cmd:toHexString([cmd]),
		opt1:toHexString([opt1]),
		opt2:toHexString([opt2]),
		opt3:toHexString([opt3]),
		data:toHexString(data)			
	})
  //var addr = 0;

  // should we check that `data` is either null or an Uint8Array?
  data = data || new Uint8Array();

  const offset = 10;

  if (offset + data.length > 255) {
    throw new Error("Max size exceeded");
  }

  // `is_extension_request` expects at least 16 bytes of data
  const data_pad = data.length < 16 ? 16 - data.length : 0; // 255-data.length-offset;
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

  console.log('FORMATTED REQUEST:('+array.length+')', toHexString(array));
  return array;
}

var ctap_error_codes = {
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


  
function u2f_unb64(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    return atob(s + '==='.slice((s.length + 3) % 4));
}

function arrayBufToBase64UrlEncode(buf) {
    var binary = '';
    var bytes = new Uint8Array(buf);
    for (var i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .replace(/\+/g, '-');
}

function arrayBufToBase64UrlDecode(ba64) {
    var binary = u2f_unb64(ba64);
    var bytes = [];
    for (var i = 0; i < binary.length; i++) {
        bytes.push(binary.charCodeAt(i));
    }

    return new Uint8Array(bytes);
}

async function ONLYKEY_ECDH_P256_to_EPUB(publicKeyRawBuffer, callback) {
    //https://stackoverflow.com/questions/56846930/how-to-convert-raw-representations-of-ecdh-key-pair-into-a-json-web-key

    // var orig_publicKeyRawBuffer = Uint8Array.from(publicKeyRawBuffer);

    //console.log("publicKeyRawBuffer  B", publicKeyRawBuffer)
    publicKeyRawBuffer = Array.from(publicKeyRawBuffer)
    publicKeyRawBuffer.unshift(publicKeyRawBuffer.pop());
    publicKeyRawBuffer = Uint8Array.from(publicKeyRawBuffer);

    //console.log("publicKeyRawBuffer  F", publicKeyRawBuffer)
    var importedPubKey = await crypto.subtle.importKey(
        'jwk', {
            kty: "EC",
            crv: "P-256",
            x: arrayBufToBase64UrlEncode(publicKeyRawBuffer.slice(1, 33)),
            y: arrayBufToBase64UrlEncode(publicKeyRawBuffer.slice(33, 66))
        }, {
            name: 'ECDH',
            namedCurve: 'P-256'
        },
        true, []
    );

    crypto.subtle.exportKey(
            "jwk", //can be "jwk" (public or private), "raw" (public only), "spki" (public only), or "pkcs8" (private only)
            importedPubKey //can be a publicKey or privateKey, as long as extractable was true
        )
        .then(function(keydata) {

            var OK_SEA_epub = keydata.x + '.' + keydata.y;

            // console.log("raw to epub", OK_SEA_epub, orig_publicKeyRawBuffer)

            if (callback)
                callback(OK_SEA_epub);

        })
        .catch(function(err) {
            console.error(err);
        });


}
