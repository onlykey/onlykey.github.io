module.exports = function(kbpgp) {
  return new Promise(async function(resolve) {
    var KB_ONLYKEY = {};

    var testMessage = "The quick brown fox jumps over the lazy dog";


    var rsaKeySet   = false;//require("./keys/rsakey.js");
    var ecdhKeySet  = false;  //require("./keys/ecdhkey.js");
    var eccKeySet   = require("./keys/ecckey.js");

    var act;

    if (false) {
      //rsa --  this takes a few seconds 
      kbpgp.KeyManager.generate_rsa({ userid: "alice <user@example.com>" }, function(err, alice) {
        if (err) throw err;
        alice.sign({}, function(err) {
          if (err) throw err;
          console.log("alice done!");
          alice.export_pgp_private({
            passphrase: 'test'
          }, function(err, pgp_private) {
            if (err) throw err;
            console.log("private key: ", pgp_private);
          });
          alice.export_pgp_public({}, function(err, pgp_public) {
            if (err) throw err;
            console.log("public key: ", pgp_public);
          });
        });

      });
    }
    else if (rsaKeySet) {
      var aliceTest = new Promise(async function(resolve) {
        act = loadAct(rsaKeySet,null, "rsa");
        act.loadPrivKey(function(privKey) {
          act.loadPubKey(function(pubKey) {
            act.start(privKey, pubKey, resolve);
          });
        });
      });
    }

    await aliceTest;

    if (false) { //bob
      //ecc  -- this will be a bit faster
      kbpgp.KeyManager.generate_ecc({ userid: "bob <user@example.com>" }, function(err, bob) {
        if (err) throw err;
        bob.sign({}, function(err) {
          if (err) throw err;
          console.log("bob done!");
          bob.export_pgp_private({
            passphrase: 'test'
          }, function(err, pgp_private) {
            if (err) throw err;
            console.log("private key: ", pgp_private);
          });
          bob.export_pgp_public({}, function(err, pgp_public) {
            if (err) throw err;
            console.log("public key: ", pgp_public);
          });
          //act.start(bob);
        });
      });
    }
    else if (ecdhKeySet) {

      /*
      var bobkeySet = require("./bobkey.js");
      act.loadPrivKey(bobkeySet, function(bob) {
        act.loadPubKey(bobkeySet, function(bob_pub) {
          act.start(bob, bob_pub);
        });
      });
      */

      var bobTest = new Promise(async function(resolve) {


        act = loadAct(ecdhKeySet, null, "ecdh");
        act.loadPrivKey(function(privKey) {
          act.loadPubKey(function(pubKey) {
            act.start(privKey, pubKey, resolve);
          });
        });

      });
    }

    await bobTest;
    
    
    if (false) { //bob
      //ecc  -- this will be a bit faster
      kbpgp.KeyManager.generate_ecc({ userid: "bob <user@example.com>" }, function(err, bob) {
        if (err) throw err;
        bob.sign({}, function(err) {
          if (err) throw err;
          console.log("bob done!");
          bob.export_pgp_private({
            passphrase: 'test'
          }, function(err, pgp_private) {
            if (err) throw err;
            console.log("private key: ", pgp_private);
          });
          bob.export_pgp_public({}, function(err, pgp_public) {
            if (err) throw err;
            console.log("public key: ", pgp_public);
          });
          //act.start(bob);
        });
      });
    }
    else if (eccKeySet) {

      /*
      var bobkeySet = require("./bobkey.js");
      act.loadPrivKey(bobkeySet, function(bob) {
        act.loadPubKey(bobkeySet, function(bob_pub) {
          act.start(bob, bob_pub);
        });
      });
      */

      var charlieTest = new Promise(async function(resolve) {


        act = loadAct(eccKeySet, null, "ecc");
        act.loadPrivKey(function(privKey) {
          act.loadPubKey(function(pubKey) {
            act.start(privKey, pubKey, resolve);
          });
        });

      });
    }

    await charlieTest;
    
    
    
    resolve();

    function loadAct(keySetA, keySetB, testName) {
      var act = {};
      var series;

      act.start = async function(pgp_key, key_pub, done) {
        
        await series.custom(pgp_key, key_pub);
        
        // await series.a(pgp_key, key_pub);
        // await series.b(pgp_key, key_pub);
        // await series.c(pgp_key, key_pub);
        done();
      };

      series = {
        custom:function(pgp_key, key_pub){
          return new Promise(async function(resolve) {
          var message = `-----BEGIN PGP MESSAGE-----
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
-----END PGP MESSAGE-----`;
          act.decrypt_message(pgp_key, message, function(message) {
            console.log("PASSED CUSTOM: test message", message);
            resolve();
          });
          });
        },
        a: function(pgp_key, key_pub) {
          return new Promise(async function(resolve) {
            act.sign_message(pgp_key, function(message) {
              // console.log(message);
              act.decrypt_message(key_pub, message, function(message) {
                // console.log(message);
                if (testMessage == message) {
                  console.log("PGP TEST:",testName,"sign_message->decrypt_message Pass");
                  resolve();
                }
                else throw new Error("PGP TEST: "+testName+" sign_message->decrypt_message Fail");
              });
            });
          });
        },
        b: function(pgp_key, key_pub) {
          return new Promise(async function(resolve) {
            act.encrypt_message(key_pub, function(message) {
              // console.log(message);
              act.decrypt_message(pgp_key, message, function(message) {
                // console.log(message);
                if (testMessage == message) {
                  console.log("PGP TEST:",testName,"encrypt_message->decrypt_message Pass");
                  resolve();
                }
                else throw new Error("PGP TEST: "+testName+"encrypt_message->decrypt_message Fail");
              });
            });
          });
        },
        c: function(pgp_key, key_pub) {
          return new Promise(async function(resolve) {
            act.encrypt_sign_message(key_pub, pgp_key,  function(message) {
              // console.log(message);
              act.decrypt_message(pgp_key, message, function(message) {
                // console.log(message);
                if (testMessage == message) {
                  console.log("PGP TEST:",testName,"encrypt_sign_message->decrypt_message Pass");
                  resolve();
                }
                else throw new Error("PGP TEST: "+testName+"encrypt_sign_message->decrypt_message Fail");
              });
            });
          });
        }
      }

      act.encrypt_message = function(key_pub, cb) {

        var params = {
          msg: testMessage,
          encrypt_for: [key_pub],
          // sign_with: pgp_key
        };

        kbpgp.box(params, function(err, result_string, result_buffer) {
          if (err) throw err;
          else {
            cb(result_string);
            // console.log(err, result_string, result_buffer);
          }
        });

      }
      
      act.encrypt_sign_message = function(key_pub, pgp_key, cb) {

        var params = {
          msg: testMessage,
          encrypt_for: [pgp_key],
          sign_with: pgp_key
        };

        kbpgp.box(params, function(err, result_string, result_buffer) {
          if (err) throw err;
          else {
            cb(result_string);
            // console.log(err, result_string, result_buffer);
          }
        });

      }

      act.sign_message = function(pgp_key, cb) {

        var params = {
          msg: testMessage,
          // encrypt_for: [key],
          sign_with: pgp_key
        };

        kbpgp.box(params, function(err, result_string, result_buffer) {
          if (err) throw err;
          else {
            cb(result_string);
            // console.log(err, result_string, result_buffer);
          }
        });

      }

      act.decrypt_message = function(pgp_key, message, cb) {
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
              // console.log("Signed by PGP fingerprint", km.get_pgp_fingerprint().toString('hex'));
            }
          }
        });
      };

      act.loadPrivKey = function(cb) {

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

      act.loadPubKey = function(cb) {


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

      return act;
    }
  });
}