module.exports = function(imports) {
    return new Promise(async function(resolve, reject) {

        var cooldown_first_call = 5;
        var cooldown_between_calls = 30;

        var p2g = imports.onlykeyApi.pgp();

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
        
        
        var ONLYKEY_pubkey_armored = "bmatusiak";//use `` to encapsulate it
        var ONLYKEY_message_armored = false;//use `` to encapsulate it

        var onlykeyPubKey = ONLYKEY_pubkey_armored ? ONLYKEY_pubkey_armored : rsaKeySet ? rsaKeySet.PubKey : eccKeySet ? eccKeySet.PubKey : yourtestKeySet.PubKey;

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
        resolve();


        async function doEncrypt(pubkeyToUse, unencrypted_message, resolve, reject) {
            p2g._$mode("Encrypt and Sign");
            //p2g._$mode("Encrypt Only");

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

            p2g._$mode("Decrypt and Verify");

            cooldownLOOP(async function() {
                await imports.onlykeyApi.api.check();
                // p2g._$mode("Decrypt Only");
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