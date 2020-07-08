const WebCrypto = require('node-webcrypto-ossl')

const webcrypto = new WebCrypto({
  directory: `${process.env.HOME}/.webcrypto/keys`
})

module.exports = webcrypto
