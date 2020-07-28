module.exports = function(imports) {
    var kbpgp = imports.kbpgp;
    return new Promise(async function(resolve, reject) {
        
        //fill in your onlykey keybase username or protonmail email address
        var ONLYKEY_pubkey_armored = "testcrp9";// bmatusiak "r06u34c1d_";//use `` to encapsulate it
        var ONLYKEY_pubkey_armored_verify = false;
        var ONLYKEY_message_armored = `-----BEGIN PGP MESSAGE-----
Version: Keybase OpenPGP v2.1.13
Comment: https://keybase.io/crypto

wV4Dvj6nsu0giTASAQdAXN4obb6LKnh63bmzLrXJs5w90g/nRd0kO4Z5QcTXG2Mw
qGK3JqRKNudfuFGuAQq5yq3fBxFfOFtpV99tzF2Se5fF2KxQGYiZiKPTO6sGTJhu
wV4Dvj6nsu0giTASAQdAFj0GsQSTh//rCInFpQSzQ3CfA1OtzMlAVqROD99iQlww
Vyrb+Pl2pRBql6YkILYGpMJ+qGKlEj87bTorRTFs9pLk+SQuWDD3vwAgTppZryiX
0qwBQazmERALD/VGS3K9DysQTFWkbrrWj2Cj5UZ+IrCn+erz8/iO9gQW7x9nSKOZ
4jx2TweoSMLYbZQNhK2DGbVThX7eI/DnUPc1vYQenkDG9OT5pclcF3ofyHmy4B8T
7TkY+aSzsHci83JjwQr0A+c3X6haYEU0yZZW4o2KHQPo8IXQnp2ZOSj0osbhXK9G
TYaGtPDqINxKA2OaOpXpl6Pj0ZEONb85/3i/IPJC
=qNP6
-----END PGP MESSAGE-----`;//use `` to encapsulate it, no need to set this if you can use a service 
        
        if(ONLYKEY_message_armored == "") ONLYKEY_message_armored = false;
        
        var cooldown_first_call = 5;
        var cooldown_between_calls = 30;
        
        var p2g = imports.onlykeyApi.pgp().api();

        p2g.on("error", console.log.bind({}, "PGP ERROR:"))
        p2g.on("status", function(msg) {
                // if (msg.indexOf("You have 8 seconds to enter challenge code") > -1) particle_send_click();
                console.log("PGP STATUS:", msg)
            }
        )
        p2g.on("working", console.log.bind({}, "PGP WORKING:"))
        p2g.on("done", console.log.bind({}, "PGP DONE:"))

        var testMessage = "The quick brown fox jumps over the lazy dog" + (new Date().getTime());

        var rsaKeySet// = require("../test_pgp/keys/rsakey.js");
        var eccKeySet// = require("../test_pgp/keys/ecckey.js");
        var yourtestKeySet = require("../test_pgp/keys/ecckey.js");
                
        var onlykeyPubKey = ONLYKEY_pubkey_armored ? ONLYKEY_pubkey_armored : rsaKeySet ? rsaKeySet.PubKey : eccKeySet ? eccKeySet.PubKey : yourtestKeySet.PubKey;
        
        console.log("Running onlykey test with KEY:", onlykeyPubKey);

        async function play(resolve, reject) {
            
            if(ONLYKEY_message_armored){
                cooldown_between_calls = cooldown_first_call;
                doDecrypt(onlykeyPubKey, ONLYKEY_message_armored, resolve, reject);
            }else{
                doEncrypt(onlykeyPubKey, testMessage, function(err, message) {
                    if(err) return reject(err);
                    doDecrypt(onlykeyPubKey, message, resolve, reject);
                }, reject);
            }
        }

        await (new Promise(play)).catch(reject);
        return resolve();


        async function doEncrypt(pubkeyToUse, unencrypted_message, resolve, reject) {
            if(ONLYKEY_pubkey_armored_verify){
                p2g._$mode("Encrypt and Sign");
            }else{
                //p2g._$mode("Encrypt Only");
                p2g._$mode("Sign Only");                
            }
            if(p2g._$mode() == "Encrypt Only" || p2g._$mode() == "Sign Only"){
                cooldown_between_calls = cooldown_first_call
            }

            cooldownLOOP(async function() {
                await imports.onlykeyApi.api.check();

                cooldownLOOP(function() {
                    p2g.startEncryption(pubkeyToUse, pubkeyToUse, unencrypted_message, false /*file*/ , async function(err, pgp_armored_message) {
                        if (!err && !pgp_armored_message)
                            return reject("ONLYKEYPGP never give us a message to decrypt");
                        else if (err)
                            return reject("TEST:ONLYKEYPGP startEncryption:err: " + err);
                        else
                            console.log("ONLYKEYPGP  startEncryption : PASS\r\n", unencrypted_message, "\r\n", pgp_armored_message);
                        
                        if(!ONLYKEY_pubkey_armored_verify && yourtestKeySet){
                            loadPubKey(yourtestKeySet, function(pubKey){
                                decrypt_message(pubKey, pgp_armored_message.toString(), function(message){
                                  console.log(message)  
                                  resolve(null, pgp_armored_message.toString());
                                })
                            })
                        }
                        else resolve(null, pgp_armored_message.toString());
                    });
                }, cooldown_first_call);
            }, cooldown_first_call);
        }

        async function doDecrypt(pubkeyToUse, pgp_armored_message, resolve, reject) {
            if(ONLYKEY_pubkey_armored_verify){
                p2g._$mode("Decrypt and Verify");
            }else{
                p2g._$mode("Decrypt Only");
            }

            cooldownLOOP(async function() {
                await imports.onlykeyApi.api.check();
                
                cooldownLOOP(function() {
                    p2g.startDecryption(pubkeyToUse, pubkeyToUse, pgp_armored_message.toString(), false, function(err, pgp_decrypted_message) {
                        if (!err && !pgp_decrypted_message)
                            return reject("ONLYKEYPGP never give us a unencrypted message");
                        else if (err)
                            return reject("TEST:ONLYKEYPGP " + err);
                        else
                        if (pgp_decrypted_message)
                            console.log("ONLYKEY PGP startDecryption : PASS\r\n", pgp_decrypted_message.toString());
                        else return reject("ONLYKEY PGP startDecryption : FAIL");
                        resolve();
                        //play(resolve, reject); //loop forever
                    });

                }, cooldown_between_calls);
            }, cooldown_first_call);

        }
    });

    function cooldownLOOP(fn, waitLoop) {

        var intver = setInterval(function() {
            if (waitLoop > 0) {
                console.log("cooldown", waitLoop);
                return waitLoop -= 1;
            }
            clearInterval(intver);
            fn();
        }, 1000);
    }

    function particle_send_click() {
        const { spawn } = require('child_process');
        const sh = spawn('sh', [__dirname + '/particle_send.sh']);


        sh.on('close', (code) => {
            console.log("AUTOMATED CLICK");
        });
    }

     function loadPubKey(keySetA, cb) {
    
        
        kbpgp.KeyManager.import_from_armored_pgp({
          armored: keySetA.PubKey
        }, (err, sender) => {
          if (err) {
            // onlykey_api_pgp.emit("error", err);
            if (err) throw err;
            return;
          }
        
          cb(sender);
        
        });
    }
     function loadPrivKey(keySetA, cb) {

        kbpgp.KeyManager.import_from_armored_pgp({
          armored: keySetA.PrivKey
        }, (err, sender) => {
          if (err) {
            // onlykey_api_pgp.emit("error", err);
            if (err) throw err;
            return;
          }

          if (sender.is_pgp_locked()) {
            let passphrase = keySetA.PrivKeyPW;

            sender.unlock_pgp({
              passphrase: passphrase
            }, err => {
              if (!err) {
                // console.log(`Loaded test private key using passphrase '${passphrase}'`);
                cb(sender);
              }
              else {
                if (err) throw err;
              }
            });
          }
          else {
            // console.log("Loaded test private key w/o passphrase");
            cb(sender);
          }
        });
      }

     function decrypt_message(pgp_key, message, cb) {
        var ring = new kbpgp.keyring.KeyRing;
        var kms = [pgp_key];
        var pgp_msg = message;
        // var asp = '/* as in Encryption ... */' ;
        for (var i in kms) {
          ring.add_key_manager(kms[i]);
        }
        kbpgp.unbox({ keyfetch: ring, armored: pgp_msg /*, asp*/ }, function(err, literals) {
          if (err) throw err;
          else {
            // console.log("decrypted message");
            // console.log(literals[0].toString());
            cb(literals[0].toString());
            var km, ds = km = null;
            ds = literals[0].get_data_signer();
            if (ds) { km = ds.get_key_manager(); }
            if (km) {
              console.log("Signed by PGP fingerprint", km.get_pgp_fingerprint().toString('hex'));
            }
          }
        });
      };

};