const url = require('url');
const kbpgp = require('kbpgp');
const request = require('superagent');
const randomColor = require('randomcolor');

const urlinputbox = document.getElementById('pgpkeyurl');
const messagebox = document.getElementById('message');
const decryptbutton = document.getElementById('btndecrypt');

class Pgp2go {
    constructor() {
        document.getElementsByTagName('fieldset')[0].style.backgroundColor = randomColor({
            luminosity: 'bright',
            format: 'rgba'
        });
    }


	startDecryption() {
			decryptbutton.classList.remove('error');
			decryptbutton.classList.add('working');
			if (urlinputbox.value == "") {
				this.showError(new Error('I need a private pgp key :('));
				return;
			}
        let keyurl = url.parse(urlinputbox.value);
        if (keyurl.hostname) { // Check if its a url
            this.downloadPublicKey();
        } else {
            this.decryptText(urlinputbox.value, messagebox.value);
        }
	}

	decryptText(priv, ct) {
      var keyRing = new kbpgp.keyring.KeyRing;
      var tmpKeyRing = keyRing;
      var _this = this;
      decryptbutton.textContent = "Checking key ...", kbpgp.KeyManager.import_from_armored_pgp({
          armored: priv
      }, (err, user) => {
          if (err)
              return void _this.showError2(err);

          if (user.is_pgp_locked()) {
              let passphrase = 'test';

              user.unlock_pgp({
                  passphrase: passphrase
              }, err => {
                  if (!err) {
                      console.log(`Loaded private key using passphrase ${passphrase}`);
                      tmpKeyRing.add_key_manager(user);
                      decryptbutton.textContent = "Decrypting message ...";
                      kbpgp.unbox({
                          keyfetch: tmpKeyRing,
                          armored: ct
                      }, (err, ct) => {
                          if (err)
                              return void _this.showError2(err);

                          decryptbutton.textContent = "Done :)";
                          messagebox.value = ct;
                          messagebox.focus();
                          messagebox.select();
                          decryptbutton.classList.remove("working")
                      });
                  }
              });
          } else {
              console.log("Loaded private key w/o passphrase");
          }
      });
  }

	showError2(error) {
        decryptbutton.textContent = error.message;
        decryptbutton.classList.remove('working');
        decryptbutton.classList.add('error');
    }
}

let p2g = new Pgp2go();


decryptbutton.onclick = function () {
    p2g.startDecryption();
    return false;
};

urlinputbox.onkeyup = function () {
    let rows_current = Math.trunc((urlinputbox.value.length * parseFloat(window.getComputedStyle(urlinputbox, null).getPropertyValue('font-size'))) / (urlinputbox.offsetWidth * 1.5)) + 1;
    urlinputbox.rows = (rows_current > 10) ? 10 : rows_current;
};
