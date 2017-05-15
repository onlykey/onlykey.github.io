### Serverless OnlyKey test site

https://apps.crp.to

### Protocol

The protocol outlined below utilizes existing communication channel via U2F. More
information is available on U2F protocol [here](https://fidoalliance.org/specs/fido-u2f-v1.0-nfc-bt-amendment-20150514/fido-u2f-raw-message-formats.html).

```
┌──────────────┐                                                   ┌─────────┐
│ APPLICATION  │                                                   │ OnlyKey │
└──────────────┘                                                   └─────────┘

1. Registration Request Message: enroll_timeset()
Encode *timestamp in U2F challenge field
DESCRIPTION: Set the current time on OnlyKey and start communication.
┌──────────────────┬──────────────────┬──────────────────┐
│    challenge     │       appId      │      version     │  
│    *timestamp    │       crp.to     │      U2F_V2      │  
│    (32 bytes)    │     (32 bytes)   │     (4 bytes)    │
└──────────────────┴──────────────────┴──────────────────┘
───────────────────────────────────────────────────────────────────────────▶

2. Registration Response Message: process_custom_response(response)
Encode *X25519 Public Key (for ECDH) and a *Random Number generated via OnlyKey TRNG
DESCRIPTION: Send public key to encrypt future messages, and random for use in generating app private key.
┌─────────────────┬────────────────┬─────────────────┬───────────────────┐
│   Public Key    │   Key Handle   │   Certificate   │     Signature     │
│ *OnlyKey Public │ *Random Number │     <Empty>     │      <Empty>      │
│   (65 bytes)    │   (64 bytes)   │ (Variable Size) │    (64 bytes)     │
└─────────────────┴────────────────┴─────────────────┴───────────────────┘
◀───────────────────────────────────────────────────────────────────────────

3. Authentication Request Message: auth_getpub(), auth_decrypt(), auth_sign()
Encode a packet in U2F Key Handle field to get a public key, decrypt message, or sign message
DESCRIPTION: Packet is encrypted with key derived from ECDH shared secret
┌──────────────────┬──────────────────┬──────────────────┐
│    challenge     │       appId      │    Key Handle    │  
│   *App Public    │      crp.to      │     *packet      │  
│    (32 bytes)    │     (32 bytes)   │    (64 bytes)    │
└──────────────────┴──────────────────┴──────────────────┘
───────────────────────────────────────────────────────────────────────────▶

4.  Authentication Response Message: verify_auth_response(response)
Error type 1 (OTHER_ERROR) used as an ACK,
DESCRIPTION: Acknowledge message received. Any other error code indicates failure.
┌─────────────────┐
│  Error Message  │      
│       *ACK      │   
│     (1 byte)    │   
└─────────────────┘
◀───────────────────────────────────────────────────────────────────────────


At this point the app sends multiple Authentication Request Messages packets until the OnlyKey has
the full message. Once full message is received both the App and the OnlyKey generate a hash of
the message that is used to generate a 3 digit code. The OnlyKey light flashes continuously
and the app prompts the user to enter the 3 digit code to authorize the signing / decrypting of
that message. This ensures that user presence is required to sign / decrypt and that the authorization applies
to a specific plaintext, not a spoofed message.

Once the 3 digit code is entered, the decryption / signing is completed and the result is stored on the OnlyKey
until it is polled for the message.


5.  Encode *polling in U2F challenge field, this message polls OnlyKey for a response to previous decrypt/sign request.
┌──────────────────┬──────────────────┬──────────────────┐
│    challenge     │       appId      │      version     │  
│     *polling     │       crp.to     │      U2F_V2      │  
│    (32 bytes)    │     (32 bytes)   │     (4 bytes)    │
└──────────────────┴──────────────────┴──────────────────┘
───────────────────────────────────────────────────────────────────────────▶

6. Registration Response Message: process_custom_response(response)
Encode *data which is encrypted with key derived from ECDH shared secret
┌─────────────────┬────────────────┬─────────────────┬───────────────────┐
│   Public Key    │   Key Handle   │   Certificate   │     Signature     │
│ *OnlyKey Public │ *Random Number │     *data       │      <Empty>      │
│   (65 bytes)    │   (64 bytes)   │ (Variable Size) │    (64 bytes)     │
└─────────────────┴────────────────┴─────────────────┴───────────────────┘
◀───────────────────────────────────────────────────────────────────────────

Application receives the data which is decrypted using same key derived from ECDH shared secret.

```

### Security Objectives

1) Serverless - All processing done via javascript in users own browser (nothing on server to hack).

2) No logins required / No data retention - Retain no metadata, or other tracking information.

3) Double Encryption - All potentially sensitive data should be sent via HTTPS but also end-to-end encrypted using AES/ECDH shared secret.

### License


Thanks to Ron Garret for originally posting a serverless implementation of U2F here - https://github.com/rongarret/u2f-test

The MIT License (MIT)
Copyright (c) 2017 by Ron Garret

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
