module.exports = {
    consumes: ["app", "console"],
    provides: ["onlykeyApi", "onlykeyPGP", "onlykey3rd", "kbpgp", "forge", "nacl"],
    setup: function(options, imports, register) {

        var Gun = imports.Gun;
        const request = require('superagent');

        const onlykeyApi = require('./onlykey-api.js')(imports);
        const onlykeyPGP = require('./onlykey-pgp.js')(imports);
        const onlykey3rd = require('./onlykey-3rd-party.js')(imports);
        const kbpgp = require('./kbpgp-2.1.0.js');
        const nacl = require('./nacl.min.js');
        const forge = require('./forge.min.js');

        var getKey = function getKey(url, statusFn_force) {
            var statusFn, force;
            if (typeof statusFn_force == "string")
                force = statusFn_force;

            if (!url) return new Promise(resolve => { resolve(false) });

            //pgp key 
            if (url.slice(0, 10) == '-----BEGIN')
                return new Promise(resolve => {
                    if (statusFn) statusFn('Loaded public key (input) ...');
                    resolve(url);
                });

            if (force) {
                switch (force) {
                    case 'protonmail':
                        return protonmail();
                    case 'keybase':
                        return protonmail();
                    case 'secure':
                        return secure();
                    default:
                        break;
                }
            }


            if (url.slice(0, 8) == 'https://') return secure();
            if (!(url.indexOf("@") == -1)) return protonmail();
            return keybase();

            //direct url
            function secure() {
                return new Promise(resolve => {
                    if (statusFn) statusFn('Downloading public key (https-url) ...');
                    request
                        .get(url)
                        .end((err, key) => {
                            if (err) {
                                resolve(false);
                                //err.message += ' Try to directly paste the public PGP key in.';
                                //this.showError(err);
                                return;
                            }
                            resolve(key.text);
                            return key.text;
                        });
                });
            }
            //protonmail 
            function protonmail() {
                return new Promise(resolve => {
                    if (statusFn) statusFn('Downloading public key (protonmail) ...');
                    url = 'https://onlykey.herokuapp.com/protonmail/get/' + url;
                    request
                        .get(url)
                        .set("Content-Type", "text/plain")
                        .end((err, key) => {
                            if (err) {
                                resolve(false);
                                //err.message += ' Try to directly paste the public PGP key in.';
                                //this.showError(err);
                                return;
                            }
                            resolve(key.text);
                            return key.text;
                        });
                });
            }
            //keybase  or url
            function keybase() {
                return new Promise(resolve => {
                    //button.textContent = 'Downloading public key ...';
                    if (statusFn) statusFn('Downloading public key (keybase) ...');
                    url = 'https://keybase.io/'.concat(url, '/pgp_keys.asc');
                    request
                        .get(url)
                        .end((err, key) => {
                            if (err) {
                                resolve(false);
                                //err.message += ' Try to directly paste the public PGP key in.';
                                //this.showError(err);
                                return;
                            }
                            resolve(key.text);
                            return key.text;
                        });
                });
            }
        };
        onlykeyApi.getKey = getKey;
        
        register(null, {
            onlykeyApi: onlykeyApi,
            onlykeyPGP: function(use_virtue) {
                return onlykeyPGP(onlykeyApi, use_virtue);
            },
            onlykey3rd: onlykey3rd,
            kbpgp: kbpgp,
            forge: forge,
            nacl: nacl,
            getKey:getKey
        });


    }
};