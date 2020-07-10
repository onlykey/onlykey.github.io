module.exports = function(imports) {
    return new Promise(async function(resolve, reject) {

        var cooldown_between_calls = 10;

        var p2g = imports.onlykeyApi.pgp();

        p2g.on("error", console.log.bind({}, "PGP ERROR:"))
        p2g.on("status", function(msg) {

                if (msg.indexOf("You have 8 seconds to enter challenge code") > -1)
                    particle_send_click();

                console.log("PGP STATUS:", msg)

            }

        )
        p2g.on("working", console.log.bind({}, "PGP WORKING:"))
        p2g.on("done", console.log.bind({}, "PGP DONE:"))

        var testMessage = "The quick brown fox jumps over the lazy dog" + (new Date().getTime());


        var rsaKeySet = require("../test_pgp/keys/rsakey.js");
        var ecdhKeySet = require("../test_pgp/keys/ecdhkey.js");

        var eccKeySet = require("../test_pgp/keys/ecckey.js");

        var pro_key = (`-----BEGIN PGP PUBLIC KEY BLOCK-----
Comment: https://keybase.io/download
Version: Keybase Go 5.1.1 (linux)

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
KdC7XnwBKVcoo3k1qdTej/nQY2iOZNzjkmC/
=jUa0
-----END PGP PUBLIC KEY BLOCK-----`);

        // var onlykeyPubKey = rsaKeySet.PubKey;
        var onlykeyPubKey = pro_key;

        function play(resolve, reject) {
            cooldownLOOP(async function() {
                p2g._$mode("Encrypt and Sign");
                //p2g._$mode("Encrypt Only");
                //console.log("to:",onlykeyPubKey)
                //console.log("from:",onlykeyPubKey)
                p2g.startEncryption(onlykeyPubKey, onlykeyPubKey, testMessage, false /*file*/ , async function(err, pgp_armored_message) {
                    if (!err && !pgp_armored_message)
                        return reject("ONLYKEYPGP never give us a message to decrypt");
                    else if (err)
                        return reject("TEST:ONLYKEYPGP startEncryption:err: " + err);
                    else
                        console.log("ONLYKEYPGP  startEncryption : PASS\r\n", testMessage, "\r\n", pgp_armored_message);


                    cooldownLOOP(async function() {

                        //particle_send_click();
                        //await p2g.check();
                        //cooldownLOOP(function() {

                            p2g._$mode("Decrypt and Verify");
                            //p2g._$mode("Decrypt Only");
                            console.log("to:",onlykeyPubKey)
                            console.log("from:",onlykeyPubKey)
                            p2g.startDecryption(onlykeyPubKey, onlykeyPubKey, pgp_armored_message.toString(), false, function(err, pgp_decrypted_message) {
                                if (!err && !pgp_decrypted_message)
                                    return reject("ONLYKEYPGP never give us a unencrypted message");
                                else if (err)
                                    return reject("TEST:ONLYKEYPGP " + err);
                                else
                                if (pgp_decrypted_message == testMessage)
                                    console.log("ONLYKEY PGP startDecryption : PASS\r\n", pgp_decrypted_message.toString());
                                else return reject("ONLYKEY PGP startDecryption : FAIL");
                                //resolve();
                                play(resolve, reject); //loop forever
                            });

                        //}, 5);
                    }, cooldown_between_calls);


                });

            }, 5);
        }

        await (new Promise(play)).catch(reject);
        resolve();
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