module.exports = {
    consumes: ["app", "console", "window"],
    provides: ["onlykeyApi", "kbpgp", "forge", "nacl", "pgpDecoder", "onlykey3rd"],
    setup: function(options, imports, register) {
        
        Uint8Array.prototype.toHexString = function(){
            var ret = []; 
            this.map(function(c){return ret.push(c.toString(16).toUpperCase())})
            return ret.join(" ");
        }

        imports.kbpgp = require('./onlykey/kbpgp-2.1.0.ok.ecc.js');
        imports.nacl = require('./onlykey/nacl.min.js');
        imports.forge = require('./onlykey/forge.min.js');
        imports.pgpDecoder = require('./onlykey/pgp-decoder/pgp.decoder.js');

        const onlykeyApi = require('./onlykey/onlykey-api.js')(imports);
        const onlykeyPGP = require('./onlykey/onlykey-pgp.js')(imports);
        const onlykey3rd = require('./onlykey/onlykey-3rd-party.js')(imports, onlykeyApi);

        const request = require('superagent');
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
            onlykeyApi: {
                api: onlykeyApi,
                pgp: function(use_virtue) {
                    return onlykeyPGP(onlykeyApi, use_virtue);
                },
                onlykey3rd: onlykey3rd,
            },
            onlykey3rd: onlykey3rd,
            kbpgp: imports.kbpgp(false,imports.console),
            forge: imports.forge,
            nacl: imports.nacl,
            pgpDecoder: imports.pgpDecoder
        });


    }
};