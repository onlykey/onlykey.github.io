var pgpkeybox = document.getElementById('pgpkeyurl');
var messagebox = document.getElementById('message');
var encryptbutton = document.getElementById('btnencrypt');

encryptbutton.onclick = function () {
    //TODO: Decrypt using private key
    console.log("Decrypt Button Clicked!");
    if(pgpkeybox.value == "" || messagebox.value == ""){
        console.log("Error, please fill out both input fields.");
        return false;
    }
    options = {
        message: openpgp.message.readArmored(messagebox.value),// parse armored message
        privateKey: openpgp.key.readArmored(pgpkeybox.value).keys[0] // pgp private key
    };
    console.log("Start decryption ...");
    openpgp.decrypt(options).then(function(plaintext) {
        console.log("Decrypted !");
        messagebox.value = plaintext.data;
    });
    return false;
};

pgpkeybox.onkeyup = function () {
    let rows_current = Math.trunc((pgpkeybox.value.length * parseFloat(window.getComputedStyle(pgpkeybox, null).getPropertyValue('font-size'))) / (pgpkeybox.offsetWidth * 1.5)) + 1;
    pgpkeybox.rows = (rows_current > 10) ? 10 : rows_current;
};