![OnlyKey WebCrypt](https://raw.githubusercontent.com/onlykey/onlykey.github.io/master/logo-with-text.png)
========

## About

WebCrypt is a serverless Web App that integrates with [OnlyKey](https://onlykey.io) and [keybase.io](https://keybase.io/) to provide PGP encryption everywhere on-the-go.

Supports Firefox, Google Chrome, Brave, and Edge (new) browsers!

Supports macOS, Windows, Linux, Chrome OS, and Android!

[Try it out here!](https://apps.crp.to/encrypt)

## How it works

With Keybase user/key management is made easy and with OnlyKey private keys remain securely offline. Private keys are not accessible to the browser or even the local computer. By using FIDO2 as a secure communication channel the web application can send messages to OnlyKey that are decrypted and signed offline. This provides similar function to a token/smart card but no drivers or software required. All that is needed is a browser that supports FIDO2 and an OnlyKey to send secure messages and files.

{% include callout.html content="**Step 1. Find a Keybase User -** The first step in sending a secure message or file is to identify who to send it to. Browse to [https://apps.crp.to/search](https://apps.crp.to/search) to use our custom Keybase search tool to search Keybase users by:<br>
- Twitter, Github, Reddit, or Hackernews Usernames<br>
- Web domains<br>
- PGP fingerprint<br>
- Or Automatically search for best match" type="default" %}

{% include image.html file="user-search.jpg" %}

{% include callout.html content="**Step 2. Send a user encrypted message or file -** Click the link in the search results to send the selected user encrypted message/file. You can also browse to [https://apps.crp.to/encrypt](https://apps.crp.to/encrypt) to send a secure message or browse to [https://apps.crp.to/encrypt-file](https://apps.crp.to/encrypt-file) to send a secure file if you already know the recipient. To encrypt files for yourself just use your Keybase username as the recipient. " type="default" %}

{% include image.html file="webcrypt1.png" %}

{% include callout.html content="**Step 3. Receive an encrypted message or file -** To decrypt a message or file browse to [https://apps.crp.to/decrypt](https://apps.crp.to/decrypt) or [https://apps.crp.to/decrypt-file](https://apps.crp.to/decrypt-file). You can also create a unique link which allows anyone, with or without an OnlyKey to send you and encrypted file. This may be used in places such as an email signature to receive secure messages. The format is:
<br><br>
Send me a secure message -
[https://apps.crp.to/encrypt.html?type=e&recipients=YOURKEYBASEUSERNAME](https://apps.crp.to/encrypt.html?type=e&recipients=YOURKEYBASEUSERNAME)
<br><br>
Send me a secure file
[https://apps.crp.to/encrypt-file.html?type=e&recipients=YOURKEYBASEUSERNAME](https://apps.crp.to/encrypt-file.html?type=e&recipients=YOURKEYBASEUSERNAME)

" type="default" %}

{% include image.html file="webcrypt2.png" %}

### See WebCrypt in action {#openpgp-action}

After configuring your OnlyKey following [these instructions](#generating-keys) you can browse to the [Webcrypt app](https://apps.crp.to/encrypt) to send secure messages.

- Enter a message to encrypt
{% include image.html file="encrypted-message.jpg" %}

- Enter the shown challenge code on the OnlyKey (i.e. 1,5,2)
{% include image.html file="encrypted-message2.jpg" %}

- Encrypted message shown, by clicking the button again it will be copied to clipboard
{% include image.html file="encrypted-message3.jpg" %}
{% include image.html file="encrypted-message4.jpg" %}

- Paste the message into any email or chat (Sending via Gmail shown)
{% include image.html file="encrypted-message5.jpg" %}

- When the recipient receives the message (email or chat) they can paste it into Webcrypt app to decrypt
{% include image.html file="encrypted-message6.jpg" %}

- Enter the shown challenge code on the OnlyKey (i.e. 2,2,1)
{% include image.html file="encrypted-message7.jpg" %}

- Decrypted message shown, if the sender signed the message you will see the sender's name (i.e. t) and their key ID.
{% include image.html file="encrypted-message8.jpg" %}

- By clicking the button again the message will be copied to clipboard
{% include image.html file="encrypted-message9.jpg" %}

{% include note.html content="Messages sent via Webcrypt are never sent over the internet. The way it works is the necessary files are downloaded to your browser and all processing is done in your browser. Read more about [Webcrypt security here](https://docs.crp.to/webcrypt.html#security-goals)" %}

## Benefits

- This revolutionary approach makes PGP encryption easy and secure with OpenPGP keys securely stored on OnlyKey, not accessible to the app or to the browser. This is in contrast to for example PGP/GPG software, webmail (i.e. Protonmail), and smartphone apps.
-  Physical user presence is required to process secure messages/files. This is in contrast to Smart Cards which only require a PIN code that can be captured and replayed without physical user presence.
- WebCrypt even allows Kebase user’s to receive secure messages and files from non-OnlyKey users. Anyone can use WebCrypt to send encrypted messages/files and can create a unique link to receive secure messages and files.
- With WebCrypt’s Keybase integration its easy to find Keybase users and send secure messages/files with the click of a button - https://apps.crp.to/search.


## Setup

**Before using this app you must follow these instructions to generate PGP keys and load them on OnlyKey:**
- [Generate keys](https://docs.crp.to/usersguide.html#generating-keys) using Keybase
- [Load keys](https://docs.crp.to/usersguide.html#loading-keys) onto OnlyKey

## Sending secure messages

To create encrypted PGP message just:
- Browse to https://apps.crp.to/encrypt
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
- Browse to https://apps.crp.to/decrypt
- Enter your Keybase ID (for the key you loaded onto OnlyKey) in the first box
- Paste your encrypted PGP message in the second box
- Click "Decrypt and Verify"
- When prompted enter the challenge code onto the OnlyKey

The decrypted message will be displayed. Read it and then close the browser tab and there will be no trace of the decrypted message.

![Securely decrypt messages anywhere with OnlyKey WebCrypt](https://raw.githubusercontent.com/onlykey/onlykey.github.io/master/decrypt.gif)

## Security Goals

**Make PGP easy**: Traditional PGP makes journalists angry, we think you shouldn't have to be technologically savvy to use PGP so we built WebCrypt.

**Empower the people**: Give people the ability to securely send and receive messages using any computer or Android device with no complicated software/drivers required and no worrying about compromise of user's private identity.

**Serverless**: All processing done via javascript in users own browser locally (no server to hack).

**Private**: No logins required. No data retention. No tracking!!! No emails. No ads. No demographics. Retain no metadata, or other tracking information.

**Strong crypto** - Everything should be sent via HTTPS to/from the web application. Data between local browser and OnlyKey should be encrypted using AES/ECDH shared secret (NaCl + AES-256-GCM). This means on the local computer data is end-to-end encrypted and even if a malicious applications were to intercept communication it would be encrypted and unreadable without the key.

**Phishing prevention** - The OnlyKey currently only works with apps.crp.to. Other domains are ignored, domains are enforced by origin.

**Open source & audit-able** - What you see is what you get this repository is a Github page hosted directly on Github.

We are always working to make WebCrypt better, pull requests welcome!

## Protocol

The protocol outlined below utilizes existing communication channel via FIDO2.

### Communication Channel Overview (Advanced)

FIDO2 utilizes registration and authentication message types. To send data to the OnlyKey, messages are encoded in the Key Handle of the authentication message type. To receive data back, messages are encoded in the signature of the authentication response. This method provides a reliable form of communication that is supported anywhere U2F is supported including Firefox, Chrome, Chromium, Opera, Brave, and Edge (new).

The outline below visualizes the use of onlykey-api.js and FIDO2 to communicate via browser to OnlyKey over USB.

```
┌──────────────┐                                                   ┌─────────┐
│ APPLICATION  │                                                   │ OnlyKey │
└──────────────┘                                                   └─────────┘

INITIALIZE - SET TIME, SET APP PUBLIC NaCl KEY, GET ONLYKEY PUBLIC NaCl KEY, GET FIRMWARE VERSION

1. Authentication Request Message:

Encode a *packet in key handle field that contains current epoch time and application public key.
┌──────────────────┬──────────────────┐
│    challenge     │    Key Handle    │  
│      random      │     *packet      │  
└──────────────────┴──────────────────┘
───────────────────────────────────────────────────────────────────────────▶

2. Authentication Response Message:

Decode a *packet with OnlyKey public key, OnlyKey firmware version.
┌──────────────────┐
│     Signature    │  
│     *packet      │  
└──────────────────┘
◀───────────────────────────────────────────────────────────────────────────

DECRYPTION/SIGNING REQUEST - DECRYPT OR SIGN DATA USING RSA PRIVATE KEY

1. Authentication Request Message:

First, generate ECDH shared secret from OnlyKey's provided public key and application
generated public key. AES-GCM key is derived from SHA256 hash of shared secret (32 bytes). Encrypt and decrypt
all future packets with this key.

Encode encrypted *packet in key handle field one chunk at a time (Max size 255 bytes).
Repeat for each chunk of data. Once finished sending data ping messages sent in
order to get response or error messages.
┌──────────────────┬──────────────────┐
│    challenge     │    Key Handle    │  
│      random      │     *packet      │  
└──────────────────┴──────────────────┘
───────────────────────────────────────────────────────────────────────────▶

2.  Authentication Response Message:

Once full message is received both the App and the OnlyKey generate a hash of
the message that is used to generate a 3 digit challenge code. The OnlyKey light flashes continuously
and the app prompts the user to enter the 3 digit code to authorize the signing / decrypting of
that message. This ensures that user presence is required to sign / decrypt and that the authorization
applies to a specific plaintext, not a spoofed message. For increased security future versions may permit
a longer challenge code.

Once the challenge code is entered correctly, the decryption / signing is completed and the result is encrypted via AES-GCM and stored on the OnlyKey (After 25 seconds unretrieved messages are automatically wiped from OnlyKey).

┌────────────────────────┐
│        Signature       │  
│        *packet         │  
│     (Variable Size)    │
└────────────────────────┘
◀───────────────────────────────────────────────────────────────────────────

```

## Licenses

Thanks to http://tilomitra.github.io/prettypages/

Copyright 2012 Yahoo! Inc. All rights reserved. Licensed under the BSD License. http://yuilibrary.com/license/

Thanks to Ron Garret for originally posting a serverless implementation of U2F here - https://github.com/rongarret/u2f-test

The MIT License (MIT)
Copyright (c) 2019 CryptoTrust LLC.

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

   "RFC4880 Implementation in IcedCoffeeScript" - https://github.com/keybase/kbpgp
   "Port of TweetNaCl cryptographic library to JavaScript" - https://github.com/dchest/tweetnacl-js
   "A native implementation of TLS in Javascript and tools to write crypto-based and network-heavy webapps" - https://github.com/digitalbazaar/forge

For more information on export restrictions see: http://www.apache.org/licenses/exports/

## Source

[OnlyKey WebCrypt on Github](https://github.com/onlykey/onlykey.github.io)
