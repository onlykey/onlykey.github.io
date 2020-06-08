module.exports = function(onlykeyApi, usevirtru) {

  const kbpgp = require('./kbpgp.onlykey.js')(onlykeyApi);
  const kbpgp2 = require('./kbpgp-2.1.0.js');
  /*globals kbpgp Blob */
  // const url = require("url");
  var saveAs = require("file-saver").saveAs;
  const JSZip = require('jszip');
  
  let wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  var EventEmitter = require("events").EventEmitter;
  var onlykey_api_pgp = new EventEmitter();

  // var ring = new kbpgp.keyring.KeyRing;

  onlykey_api_pgp.startDecryption = async function(signer, message, file, callback) {
    var sender_public_key;

    onlykeyApi.poll_type = 3;
    onlykeyApi.poll_delay = 1;
    console.info(onlykeyApi.poll_type);
    // button.classList.remove('error');
    // button.classList.add('working');
    onlykey_api_pgp.emit("working");

    if (signer == "" && onlykeyApi._status == 'Decrypt and Verify') {
      onlykey_api_pgp.emit("error", "I need senders's public pgp key to verify :(");
      return;
    }
    else if (signer != "" && onlykeyApi._status == 'Decrypt and Verify') {
      if (signer.slice(0, 10) != '-----BEGIN') { // Check if its a pasted public key
        sender_public_key = await onlykeyApi.getKey(signer);
      }
      else {
        sender_public_key = signer;
      }
    }
    if (message != null)
      decryptText(sender_public_key, message, callback);
    else decryptFile(sender_public_key, file, callback);
  };

  function decryptText(key, encryptedMessage, callback) {
    return new Promise(async(resolve) => {

      var keyStore = pgpkeyStore();
      switch (onlykeyApi._status) {
        case 'Decrypt and Verify':
          await keyStore.loadPublic(key);
          onlykey_api_pgp.emit("status", "Decrypting and verifying message ...");
          break;
        case 'Decrypt Only':
          onlykey_api_pgp.emit("status", "Decrypting message ...");
          var Decrypt_Only = true;
          break;
        default:
      }
      await keyStore.loadPrivate();
      kbpgp.unbox({
        keyfetch: keyStore.ring,
        armored: encryptedMessage,
        // strict: Decrypt_Only ? false : true
      }, (err, decryptedMessage) => {
        if (err) {
          onlykey_api_pgp.emit("error", err);
          return;
        }
        if (Decrypt_Only) {
          onlykey_api_pgp.emit("status", "Done :) Click here to copy message");
        }
        else {
          var recipient_public_key;
          var ds = null;
          ds = decryptedMessage[0].get_data_signer();
          if (ds == null) {
            onlykey_api_pgp.emit("status", "Done :) Message has no signature, Click here to copy message");
          }
          else {
            console.log(ds);
            if (ds) { recipient_public_key = ds.get_key_manager(); }
            if (recipient_public_key) {
              console.log("Signed by PGP Key");
              var keyid = recipient_public_key.get_pgp_fingerprint().toString('hex').toUpperCase();
              keyid = keyid.slice(24, 40);
              var userid = recipient_public_key.userids[0].components.email.split("@")[0];
              console.log(keyid);
              console.log(userid);
              onlykey_api_pgp.emit("status", "Done :) Signed by " + userid + " (Key ID: " + keyid + "), Click here to copy message");
            }
          }
        }
        console.info(decryptedMessage);
        // messagebox.value = ct;
        // messagebox.focus();
        // messagebox.select();
        onlykey_api_pgp.emit("done");
        callback(decryptedMessage);
        resolve(decryptedMessage);
      });
    });
  }

  function decryptFile(key, ct, callback) {
    return new Promise(async(resolve) => {
      var txt = "";
      if ('files' in ct) {
        var file = ct.files[0];
        if (!file.size) {
          onlykey_api_pgp.emit("error", "No files selected :(");
          return;
        }
        else {
          if ('name' in file) {
            txt += "file name: " + file.name;
          }
          if ('size' in file) {
            txt += " file size: " + file.size;
          }
          if ('type' in file) {
            txt += " file type: " + file.type;
          }
        }
      }
      else {
        onlykey_api_pgp.emit("error", "No files selected :(");
        return;
      }

      var reader = new FileReader();
      reader.filename = file.name;
      var filename = reader.filename;
      filename = filename.slice(0, filename.length - 4);
      reader.readAsArrayBuffer(file);
      var parsedfile = await myreaderload(reader);

      console.info(usevirtru);
      console.info(typeof usevirtru);

      if (usevirtru != null) {
        try {
          await encryptOrDecryptFile(parsedfile, filename, false, false);
          return resolve();
        }
        catch (err) {
          console.error(err);
          alert('An error occurred attempting to encrypt this file. Please be sure you have authenticated, and try again.');
        }
        // button.classList.remove('working');
        onlykey_api_pgp.emit("working");
      }

      var buffer = kbpgp.Buffer.from(parsedfile);
      var keyStore = pgpkeyStore();
      switch (onlykeyApi._status) {
        case 'Decrypt and Verify':
          await keyStore.loadPublic(key);
          onlykey_api_pgp.emit("status", "Decrypting and verifying...");
          break;
        case 'Decrypt Only':
          onlykey_api_pgp.emit("status", "Decrypting...");
          var Decrypt_Only = true;
          break;
        default:
      }
      await keyStore.loadPrivate();
      kbpgp.unbox({
        keyfetch: keyStore.ring,
        raw: buffer,
        strict: Decrypt_Only ? false : true
      }, (err, ct) => {
        if (err) {
          onlykey_api_pgp.emit("error", err);
          return;
        }
        if (Decrypt_Only) {
          onlykey_api_pgp.emit("status", 'Done :)  downloading decrypted file ' + filename);
        }
        else {
          // var recipient_public_key;
          var ds = null;
          ds = ct[0].get_data_signer();
          if (ds == null) {
            onlykey_api_pgp.emit("status", 'Done :) file has no signature, downloading decrypted file ' + filename);
          }
          else {
            console.log(ds);
            var recipient_public_key;
            if (ds) { recipient_public_key = ds.get_key_manager(); }
            if (recipient_public_key) {
              console.log("Signed by PGP Key");
              var keyid = recipient_public_key.get_pgp_fingerprint().toString('hex').toUpperCase();
              keyid = keyid.slice(24, 40);
              var userid = recipient_public_key.userids[0].components.email.split("@")[0];
              console.log(keyid);
              console.log(userid);
              onlykey_api_pgp.emit("status", 'Done :) Signed by ' + userid + ' (Key ID: ' + keyid + '), downloading decrypted file ' + filename);
            }
          }
        }
        var finalfile = new Blob([ct[0].toBuffer()], { type: "text/plain;charset=utf-8" });
        //var finalfile2 = new Blob([result_buffer], {type: "octet/stream"});
        //new var blob = new Blob([xhr.response], {type: "octet/stream"});
        saveAs(finalfile, filename);
        onlykey_api_pgp.emit("done");
        callback();
        resolve();
      });

    });
  }

  onlykey_api_pgp.startEncryption = async function(to_pgpkeys, from_signer, message, file, callback) {
    onlykey_api_pgp.emit("working");
    onlykeyApi.poll_type = 4;
    console.info(onlykeyApi.poll_type);
    var r_inputs, keys;

    var sender_public_key, recipient_public_key;

    if (to_pgpkeys.value == "" && (onlykeyApi._status == 'Encrypt and Sign' || onlykeyApi._status == 'Encrypt Only')) {
      onlykey_api_pgp.emit("error", "I need recipient's public pgp key to encrypt :(");
      return;
    }
    if (from_signer.value == "" && (onlykeyApi._status == 'Encrypt and Sign' || onlykeyApi._status == 'Sign Only')) {
      onlykey_api_pgp.emit("error", "I need sender's public pgp key to sign :(");
      return;
    }
    if ( /*urlinputbox.value.slice(0,10) != '-----BEGIN' && */ onlykeyApi._status != 'Sign Only') { // Check if its a pasted public key
      //console.info(urlinputbox.value.slice(0,10));

      r_inputs = to_pgpkeys.split(",");
      keys = [];
      for (var i in r_inputs) {
        var jquery_data_input = false; //$(urlinputbox).data("data-" + r_inputs[i]);
        if (jquery_data_input) {
          keys.push(jquery_data_input);
        }
        else {
          if (r_inputs[i].slice(0, 10) == '-----BEGIN')
            keys.push(r_inputs[i]);
          else
            keys.push(await onlykeyApi.getKey(r_inputs[i]));
          //keys.push(await this.downloadPublicKey(r_inputs[i])); 
        }
      }
      sender_public_key = keys;
      //sender_public_key = await this.downloadPublicKey(urlinputbox.value);
      console.info("sender_public_key" + sender_public_key);
    }

    if (from_signer.slice(0, 10) != '-----BEGIN' && onlykeyApi._status != 'Encrypt Only') { // Check if its a pasted public key
      console.info(from_signer.slice(0, 10));
      recipient_public_key = await onlykeyApi.getKey(from_signer);
      console.info("recipient_public_key" + recipient_public_key);
    }
    else {
      recipient_public_key = from_signer;
    }
    if (message != null) await encryptText(sender_public_key, recipient_public_key, message, callback);
    else await encryptFile(sender_public_key, recipient_public_key, file, callback);
  };

  async function encryptText(key1, key2, msg, callback) {
    return new Promise(async(resolve) => {
      var keyStore = pgpkeyStore();
      var keyList = [];
      var params;
      switch (onlykeyApi._status) {
        case 'Encrypt and Sign':
          if (key1 instanceof Array) {
            for (var i in key1) {
              keyList.push(await keyStore.loadPublic(key1[i]));
            }
          }
          else {
            keyList.push(await keyStore.loadPublic(key1));
          }

          await keyStore.loadPublicSignerID(key2);
          params = {
            msg: msg,
            encrypt_for: keyList,
            sign_with: await keyStore.loadPrivate()
          };
          onlykey_api_pgp.emit("status", 'Encrypting and signing message ...');
          break;
        case 'Encrypt Only':
          if (key1 instanceof Array) {
            for (var i in key1) {
              keyList.push(await keyStore.loadPublic(key1[i]));
            }
          }
          else {
            keyList.push(await keyStore.loadPublic(key1));
          }
          params = {
            msg: msg,
            encrypt_for: keyList
          };
          onlykey_api_pgp.emit("status", 'Encrypting message ...');
          break;
        case 'Sign Only':
          await keyStore.loadPublicSignerID(key2);
          params = {
            msg: msg,
            sign_with: await keyStore.loadPrivate()
          };
          onlykey_api_pgp.emit("status", 'Signing message ...');
          break;
        default:
          break;
      }
      kbpgp.box(params, (err, results) => {
        if (err) {
          onlykey_api_pgp.emit("error", err);
          return;
        }
        if ((document.getElementById('onlykey_start').value) == 'Sign Only') {
          onlykey_api_pgp.emit("status", 'Done :)  Click here to copy message, then paste signed message into an email, IM, whatever.');
        }
        else {
          onlykey_api_pgp.emit("status", 'Done :)  Click here to copy message, then paste encrypted message into an email, IM, whatever.');
        }

        onlykeyApi._status = "finished";
        onlykey_api_pgp.emit("done");
        callback(results);
        return resolve();
      });
    });
  }

  async function encryptFile(key1, key2, f, callback) {


    //console.info(f);
    //console.info(f.files[0]);
    // todo process multiple files
    // await readfiles(infile);
    var zip = new JSZip();
    //var folderzip = zip.folder("files");
    var txt = "";
    if ('files' in f) {
      for (var i = 0; i < f.files.length; i++) {
        var file = f.files[i];
        if (!file.size) {
          onlykey_api_pgp.emit("error", "No files selected :(");
          return;
        }
        else {
          if ('name' in file) {
            txt += "file name: " + file.name;
            zip.file(file.name, file);
          }
          if ('size' in file) {
            txt += " file size: " + file.size;
          }
          if ('type' in file) {
            txt += " file type: " + file.type;
          }
        }
      }
    }
    else {
      onlykey_api_pgp.emit("error", "No files selected :(");
    }

    var firstfilename = f.files[0].name;
    var filename = document.getElementById('filename').value ? document.getElementById('filename').value : firstfilename;
    if (typeof f.files[1] !== "undefined") onlykey_api_pgp.emit("status", 'Processing files');
    else onlykey_api_pgp.emit("status", 'Processing ' + filename);
    document.getElementById('filedetails').innerHTML = txt;
    return new Promise(resolve => {
      zip.generateAsync({
          type: "uint8array",
          //compression: "STORE",
          compression: "DEFLATE",
          compressionOptions: {
            level: 1
          }
        })
        .then(async function(zip) {
          //console.log(zip);
          //console.log(kbpgp.Buffer.from(zip));
          var keyStore = pgpkeyStore();
          var params;
          var keyList = [];
          var sender_private_key;
          switch (onlykeyApi._status) {
            case 'Encrypt and Sign':
              if (key1 instanceof Array) {
                for (var i in key1) {
                  keyList.push(await keyStore.loadPublic(key1[i]));
                }
              }
              else {
                keyList.push(await keyStore.loadPublic(key1));
              }
              // loadPublic(key1);
              await keyStore.loadPublicSignerID(key2);
              sender_private_key = await keyStore.loadPrivate();
              params = {
                msg: kbpgp.Buffer.from(zip),
                encrypt_for: keyList,
                sign_with: sender_private_key
              };
              onlykey_api_pgp.emit("status", 'Encrypting and signing...');
              break;
            case 'Encrypt Only':
              if (key1 instanceof Array) {
                for (var i in key1) {
                  keyList.push(await keyStore.loadPublic(key1[i]));
                }
              }
              else {
                keyList.push(await keyStore.loadPublic(key1));
              }
              params = {
                msg: kbpgp.Buffer.from(zip),
                encrypt_for: keyList
              };
              onlykey_api_pgp.emit("status", 'Encrypting...');
              break;
            case 'Sign Only':
              await keyStore.loadPublicSignerID(key2);
              sender_private_key = await keyStore.loadPrivate();
              params = {
                msg: kbpgp.Buffer.from(zip),
                sign_with: sender_private_key
              };
              onlykey_api_pgp.emit("status", 'Signing...');
              break;
            default:
          }

          kbpgp.box(params, async function(err, result_string, result_buffer) {
            if (err) {
              onlykey_api_pgp.emit("error", err);
              return;
            }
            //console.log(result_string);
            //console.log(result_buffer);
            //console.log(filename);
            if ((document.getElementById('onlykey_start').value) == 'Sign Only')
              onlykey_api_pgp.emit("status", 'Done :)  downloading signed file ' + filename + '.zip.gpg');
            else
              onlykey_api_pgp.emit("status", 'Done :)  downloading encrypted file ' + filename + '.zip.gpg');
            onlykeyApi._status = "finished";
            if (usevirtru != null) {
              try {
                onlykey_api_pgp.emit("status", 'Done :)  downloading encrypted file ' + filename + '.tdf');
                await encryptOrDecryptFile(result_buffer, filename + ".zip.gpg", true, 1);
                return resolve();
              }
              catch (err) {
                console.error(err);
                onlykey_api_pgp.emit("status", 'An error occurred attempting to encrypt this file. Please be sure you have authenticated, and try again.');
              }
              onlykey_api_pgp.emit("done");
              callback();
            }
            else {
              var finalfile = new Blob([result_buffer], { type: "text/plain;charset=utf-8" });
              saveAs(finalfile, filename + ".zip.gpg");
              onlykey_api_pgp.emit("done");
              callback();
              return resolve();
            }
          });
        });
    });
  }


  onlykey_api_pgp.keyStore = pgpkeyStore;

  function pgpkeyStore() {
    var keyStore = {};

    keyStore.ring = new kbpgp.keyring.KeyRing;

    // var sender_public_key;
    // var recipient_public_key;
    // var sender_private_key;

    keyStore.loadPublic = function loadPublic(key) {
      return new Promise(async function(resolve) {
        onlykey_api_pgp.emit("status", "Checking recipient's public key...");
        if (key == "") {
          onlykey_api_pgp.emit("error", "I need recipient's public pgp key :(");
          return;
        }

        kbpgp.KeyManager.import_from_armored_pgp({
          armored: key
        }, (error, recipient) => {
          if (error) {
            onlykey_api_pgp.emit("error", error);
            return;
          }
          else {
            resolve(recipient);
            keyStore.ring.add_key_manager(recipient);
          }
        });
      });
    };

    keyStore.loadPublicSignerID = function loadPublicSignerID(key) {

      return new Promise(async function(resolve) {
        onlykey_api_pgp.emit("status", "Checking sender's public key...");
        if (key == "") {
          onlykey_api_pgp.emit("error", "I need sender's public pgp key :(");
          return;
        }
        kbpgp.KeyManager.import_from_armored_pgp({
          armored: key
        }, (error, sender) => {
          if (error) {
            onlykey_api_pgp.emit("error", error);
            return;
          }
          else {
            var subkey;
            var keyids = sender.get_all_pgp_key_ids();
            if (typeof keyids[2] !== "undefined") {
              onlykeyApi.poll_delay = 1; //Assuming RSA 2048
              subkey = 2;
            }
            else {
              onlykeyApi.poll_delay = 8; //Assuming RSA 4096 or 3072
              subkey = 0;
            }
            onlykeyApi.custom_keyid = keyids[subkey].toString('hex').toUpperCase();
            onlykeyApi.custom_keyid = onlykeyApi.custom_keyid.match(/.{2}/g).map(hexStrToDec);
            console.info("onlykeyApi.custom_keyid" + onlykeyApi.custom_keyid);
            resolve(onlykeyApi.custom_keyid);
          }
        });
      });
    };

    keyStore.loadPrivate = function loadPrivate() {
      return new Promise(async function(resolve) {
        kbpgp.KeyManager.import_from_armored_pgp({
          armored: onlykey_api_pgp.test_pgp_key()
        }, (err, sender) => {
          if (err) {
            onlykey_api_pgp.emit("error", err);
            return;
          }

          if (sender.is_pgp_locked()) {
            let passphrase = 'test123';

            sender.unlock_pgp({
              passphrase: passphrase
            }, err => {
              if (!err) {
                console.log(`Loaded test private key using passphrase ${passphrase}`);
                keyStore.ring.add_key_manager(sender);
                resolve(sender);
              }
            });
          }
          else {
            console.log("Loaded test private key w/o passphrase");
            resolve(sender);
          }
        });
      });
    };

    return keyStore;
  };

  onlykey_api_pgp.test_pgp_key = function test_pgp_key() {
    return `-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: TEST KEY v1.0.0
Comment: THIS KEY IS JUST A PLACEHOLDER

xcaGBFms0QoBEAC9hQ0tnhwnSYlLQmVTsvVWyYnnS8woQnLLr0gz9gb2ZSxE
gh7SMQewx5xff7zsxhcRoID00tarP4KueEOx2sPwFFgbK5jhN1UDEA0zG3oA
/bkEet6c7Q4Y25wlp0eYRpW2KIEdVH9uzNyUS7S5Phw8QtvxWLI+rudmhrNk
Pvjm4c7kPT1TpfCYDMQmF7RVSaXYDH6vE/gqLKjiD/71LQZmQzDtLkvC2fh4
frBhdZUVHmIuZaDZ/8QtcslODovqAe6stBtCsgZ1lEx8otbTpt88PIYbPNGi
kiHrbjK3CYusoq1Rl4/LN/jFkJnO9J8KpfA5R+lnQ6GfzacQ3BfpkQ7Ib2Tu
NSwHOe5nSGIpbsujWh6GAmRzo+AOHmbUj6gbuaA8qIdD+VDXNh/O4g26be+l
RO12pz6VOCk2W+Gmvwmbk789atmNOIk0eUeJ/jPFyXVqM5DMfHuBssydqQr8
9EoQo+id2ev8glfmx1kT7oiN5d/WCpEq4SSxf7TxNawqIEK5LAgv6dONd8e0
GsTxibRVxqrTDc8q07dIgXU4nybCBHRrcd1gj785uJcSsuSSB5TnRRmcst+q
BsunUZbM8iw9g8OUqZj2k70utgIaP5kIIFhMgne9iLYd/g47pMLdoAWcQXdL
pwcHfB3jF8ukuQCpHg1FaKP8oU1jO6Yrk9FHwwARAQAB/gkDCHD+rb/6JEKx
YOw4tTZ1yyHEQRjSoFuwx2vsi1T96TTF4JlTvncVkaFsbvYrTdybEUjc8e6a
UuKDZoMKzr3VBJXbXXhtZLZlWhd+LWN4bFixn9wifoGHN9ptNzobMo3dibjA
cMkNB6ocxWrlbvq44WNYXPezFIloSzf6vb2puZjVcd1nJSLxHY5HaykTdqwi
2TCQhOTa3EBwlQpNNgUdetA3erf22r+FesfYSVjUt8bO6b7jwaXHUAg0RU9D
SCLPCrAqz4WY9RUxziMiUY531LeKffpALwoA8Qwt9F4i03ecrBw7XKbHvL9O
KRcg+3HUNxT9+3P3v4r3Vyqa80g2iYfiA/yd5f6wKWiYbuhaHiHnFljnPqjr
ufSB1hWJoQVfK7Lau/PIZQqZ3vpo3xQJkG7QyYF5hM5ZKlFd9vqxUQhn2mI4
zC1aOhg/CDLvatspb2J9JxH457YxWsXK4garUl0g6EYTdSZRalLfQ1EHpvzM
jSwwFN8d+UgaqO/X/I3G4oHfnaNRY4YdpIpAZZ1JvKS7v2O/r5ct46bVKQUg
TKffG+4QI/g9sizhmBzOTFWO2i8wdu5gvVxvl7dnPrgxyPBlZK9lryBW2++l
YsjQ41TxPmdzZGfzE3MPvQZ+Sni5QXA3icKDWzEcp8Zd8KukVyvKnVJiMM5F
mpvtcQbhnphpiFFt9aEPO1soid02lNG3qlO97EpS1KExZOW95hF9u2F2q9p/
0BTcahyxjoE1oinakjg/BEqcF8TgaEmpTtDYoljz87vpRyEHKAOl3IXyiubB
WMyZfraF6hZ3mRGKofOX8A7hdqFx1j/6myzywf1JsRSa6u8Dp4m38mDKKhcf
ERqDcVWuJafZBWOXPcdxIVBDmopTn7uM8Ii0wEYWBFqgf6dN2p6BprDcm2Om
qiqhDE3UoqjQXgHqh7Bn8AjpfqSkXFRsrkOhcbyqzYGt+kEbnFPFP1QhyWSj
60p7eMxW7bG6rJcyOWvq5GZaaVime3+sXTV37vYzuNWc0RQ3FklKbiLvVCjL
NHbWOUtQpHE/i39UUK31/Rncqzgoenn6ThqXZZZl+LP8FFIOZ80VnlSxM71U
d7XRqk1wjFE7NBzbtTypaDXbm3Wilq9SJ68kfOxZUC9asAvU5B1teiVshFA2
QmMTCz0hng8/HldlntUOVQjmh/gC5E52cva6QF0Cu8JKfVGoAC5wEIuV3gVx
Zu+IVEtHWpCA8bOudtYx4QZvKVCbjSaK6Rf1UE+cUfLESCnXt9BHzcPq0q90
WVMXNVSS0CQ84FCk3zAZgnrZBmOFuiXvXXqrpS8w2k8LFiP5or4ZCYTc0qUp
pSFk8QBnfdX63IXifBQtuaD1Iz49Lf2Vpfxv+F/qXaPQ6Bl3bfv1QY9nNh48
+OVZBpnMas8W4co/Ke7GiOJKqScpcW/MlaKZVLR2ywthC4vpTjFBiK3epLOF
J63bR/0TV5Koj62CdyVENtecbfWce5yx9s5AAdKDoA3Q18mMm13OJb868Nu0
O2ZlAXb/3PMWp8zS6zd6gP8Aw8q1a+NlZVtyFA7aaBEQyRbHMG/Qeyy6wmlE
nP/rfuWVuPLmSD7GsS6TkofmLsk/fuWbuAFBnYuoWM+XrRwWX0SOmZJzYELV
shnhPaTO+71B4vsCbuQVfNcMYBmpt7iAG23Ky1FNnKy8jszwq4S2XPRukT0+
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
=ayNx
-----END PGP PRIVATE KEY BLOCK-----`;
  }

  function hexStrToDec(hexStr) {
    return ~~(new Number('0x' + hexStr).toString(10));
  }

  async function myreaderload(reader) {
    return new Promise(resolve => {
      reader.onloadend = function() {
        return resolve(reader.result);
      };
    });
  }

  onlykey_api_pgp.getMessageKeyIds = function(message,callback) {
    var ring = new kbpgp2.keyring.KeyRing;
    kbpgp2.unbox({
      keyfetch: ring,
      armored: message
    }, function(err, literals) {
      var keyids;
      err = err.message.toString();
      if (err.indexOf("key not found: ") == 0) {
        err = err.replace("key not found: ", "");
        try { keyids = JSON.parse(err); }
        catch (e) {}
      }
      callback(keyids);
    });
  };
  
  onlykey_api_pgp.getPublicKeyIds = function(public_key,callback) {
    kbpgp2.KeyManager.import_from_armored_pgp({
          armored: public_key
        }, (error, keyObj) => {
          if (error) {
            return;
          }
          else {
            callback(keyObj.pgp.get_all_key_ids());
          }
        });
  };
  
  onlykey_api_pgp.getPublicKeyInfo  = function(public_key,callback) {
    kbpgp2.KeyManager.import_from_armored_pgp({
          armored: public_key
        }, (error, keyObj) => {
          if (error) {
            return;
          }
          else {
            callback(keyObj);
          }
        });
  };

  return onlykey_api_pgp;
};
