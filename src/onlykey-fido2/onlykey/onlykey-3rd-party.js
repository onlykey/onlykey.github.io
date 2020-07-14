module.exports = function(imports, onlykeyApi){
/* global TextEncoder */
// var $ = require("jquery");
var nacl = require("./nacl.min.js");
var EventEmitter = require("events").EventEmitter;



  var {
    // wait,
    // sha256,
    hexStrToDec,
    bytes2string,
    // noop,
    getstringlen,
    // mkchallenge,
    // bytes2b64,
    getOS,
    ctap_error_codes,
    // getAllUrlParams,
    // aesgcm_decrypt,
    // aesgcm_encrypt
  } = require("./onlykey.extra.js")(imports);
  
// var nacl = require("nacl");
// var forge = require("forge");
// window.nacl = nacl;
// window.forge = forge;

var crypto = imports.window.crypto;

var log = htmlLog.bind(console);

var debug_log = console.warn.bind(console);

function htmlLog(text) {
    //log.apply({}, arguments);
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }
    // $("#console_output").append($("<span/>").text(args.join(" ")));
    // $("#console_output").append($("<br/>"));
    return console.log.bind({}, args.join(" "));
};

function _setStatus(newStatus) {
    window._status = newStatus;
    // $("#onlykey_status").text(newStatus);
}

var sha256 = async function(s) {
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

function buf2hex(buffer) {
    // buffer is an ArrayBuffer
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}
/*
const ctap_error_codes = {
    0x00: 'CTAP1_SUCCESS',
    0x01: 'CTAP1_ERR_INVALID_COMMAND',
    0x02: 'CTAP1_ERR_INVALID_PARAMETER',
    0x03: 'CTAP1_ERR_INVALID_LENGTH',
    0x04: 'CTAP1_ERR_INVALID_SEQ',
    0x05: 'CTAP1_ERR_TIMEOUT',
    0x06: 'CTAP1_ERR_CHANNEL_BUSY',
    0x0A: 'CTAP1_ERR_LOCK_REQUIRED',
    0x0B: 'CTAP1_ERR_INVALID_CHANNEL',

    0x10: 'CTAP2_ERR_CBOR_PARSING',
    0x11: 'CTAP2_ERR_CBOR_UNEXPECTED_TYPE',
    0x12: 'CTAP2_ERR_INVALID_CBOR',
    0x13: 'CTAP2_ERR_INVALID_CBOR_TYPE',
    0x14: 'CTAP2_ERR_MISSING_PARAMETER',
    0x15: 'CTAP2_ERR_LIMIT_EXCEEDED',
    0x16: 'CTAP2_ERR_UNSUPPORTED_EXTENSION',
    0x17: 'CTAP2_ERR_TOO_MANY_ELEMENTS',
    0x18: 'CTAP2_ERR_EXTENSION_NOT_SUPPORTED',
    0x19: 'CTAP2_ERR_CREDENTIAL_EXCLUDED',
    0x20: 'CTAP2_ERR_CREDENTIAL_NOT_VALID',
    0x21: 'CTAP2_ERR_PROCESSING',
    0x22: 'CTAP2_ERR_INVALID_CREDENTIAL',
    0x23: 'CTAP2_ERR_USER_ACTION_PENDING',
    0x24: 'CTAP2_ERR_OPERATION_PENDING',
    0x25: 'CTAP2_ERR_NO_OPERATIONS',
    0x26: 'CTAP2_ERR_UNSUPPORTED_ALGORITHM',
    0x27: 'CTAP2_ERR_OPERATION_DENIED',
    0x28: 'CTAP2_ERR_KEY_STORE_FULL',
    0x29: 'CTAP2_ERR_NOT_BUSY',
    0x2A: 'CTAP2_ERR_NO_OPERATION_PENDING',
    0x2B: 'CTAP2_ERR_UNSUPPORTED_OPTION',
    0x2C: 'CTAP2_ERR_INVALID_OPTION',
    0x2D: 'CTAP2_ERR_KEEPALIVE_CANCEL',
    0x2E: 'CTAP2_ERR_NO_CREDENTIALS',
    0x2F: 'CTAP2_ERR_USER_ACTION_TIMEOUT',
    0x30: 'CTAP2_ERR_NOT_ALLOWED',
    0x31: 'CTAP2_ERR_PIN_INVALID',
    0x32: 'CTAP2_ERR_PIN_BLOCKED',
    0x33: 'CTAP2_ERR_PIN_AUTH_INVALID',
    0x34: 'CTAP2_ERR_PIN_AUTH_BLOCKED',
    0x35: 'CTAP2_ERR_PIN_NOT_SET',
    0x36: 'CTAP2_ERR_PIN_REQUIRED',
    0x37: 'CTAP2_ERR_PIN_POLICY_VIOLATION',
    0x38: 'CTAP2_ERR_PIN_TOKEN_EXPIRED',
    0x39: 'CTAP2_ERR_REQUEST_TOO_LARGE',
}
*/
/*
function chr(c) {
    return String.fromCharCode(c);
} // Because map passes 3 args

function bytes2string(bytes) {
    var ret = Array.from(bytes).map(chr).join('');
    return ret;
}

function getstringlen(bytes) {
    for (var i = 1; i <= bytes.length; i++) {
        log("getstringlen ", i);
        if ((bytes[i] > 122 || bytes[i] < 97) && bytes[i] != 32) return i;
    }
}
*/
function u2f_unb64(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    return window.atob(s + '==='.slice((s.length + 3) % 4));
}

function arrayBufToBase64UrlEncode(buf) {
    var binary = '';
    var bytes = new Uint8Array(buf);
    for (var i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary)
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
/*
function hexStrToDec(hexStr) {
    return ~~(new Number('0x' + hexStr).toString(10));
}
*/
var IntToByteArray = function(int) {
    var byteArray = [0,
        0,
        0,
        0
    ];
    for (var index = 0; index < 4; index++) {
        var byte = int & 0xff;
        byteArray[(3 - index)] = byte;
        int = (int - byte) / 256;
    }
    return byteArray;
};

var counter = 0;
/**
 * Perform AES_256_GCM decryption using NACL shared secret
 * @param {Array} encrypted
 * @return {Array}
 */
function aesgcm_decrypt(input_key, encrypted) {
    counter += 1;
    return new Promise(resolve => {
        forge.options.usePureJavaScript = true;
        var key = sha256(input_key); //AES256 key sha256 hash of shared secret
        log("Key", key);
        var iv = IntToByteArray(counter); //<-- counter is undeclared
        while (iv.length < 12) iv.push(0);
        iv = Uint8Array.from(iv);
        log("IV", iv);
        var decipher = forge.cipher.createDecipher('AES-GCM', key);
        decipher.start({
            iv: iv,
            tagLength: 0, // optional, defaults to 128 bits
        });
        log("Encrypted", encrypted);
        var buffer = forge.util.createBuffer(Uint8Array.from(encrypted));
        log("Encrypted length", buffer.length());
        log(buffer);
        decipher.update(buffer);
        decipher.finish();
        var plaintext = decipher.output.toHex();
        log("Plaintext", plaintext);
        //log("Decrypted AES-GCM Hex", forge.util.bytesToHex(decrypted).match(/.{2}/g).map(hexStrToDec));
        //encrypted = forge.util.bytesToHex(decrypted).match(/.{2}/g).map(hexStrToDec);
        resolve(plaintext.match(/.{2}/g).map(hexStrToDec));
    });
}

/**
 * Perform AES_256_GCM encryption using NACL shared secret
 * @param {Array} plaintext
 * @return {Array}
 */
function aesgcm_encrypt(sharedsec, plaintext) {
    counter += 1;
    return new Promise(async resolve => {
        forge.options.usePureJavaScript = true;
        var key = await sha256(sharedsec); //AES256 key sha256 hash of shared secret
        log("Key", key);
        var iv = IntToByteArray(counter); //<-- counter is undeclared
        while (iv.length < 12) iv.push(0);
        iv = Uint8Array.from(iv);
        log("IV", iv);
        //Counter used as IV, unique for each message
        var cipher = forge.cipher.createCipher('AES-GCM', key);
        cipher.start({
            iv: iv, // should be a 12-byte binary-encoded string or byte buffer
            tagLength: 0
        });
        log("Plaintext", plaintext);
        cipher.update(forge.util.createBuffer(Uint8Array.from(plaintext)));
        cipher.finish();
        var ciphertext = cipher.output;
        ciphertext = ciphertext.toHex(),
            resolve(ciphertext.match(/.{2}/g).map(hexStrToDec))
    });
}

/*
function getOS() {
    var vendor = window.navigator.vendor,
        userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
        os = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
        os = 'Mac OS-' + vendor;
    }
    else if (iosPlatforms.indexOf(platform) !== -1) {
        os = 'iOS-' + vendor;
    }
    else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = 'Windows-' + vendor;
    }
    else if (/Android/.test(userAgent)) {
        os = 'Android-' + vendor;
    }
    else if (!os && /Linux/.test(platform)) {
        os = 'Linux-' + vendor;
    }

    return os;
}
*/
async function EPUB_TO_ONLYKEY_ECDH_P256(ePub, callback) {
    var xdecoded = arrayBufToBase64UrlDecode(ePub.split(".")[0]);
    var ydecoded = arrayBufToBase64UrlDecode(ePub.split(".")[1]);
    var publicKeyRawBuffer = new Uint8Array(65);
    var h = -1;
    for (var i in xdecoded) {
        h++;
        publicKeyRawBuffer[h] = xdecoded[i];
    }
    for (var j in ydecoded) {
        h++;
        publicKeyRawBuffer[h] = ydecoded[j];
    }

    if (publicKeyRawBuffer[0] == 0) {
        publicKeyRawBuffer = Array.from(publicKeyRawBuffer)
        publicKeyRawBuffer.unshift()
        publicKeyRawBuffer = Uint8Array.from(publicKeyRawBuffer);
    }
    // console.log("epub to raw", ePub, publicKeyRawBuffer)
    if (callback)
        callback(publicKeyRawBuffer)
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

    window.crypto.subtle.exportKey(
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

//-------------------------------------------------------------

// keytype
//#define KEYTYPE_NACL 0
//#define KEYTYPE_P256R1 1 
//#define KEYTYPE_P256K1 2 
//#define KEYTYPE_CURVE25519 3
// enc_resp
//#define NO_ENCRYPT_RESP 0
//#define ENCRYPT_RESP 1

var app_transit = nacl.box.keyPair();
    
    
function onlykey(keytype, enc_resp) {

    var api = new EventEmitter();

    var OKversion;
    var FWversion;
    var browser = "Chrome";
    
    if (window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
        browser = "Firefox";
    
    var os = getOS();
    var OKCONNECT = 228;

    async function connect(cb) {

        var okPub;

        setTimeout(async function() {
            console.log("-------------------------------------------");
            htmlLog("Requesting OnlyKey Secure Connection (" + getOS() + ")")();
            // $onStatus("Requesting OnlyKey Secure Connection");

            var message = ctaphid_custom_message_header(app_transit.publicKey);

            //build message
            var encryptedkeyHandle = Uint8Array.from(message); // Not encrypted as this is the initial key exchange
            
            imports.app.emit("ok-connecting");
            await ctaphid_via_webauthn(OKCONNECT, null, null, null, encryptedkeyHandle, 30000).then(async(response) => {
        
                if (!response || response == 1) {
                    htmlLog("Problem setting time on onlykey");
                    
                    imports.app.emit("ok-disconnected");
                    if(typeof cb == "function") cb(true);
                    // $onStatus("Problem setting time on onlykey");
                    return;
                }
                imports.app.emit("ok-connected");

                okPub = response.slice(21, 53);
                OKversion = response[19] == 99 ? 'Color' : 'Original';
                FWversion = bytes2string(response.slice(8, 20));
                var transit_sharedsec = nacl.box.before(Uint8Array.from(okPub), app_transit.secretKey);
                if (enc_resp == 1) {
                    // var encrypted_response = response.slice(53, response.length); // ? should be to end of message response.len
                    // response = aesgcm_decrypt(transit_sharedsec, encrypted_response);
                }
                htmlLog("OnlyKey " + OKversion + " " + FWversion + " connection established\n")();
                // $onStatus("OnlyKey " + FWversion + " Connection Established");
                
                if(typeof cb == "function") cb(null);

            });
        }, (1));

    }

    if (keytype == 1) {
        api.derive_public_key = async function(additional_d, cb) {
            // optype
            // #define DERIVE_PUBLIC_KEY 1
            // #define DERIVE_SHARED_SECRET 2
            var optype = 1;
            setTimeout(async function() {
                console.log("-------------------------------------------");
                htmlLog("Requesting OnlyKey Derive Public Key")();
                // $onStatus("Requesting OnlyKey Derive Public Key");

                var transit_key = nacl.box.keyPair();

                var message = ctaphid_custom_message_header(transit_key.publicKey);

                //Add additional data for key derivation
                var dataHash;

                if (!additional_d) {
                    // SHA256 hash of empty buffer
                    dataHash = await digestArray(Uint8Array.from(new Uint8Array(32)));
                }
                else {
                    // SHA256 hash of input data
                    dataHash = await digestArray(Uint8Array.from(additional_d));
                }

                Array.prototype.push.apply(message, dataHash);

                // htmlLog("additional data hash -> " + dataHash)
                // htmlLog("full message -> " + message)


                var encryptedkeyHandle = Uint8Array.from(message); // Not encrypted as this is the initial key exchange

                await ctaphid_via_webauthn(OKCONNECT, optype, keytype, enc_resp, encryptedkeyHandle, 6000).then(async(response) => {

                    if (!response || response == 1) {
                        htmlLog("Problem Derive Public Key on onlykey")();
                        // $onStatus("Problem Derive Public Key on onlykey");
                        cb(true);
                        return;
                    }

                    //var data = await Promise;
                    var okPub = response.slice(21, 53);
                    var _OKversion = response[19] == 99 ? 'Color' : 'Original';
                    var _FWversion = bytes2string(response.slice(8, 20));
                    var transit_sharedsec = nacl.box.before(Uint8Array.from(okPub), app_transit.secretKey);
                    if (enc_resp == 1) {
                        var encrypted_response = response.slice(53, response.length); // ? should be to end of message response.len
                        response = aesgcm_decrypt(transit_sharedsec, encrypted_response);

                        // Now response is going to be shorter - 53, need to adjust sharedPub position below
                    }

                    // Public ECC key will be an uncompressed ECC key, 65 bytes for P256, 32 bytes for NACL/CURVE25519 padded with 0s
                    var sharedPub;
                    if (keytype == 0 || keytype == 3) {
                        sharedPub = response.slice(response.length - 65, response.length - 33);
                    }
                    else {
                        sharedPub = response.slice(53, response.length);
                    }

                    htmlLog("OnlyKey Derive Public Key Complete")();

                    // $onStatus("OnlyKey Derive Public Key Completed ");

                    ONLYKEY_ECDH_P256_to_EPUB(sharedPub, function(epub) {
                        if (typeof cb === 'function') cb(null, epub);
                    })

                });
            }, (1));
        };
        api.derive_shared_secret = async function(additional_d, pubkey, cb) {
            EPUB_TO_ONLYKEY_ECDH_P256(pubkey, function(pubkey) {
                // optype
                // #define DERIVE_PUBLIC_KEY 1
                // #define DERIVE_SHARED_SECRET 2
                var optype = 2;

                setTimeout(async function() {
                    console.log("-------------------------------------------");
                    htmlLog("Requesting OnlyKey Shared Secret");
                    // $onStatus("Requesting OnlyKey Shared Secret");

                    var transit_key = nacl.box.keyPair();

                    //Add header message;
                    var message = ctaphid_custom_message_header(transit_key.publicKey);

                    //Add additional data for key derivation
                    var dataHash;

                    if (!additional_d) {
                        // SHA256 hash of empty buffer
                        dataHash = await digestArray(Uint8Array.from(new Uint8Array(32)));
                    }
                    else {
                        // SHA256 hash of input data
                        dataHash = await digestArray(Uint8Array.from(additional_d));
                    }

                    Array.prototype.push.apply(message, dataHash);
                    //htmlLog("additional data hash -> " + dataHash)

                    //Add input public key for shared secret computation 
                    Array.prototype.push.apply(message, pubkey);

                    await ctaphid_via_webauthn(OKCONNECT, optype, keytype, enc_resp, message, 6000).then(async(response) => {

                        if (!response || response == 1) {
                            htmlLog("Problem getting Shared Secret");
                            // $onStatus("Problem getting Shared Secret");
                            cb(true);
                            return;
                        }

                        var okPub = response.slice(21, 53);
                        var _OKversion = response[19] == 99 ? 'Color' : 'Original';
                        var _FWversion = bytes2string(response.slice(8, 20));
                        var transit_sharedsec = nacl.box.before(Uint8Array.from(okPub), app_transit.secretKey);
                        if (enc_resp == 1) {
                            var encrypted_response = response.slice(53, response.length); // ? should be to end of message response.len
                            response = aesgcm_decrypt(transit_sharedsec, encrypted_response);

                            // Now response is going to be shorter - 53, need to adjust returned_sharedsec position below
                        }

                        var e;


                        //Private ECC key will be 32 bytes for all supported ECC key types

                        var returned_sharedsec = response.slice(response.length - 32, response.length);
                        var _OKversion = response[19] == 99 ? 'Color' : 'Original';
                        var _FWversion = bytes2string(response.slice(8, 20));

                        htmlLog("OnlyKey Shared Secret Completed\n");
                        // $onStatus("OnlyKey Shared Secret Completed ");

                        var derivedKey = await window.crypto.subtle.importKey('raw', Uint8Array.from(returned_sharedsec), { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
                        var _k = await window.crypto.subtle.exportKey('jwk', derivedKey).then(({ k }) => k);

                        if (typeof cb === 'function') cb(null, _k);

                    });
                }, (1));

            });
        };
    }

    function ctaphid_custom_message_header(publicKey) {
        var message = [255, 255, 255, 255, OKCONNECT];

        //Add current epoch time
        var currentEpochTime = Math.round(new Date().getTime() / 1000.0).toString(16);
        var timePart = currentEpochTime.match(/.{2}/g).map(hexStrToDec);
        Array.prototype.push.apply(message, timePart);

        //Add transit pubkey
        Array.prototype.push.apply(message, publicKey);

        //Add Browser and OS codes
        var env = [browser.charCodeAt(0), os.charCodeAt(0)];
        Array.prototype.push.apply(message, env);

        return message;
    }

    function encode_ctaphid_request_as_keyhandle(cmd, opt1, opt2, opt3, data) {
        debug_log('REQUEST CMD', cmd);
        debug_log('REQUEST OPT1', opt1);
        debug_log('REQUEST OPT2', opt2);
        debug_log('REQUEST OPT3', opt3);
        debug_log('REQUEST DATA', data);
        var addr = 0;

        // should we check that `data` is either null or an Uint8Array?
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

        debug_log('FORMATTED REQUEST:', array);
        return array;
    }

    function decode_ctaphid_response_from_signature(response) {

        /*
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
        */

        debug_log('UNFORMATTED RESPONSE:', response);

        var signature_count = (
            new DataView(
                response.authenticatorData.slice(33, 37)
            )
        ).getUint32(0, false); // get count as 32 bit BE integer

        var signature = new Uint8Array(response.signature);
        var data = null;
        var error_code = signature[0];

        if (error_code === 0) {
            data = signature.slice(1, signature.length);
            if (signature.length < 73 && bytes2string(data.slice(0, 9)) == 'UNLOCKEDv') {
                // Reset shared secret and start over
            }
            else if (signature.length < 73 && bytes2string(data.slice(0, 6)) == 'Error ') {
                // Something went wrong, read the ascii response and display to user
                var msgtext = data.slice(0, getstringlen(data));
                const btmsg = `${bytes2string(msgtext)}. Refresh this page and try again.`;
                //button.textContent = btmsg;
                //button.classList.remove('working');
                //button.classList.add('error');
                _setStatus('finished');
                throw new Error(bytes2string(msgtext));
            }
            else if (window._status === 'waiting_ping' || window._status === 'done_challenge') {
                // got data
                encrypted_data = data;
                _setStatus('finished');
            }
        }
        else if (error_code == ctap_error_codes['CTAP2_ERR_NO_OPERATION_PENDING']) {
            // No data received, data has already been retreived or wiped due to 5 second timeout

            //button.textContent = 'no data received';
            _setStatus('finished');
            throw new Error('no data received');

        }
        else if (error_code == ctap_error_codes['CTAP2_ERR_USER_ACTION_PENDING']) {
            // Waiting for user to press button or enter challenge
            log('CTAP2_ERR_USER_ACTION_PENDING');
        }
        else if (error_code == ctap_error_codes['CTAP2_ERR_OPERATION_PENDING']) {
            // Waiting for user to press button or enter challenge
            log('CTAP2_ERR_OPERATION_PENDING');
        }

        return {
            count: signature_count,
            status: ctap_error_codes[error_code],
            data: data,
            signature: signature,
        };
    }

    async function ctaphid_via_webauthn(cmd, opt1, opt2, opt3, data, timeout) {
        // if a token does not support CTAP2, WebAuthn re-encodes as CTAP1/U2F:
        // https://fidoalliance.org/specs/fido-v2.0-rd-20170927/fido-client-to-authenticator-protocol-v2.0-rd-20170927.html#interoperating-with-ctap1-u2f-authenticators
        //
        // the bootloader only supports CTAP1, so the idea is to drop
        // u2f-api.js and the Firefox about:config fiddling
        //
        // problem: the popup to press button flashes up briefly :(
        //

        var keyhandle = encode_ctaphid_request_as_keyhandle(cmd, opt1, opt2, opt3, data);
        var challenge = window.crypto.getRandomValues(new Uint8Array(32));
        var id = window.location.hostname;
        var request_options = {
          challenge: challenge,
          allowCredentials: [{
            id: keyhandle,
            type: 'public-key',
          }],
          timeout: timeout,
          //rpId: 'apps.crp.to',
          rpId: id ,
          userVerification: 'discouraged',
          //userPresence: 'false',
          //mediation: 'silent',
          extensions: {
            // appid: 'https://apps.crp.to',
            appid: 'https://'+id 
          },
        };

        return window.navigator.credentials.get({
            publicKey: request_options
        }).then(assertion => {
            debug_log("GOT ASSERTION", assertion);
            debug_log("RESPONSE", assertion.response);
            let response = decode_ctaphid_response_from_signature(assertion.response);
            debug_log("RESPONSE:", response);
            if (response.status == 'CTAP2_ERR_USER_ACTION_PENDING') return response.status;
            if (response.status == 'CTAP2_ERR_OPERATION_PENDING') {
                _setStatus('done_challenge');
                return response.status;
            }
            return response.data;
        }).catch(error => {
            debug_log("ERROR CALLING:", cmd, opt1, opt2, opt3, data);
            debug_log("THE ERROR:", error);
            debug_log("NAME:", error.name);
            debug_log("MESSAGE:", error.message);
            if (error.name == 'NS_ERROR_ABORT' || error.name == 'AbortError' || error.name == 'InvalidStateError') {
                _setStatus('done_challenge');
                return 1;
            }
            else if (error.name == 'NotAllowedError' && os == 'Windows') {
                // Win 10 1903 issue
                return 1;
            }
            return Promise.resolve(); // error;
        });

    }

    api.connect = connect;

    return api;
}



return onlykey;
}



/*function get_pin(byte) {
    if (byte < 6) return 1;
    else {
        return (byte % 5) + 1;
    }
}*/

/*async function digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    return hashHex;
}*/

/*async function digestBuff(buff) {
    const msgUint8 = buff;
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    return hashHex;
}*/

/*function noop() {}*/

/*function decArr_to_hexdecArr(decArr) {
    var hexdecArr = [];
    for (var i = 0; i < decArr.length; i++) {
        hexdecArr.push(decimalToHexString(decArr[i]));
    }
    return hexdecArr;
}*/


/*function bytes2b64(bytes) {
    return u2f_b64(bytes2string(bytes));
}*/

/*function b642bytes(u2fb64) {
    return string2bytes(u2f_unb64(u2fb64));
}*/

/*function bytes2b64_B(bytes) {
    return window.btoa(bytes2string(bytes));
}*/

/*function b642bytes_B(b64) {
    return string2bytes(window.atob(u2fb64));
}*/

/*function u2f_b64(s) {
    return window.btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}*/

/*let wait = ms => new Promise(resolve => setTimeout(resolve, ms));*/

/*function string2bytes(s) {
    var len = s.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = s.charCodeAt(i);
    return bytes;
}*/

/*function decimalToHexString(number) {
    if (number < 0) {
        number = 0xFFFFFFFF + number + 1;
    }
    var val = number.toString(16).toUpperCase();
    if (val.length == 1)
        val = "0" + val;

    return val;
}*/

/*function arbuf2hex(buffer) {
    var hexCodes = [];
    var view = new DataView(buffer);
    for (var i = 0; i < view.byteLength; i += 4) {
        // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
        var value = view.getUint32(i)
        // toString(16) will give the hex representation of the number without padding
        var stringValue = value.toString(16)
        // We use concatenation and slice for padding
        var padding = '00000000'
        var paddedValue = (padding + stringValue).slice(-padding.length)
        hexCodes.push(paddedValue);
    }

    // Join all the hex strings into one
    return hexCodes.join("");
}*/

/*function arbuf2sha256(hexstr) {
    // We transform the string into an arraybuffer.
    var buffer = new Uint8Array(hexstr.match(/[\da-f]{2}/gi).map(function(h) {
        return parseInt(h, 16)
    }));
    return crypto.subtle.digest("SHA-256", buffer).then(function(hash) {
        return arbuf2hex(hash);
    });
}*/

/*function mkchallenge(challenge) {
    var s = [];
    for (var i = 0; i < 32; i++) s[i] = String.fromCharCode(challenge[i]);
    return u2f_b64(s.join());
}*/