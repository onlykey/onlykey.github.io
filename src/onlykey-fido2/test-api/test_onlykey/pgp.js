module.exports = function(imports) {
    return new Promise(async function(resolve, reject) {

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
        var yourtestKeySet// = require("../test_pgp/keys/ecckey.js");
        
        
        var ONLYKEY_pubkey_armored = "r06u34c1d_";// bmatusiak "r06u34c1d_";//use `` to encapsulate it
        var ONLYKEY_pubkey_armored_verify = true;
        var ONLYKEY_message_armored = false; `-----BEGIN PGP MESSAGE-----
Version: Keybase OpenPGP v2.1.13
Comment: https://keybase.io/crypto

wcBMA64abdqB6k49AQf/aP/xEwG+TREVN4CZETzTJbB/q+wxFyyWMGXw1vkHpScG
6B1JfYBQ8c+FmfMJry1RZN7y6CG0qCRSvaN23eZKrqHia5T4XPjhX9GVHjUZHLcE
QmDCe1HgFvdUnVW3gXkfQQgCkqoeq786zm7Cj/Iwc5R5GXe/9ZYBi0ublhfYFdTc
XI45paq5GVNh3+r5xDafqaJ6g1vq1dEIsX5KOuzggh1Kv+qQCMwjoompzbtw+bl+
37otc3fMlWTr9KXSk142MbyeNtLL5tnkDMtnIAXKddiwPa3+mZXTfBq3o08dTUL8
POqNN8FriRS27oZADwKhE/JYHfTobli105mLGWI/7NJBAaPZ3AfCfuy5M03uoPVX
kl1k/xYUKjY56h+5mh7x4Rr6zwn0swhcSBLzSYJurpjhPjO3Jf/OVfWYk4myQ/wE
Ab4=
=nN5Q
-----END PGP MESSAGE-----`;//use `` to encapsulate it, no need to set this if you can use a service 

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
                p2g._$mode("Encrypt Only");
            }
            if(p2g._$mode() == "Encrypt Only"){
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

                        resolve(null, pgp_armored_message.toString());
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
};