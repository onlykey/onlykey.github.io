# SYNOPSIS 
[![NPM Package](https://img.shields.io/npm/v/node-webcrypto-shim.svg?style=flat-square)](https://www.npmjs.org/package/node-webcrypto-shim)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)  

This is a simple [webcrypto](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) shim for node.js that fallsback to native webcrypto when browserified. It is based off of [node-webcrypto-ossl](https://www.npmjs.com/package/node-webcrypto-ossl).

# INSTALL
`npm install node-webcrypto-shim`

# USAGE

```javascript
const crypto = require('node-webcrypto-shim')
```

# LICENSE
[MPL-2.0](https://tldrlegal.com/license/mozilla-public-license-2.0-(mpl-2))
