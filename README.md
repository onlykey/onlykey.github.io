![OnlyKey WebCrypt](logo-with-text.png)
========

## About

WebCrypt is a serverless Web App that integrates with [OnlyKey](https://crp.to/p/) and [keybase.io](https://keybase.io/) to provide PGP encryption everywhere on-the-go.

Supports Google Chrome and Firefox!

**Still in early development available for testing only.**

[Try it out here!](https://apps.crp.to/encrypt-test)

## How it works

With Keybase user/key management is made easy and with OnlyKey private keys remain offline and protected. Private keys are not accessible to the browser or even the local computer. By using U2F as a secure communication channel the web application can send messages to OnlyKey that are decrypted and signed offline. This provides similar function to a token/smart card but no drivers or software required. All that is needed is a browser that supports U2F and an OnlyKey to send secure messages using Windows, Mac, Linux, Chromebook, and Android (with additional Android app coming soon).

## Setup

**Before using this app you must follow these instructions to generate PGP keys and load them on OnlyKey:**
- [Generate keys](https://docs.crp.to/usersguide.html#generating-keys) using Keybase
- [Load keys](https://docs.crp.to/usersguide.html#loading-keys) onto OnlyKey

If using Firefox, U2F must be enabled by completing the following steps in your browser:

- Type about:config into the Firefox browser.
- Search for “u2f”.
- Double click on security.webauth.u2f to enable U2F support.

## Sending secure messages

To create encrypted PGP message just:
- Browse to https://apps.crp.to/encrypt-test
- Enter the recipient's Keybase ID in the first box
- Enter your Keybase ID (for the key you loaded onto OnlyKey) in the second box
- Enter your secure message in the third box
- Click "Encrypt and Sign"
- When prompted enter the challenge code onto the OnlyKey

The encrypted message will be displayed and you can paste it into an email, IM, app or pretty much anything.

*Alternatively, if you don't want to use Keybase you can paste a public key instead as shown in the animation below:*

![Securely encrypt messages anywhere with OnlyKey WebCrypt](https://raw.githubusercontent.com/onlykey/onlykey.github.io/master/encrypt.gif)

## Receiving secure messages

To decrypt PGP message just:
- Browse to https://apps.crp.to/decrypt-test
- Enter your Keybase ID (for the key you loaded onto OnlyKey) in the first box
- Paste your encrypted PGP message in the second box
- Click "Decrypt and Verify"
- When prompted enter the challenge code onto the OnlyKey

The decrypted message will be displayed. Read it and then close the browser tab and there will be no trace of the decrypted message.

![Securely decrypt messages anywhere with OnlyKey WebCrypt](https://raw.githubusercontent.com/onlykey/onlykey.github.io/master/decrypt.gif)

## Security Goals

**Empower the people**: Give people the ability to securely send and receive messages using any computer with no complicated software/drivers required and no worrying about compromise of user's private identity.

**Serverless**: All processing done via javascript in users own browser locally (no server to hack).

**Private**: No logins required. No data retention. No tracking!!! No emails. No ads. No demographics. Retain no metadata, or other tracking information.

**Strong crypto** - Everything should be sent via HTTPS to/from the web application. Data between local browser and OnlyKey should be encrypted using AES/ECDH shared secret (NaCl + AES-256-GCM). This means on the local computer data is end-to-end encrypted and even if a malicious applications were to intercept communication it would be encrypted and unreadable without the key.

**Phishing prevention** - The OnlyKey currently only works with apps.crp.to. Other domains are ignored, domains are enforced by origin.

**Open source & audit-able** - What you see is what you get this repository is a Github page hosted directly on Github.

Please, feel free to commit fixes!

## Protocol

The protocol outlined below utilizes existing communication channel via U2F. More information is available on U2F protocol [here](https://fidoalliance.org/specs/fido-u2f-v1.0-nfc-bt-amendment-20150514/fido-u2f-raw-message-formats.html).

### Communication Channel Overview (Advanced)

U2F utilizes registration and authentication message types. To send data to the OnlyKey, messages are encoded in the Key Handle of the authentication message type. To receive data back, messages are encoded in the signature of the authentication response. This method provides a reliable form of communication that is supported anywhere U2F is supported including Chrome, Chromium, Opera, and Firefox (Quantum or w/plugin).

The outline below visualizes the use of onlykey-api.js and u2f-api.js to communicate via browser to OnlyKey over USB.

```
┌──────────────┐                                                   ┌─────────┐
│ APPLICATION  │                                                   │ OnlyKey │
└──────────────┘                                                   └─────────┘

INITIALIZE - SET TIME, SET APP PUBLIC NaCl KEY, GET ONLYKEY PUBLIC NaCl KEY, GET FIRMWARE VERSION

1. Authentication Request Message:

Encode a *packet in U2F Key Handle field that contains current epoch time and application public key.
┌──────────────────┬──────────────────┬──────────────────┐
│    challenge     │       appId      │    Key Handle    │  
│      random      │      crp.to      │     *packet      │  
│    (32 bytes)    │     (32 bytes)   │    (64 bytes)    │
└──────────────────┴──────────────────┴──────────────────┘
───────────────────────────────────────────────────────────────────────────▶

2. Authentication Response Message:

Decode a *packet with OnlyKey public key, OnlyKey firmware version, and unused space filled with hardware
generated entropy (entropy not currently used but may be used for future secure key generation operations).
┌──────────────────┬─────────────────┬──────────────────┐
│   User Presence  │     Counter     │     Signature    │  
│                  │                 │     *packet      │  
│     (1 byte)     │    (4 bytes)    │    (64 bytes)    │
└──────────────────┴─────────────────┴──────────────────┘
◀───────────────────────────────────────────────────────────────────────────

DECRYPTION/SIGNING REQUEST - DECRYPT OR SIGN DATA USING RSA PRIVATE KEY

1. Authentication Request Message:

First, generate ECDH shared secret from OnlyKey's provided public key and application
generated public key. AES-GCM key is derived from SHA256 hash of shared secret (32 bytes). Encrypt and decrypt
all future packets with this key and IV set to an incrementing counter.

Encode encrypted *packet in U2F Key Handle field one chunk at a time (64 bytes).
Repeat for each chunk of data. Once finished sending data ping messages continue to be sent in
order to get response or error codes.
┌──────────────────┬──────────────────┬───────────────────┐
│    challenge     │       appId      │     Key Handle    │  
│      random      │      crp.to      │      *packet      │  
│    (32 bytes)    │     (32 bytes)   │     (64 bytes)    │
└──────────────────┴──────────────────┴───────────────────┘
───────────────────────────────────────────────────────────────────────────▶

2.  Authentication Response Message:

Once full message is received both the App and the OnlyKey generate a hash of
the message that is used to generate a 3 digit challenge code. The OnlyKey light flashes continuously
and the app prompts the user to enter the 3 digit code to authorize the signing / decrypting of
that message. This ensures that user presence is required to sign / decrypt and that the authorization
applies to a specific plaintext, not a spoofed message. For increased security future versions may permit
a longer challenge code.

While waiting for the challenge code to be entered a ping is used to check status. If no status is returned (TIMEOUT) the app polls for the response.

Error/status codes:
- Error 0 ping reply, ack
- Error 1 incorrect challenge code entered
- Error 2 key type not set as signature/decrypt
- Error 3 no key set in this slot
- Error 4 invalid key, key check failed
- Error 5 invalid data, or data does not match key
- Error 6 no data ready
- Error code type 5 (TIMEOUT), ping failed, correct challenge code entered

Once the challenge code is entered correctly, the decryption / signing is completed and the result is stored on the
OnlyKey until polling occurs (After 5 seconds unretrieved messages are automatically wiped from OnlyKey).

┌──────────────────┬─────────────────┬────────────────────────┐
│   User Presence  │     Counter     │        Signature       │  
│                  │                 │        *packet         │  
│     (1 byte)     │    (4 bytes)    │     (Variable Size)    │
└──────────────────┴─────────────────┴────────────────────────┘
◀───────────────────────────────────────────────────────────────────────────

```

## Licenses

Thanks to http://tilomitra.github.io/prettypages/

Copyright 2012 Yahoo! Inc. All rights reserved. Licensed under the BSD License. http://yuilibrary.com/license/

Thanks to Ron Garret for originally posting a serverless implementation of U2F here - https://github.com/rongarret/u2f-test

The MIT License (MIT)
Copyright (c) 2017 CryptoTrust LLC.

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

## Cryptography Notice

This distribution includes cryptographic software. The country in which you currently reside may have restrictions on the import, possession, use, and/or re-export to another country, of encryption software.
BEFORE using any encryption software, please check your country's laws, regulations and policies concerning the import, possession, or use, and re-export of encryption software, to see if this is permitted.
See <http://www.wassenaar.org/> for more information.

The U.S. Government Department of Commerce, Bureau of Industry and Security (BIS), has classified this software as Export Commodity Control Number (ECCN) 5D002.C.1, which includes information security software using or performing cryptographic functions with asymmetric algorithms.
The form and manner of this distribution makes it eligible for export under the License Exception ENC Technology Software Unrestricted (TSU) exception (see the BIS Export Administration Regulations, Section 740.13) for both object code and source code.

The following cryptographic software is included in this distribution:

   "Fast Elliptic Curve Cryptography in plain javascript" - https://github.com/indutny/elliptic
   "RFC4880 Implementation in IcedCoffeeScript" - https://github.com/keybase/kbpgp

For more information on export restrictions see: http://www.apache.org/licenses/exports/

## Source

[OnlyKey WebCrypt on Github](https://github.com/onlykey/onlykey.github.io)
