module.exports = function(imports) {
    return new Promise(async function(resolve) {

        var p2g = imports.onlykeyApi.pgp();


        var testMessage = "The quick brown fox jumps over the lazy dog" + (new Date().getTime());


        var rsaKeySet = require("../test_pgp/keys/rsakey.js");
        var ecdhKeySet = require("../test_pgp/keys/ecdhkey.js");
        var eccKeySet =   require("../test_pgp/keys/ecckey.js");

        p2g._$mode("Encrypt and Sign");
        p2g.startEncryption(eccKeySet.PubKey, eccKeySet.PubKey, testMessage, false /*file*/ , async function(err, pgp_armored_message) {
            if (!err && !pgp_armored_message)
                throw new Error("ONLYKEYPGP never give us a message to decrypt");
            else if (err)
                throw new Error("TEST:ONLYKEYPGP " + err);
            else
                console.log("ONLYKEYPGP  startEncryption : PASS", pgp_armored_message);


            cooldownLOOP(function() {

                p2g._$mode("Decrypt and Verify");
                p2g.startDecryption(eccKeySet.PubKey, pgp_armored_message, false, function(err, pgp_decrypted_message) {
                    if (!err && !pgp_armored_message)
                        throw new Error("ONLYKEYPGP never give us a unencrypted message");
                    else if (err)
                        throw new Error("TEST:ONLYKEYPGP " + err);
                    else
                    if (pgp_decrypted_message == testMessage)
                        console.log("ONLYKEY PGP startDecryption : PASS");
                    else throw new Error("ONLYKEY PGP startDecryption : FAIL");
                    resolve();
                });

            }, 5);


        });



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
};