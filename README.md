![OnlyKey WebCrypt](https://raw.githubusercontent.com/onlykey/onlykey.github.io/master/logo-with-text.png)
========

## About

WebCrypt is a serverless Web App that integrates with [OnlyKey](https://onlykey.io) to provide PGP encryption everywhere on-the-go. With OnlyKey and Keybase together you have offline cold storage of your OpenPGP keys and can still easily encrypt messages and files.

Supports Firefox, Google Chrome, Brave, and Edge (new) browsers!

Supports macOS, Windows, Linux, Chrome OS, Android, and iPhone (Safari on iOS 13.3+)!

[Try it out here!](https://apps.crp.to)

[Encrypt Files](https://apps.crp.to/encrypt-file)
[Decrypt Files](https://apps.crp.to/decrypt-file)
[Encrypt Messages](https://apps.crp.to/encrypt)
[Decrypt Messages](https://apps.crp.to/decrypt)

## How it works

With Keybase user/key management is made easy and with OnlyKey private keys remain securely offline. Private keys are not accessible to the browser or even the local computer. By using FIDO2 as a secure communication channel the web application can send messages to OnlyKey that are decrypted and signed offline. This provides similar function to a token/smart card but no drivers or software required. All that is needed is a browser that supports FIDO2 and an OnlyKey to send secure messages and files.

**Step 1. Find a Keybase User -** The first step in sending a secure message or file is to identify who to send it to. Browse to [https://apps.crp.to/search](https://apps.crp.to/search) to use our custom Keybase search tool to search Keybase users by:<br>
- Twitter, Github, Reddit, or Hackernews Usernames<br>
- Web domains<br>
- PGP fingerprint<br>
- Or Automatically search for best match" type="default


**Step 2. Send a user encrypted message or file -** Click the link in the search results to send the selected user encrypted message/file. You can also browse to [https://apps.crp.to/encrypt](https://apps.crp.to/encrypt) to send a secure message or browse to [https://apps.crp.to/encrypt-file](https://apps.crp.to/encrypt-file) to send a secure file if you already know the recipient. To encrypt files for yourself just use your Keybase username as the recipient.


**Step 3. Receive an encrypted message or file -** To decrypt a message or file browse to [https://apps.crp.to/decrypt](https://apps.crp.to/decrypt) or [https://apps.crp.to/decrypt-file](https://apps.crp.to/decrypt-file).

You can receive encrypted messages and files from anyone, no tech skills are required!<br><br>
Receiving encrypted files is as easy as putting a custom link in your email signature:<br><br>
**Bob Smith**<br>
**Email:** Bobsmith@bobsmith.com<br>
**Phone:** 111.222.3333<br>
*Send me a secure [message](https://apps.crp.to/encrypt.html?type=e&recipients=bobsmith2) or [file](https://apps.crp.to/encrypt-file.html?type=e&recipients=bobsmith2)*<br>
*[More info](https://onlykey.io/pages/webcrypt)*<br>
<br>
- Link the text **'message'** to: https://apps.crp.to/encrypt.html?type=e&recipients=<mark>bobsmith2</mark>
<br><br>
- Link the text **'file'** to: https://apps.crp.to/encrypt-file.html?type=e&recipients=<mark>bobsmith2</mark>
<br><br>
- Change <mark>bobsmith2</mark> in the link to your Keybase user name
<br><br>
- Add a **'More info'** link to: https://onlykey.io/pages/webcrypt<br>
This link provides information to let your sender know what WebCrypt is, why it's secure, and includes a quick 30 second video that will shows how to use it.<br>
[![How-To: Use OnlyKey WebCrypt](https://raw.githubusercontent.com/trustcrypto/trustcrypto.github.io/master/images/webcrypt3.png)](https://vimeo.com/374672956)

### See WebCrypt in action {#openpgp-action}

After configuring your OnlyKey following [these instructions](https://docs.crp.to/usersguide.html#generating-keys) you can browse to the [Webcrypt app](https://apps.crp.to/encrypt) to send secure messages/files.

Watch a video [here](https://vimeo.com/374653109) that demonstrates using OnlyKey WebCrypt for file encryption<br>[![How-To: Use OnlyKey WebCrypt for file encryption](https://raw.githubusercontent.com/trustcrypto/trustcrypto.github.io/master/images/webcrypt.png)](https://vimeo.com/374653109)

#### Sending secure messages/files

To create encrypted PGP message or file just:
- Browse to https://apps.crp.to/encrypt or https://apps.crp.to/encrypt-file
- Enter the recipient's Keybase ID in the first box
- Enter your Keybase ID (for the key you loaded onto OnlyKey) in the second box
- Enter your secure message in the third box
- Click "Encrypt and Sign"
- When prompted enter the challenge code onto the OnlyKey

The encrypted message will be displayed and you can paste it into an email, IM, app or pretty much anything. The encrypted .gpg file will be downloaded to your computer.

*Alternatively, if you don't want to use Keybase you can paste a public key*

#### Receiving secure messages/files

To decrypt PGP message or file just:
- Browse to https://apps.crp.to/decrypt or https://apps.crp.to/decrypt-file
- If you know the Keybase ID of the sender enter this in the first box, if you don't know this click the "Decrypt Only" radio button.
- Paste your encrypted PGP message in the second box or choose encrypted file
- Click Decrypt
- When prompted enter the challenge code onto the OnlyKey

The decrypted message will be displayed or the decrypted zip file downloaded.

Messages and files sent via Webcrypt are never sent over the internet. The way it works is the necessary files are downloaded to your browser and all processing is done in your browser. Read more about [Webcrypt security here](https://docs.crp.to/webcrypt.html#security-goals)

## Benefits

### Universal Support

This is accomplished by using the FIDO2 communication channel to communicate with a USB hardware device. The universal support for FIDO2 allows the web application to be used anywhere FIDO2 is supported including browsers on Android, iPhone (iOS 13.3+), Windows, Mac OS, Linux, and Chromebook. The web app can also be released as a native app that does not require a web browser if this is preferred.

### Key Management

In addition to universal support, OnlyKey WebCrypt works with Keybase for easy user key management. Key management is one of the most difficult issues to solve when it comes to encrypting messages and files.

### User Search

The first step in secure communication is often finding the person to communicate with and having assurance that it is them. With the OnlyKey WebCrypt Search its easy to find users on Keybase by:
- Twitter, Github, Reddit, or Hackernews Usernames
- Web domains
- PGP fingerprint
- Or Automatically search for best match

### Better than a Smart Card

Smart cards are a popular way for keeping keys offline but they are not exactly known for being easy to use and are definitely not universally supported. OnlyKey provides similar function to a token/smart card but no drivers or software is required. Additionally, physical user presence is required to process secure messages/files. This is in contrast to Smart cards which only require a PIN code that can be captured and replayed without physical user presence allowing malware to decrypt a user’s data.

### Better than OpenPGP  

OpenPGP is widely used but not exactly known for being easy to use. There have been efforts such as Keybase and Protonmail that make OpenPGP easier to use but require that private keys are accessible in software or the cloud. This means that in some cases user’s OpenPGP keys may be obtained by phishing attacks, malware, or software vulnerabilities. OnlyKey WebCrypt supports OpenPGP keys that are compatible with Protonmail, Keybase, Mailvelope, GPG, and others while allowing users to securely keep their keys offline.

## Security Goals {#security-goals}

**Make PGP easy**: Traditional PGP makes journalists angry, we think you shouldn't have to be technologically savvy to use PGP so we built WebCrypt.

**Empower the people**: Give people the ability to securely send and receive messages using any computer or Android/iOS device with no complicated software/drivers required and no worrying about compromise of user's private identity.

**Serverless**: All processing done via javascript in users own browser locally (no server to hack).

**Private**: No logins required. No data retention. No tracking!!! No emails. No ads. No demographics. Retain no metadata, or other tracking information.

**Strong crypto** - Everything should be sent via HTTPS to/from the web application. Data between local browser and OnlyKey should be encrypted using AES/ECDH shared secret (NaCl + AES-256-GCM). This means on the local computer data is end-to-end encrypted and even if a malicious applications were to intercept communication it would be encrypted and unreadable without the key.

**Phishing prevention** - The OnlyKey currently only works with apps.crp.to. Other domains are ignored, domains are enforced by origin.

**Open source & audit-able** - What you see is what you get this repository is a Github page hosted directly on Github.

We are always working to make WebCrypt better, pull requests welcome!

## Societal Impact Goals {#society-goals}

The issues solved by OnlyKey WebCrypt are issues that affect many at-risk communities such as human rights
activists and journalists.

### Universal support
Many journalists may travel and may have to make do with whatever internet connection that is available such as using a shared computer or a mobile device. OnlyKey WebCrypt does not require installing software, all that is needed is a USB port, a common web browser (i.e. Chrome, Firefox), and an internet connection.

### Ease of Use
It is often the case that secure solutions are not adopted not because of lack of availability but that they require considerable technical skills. For example, installing smart card software may require command line utilities and a high level of technical proficiency. At-risk communities may not have the technical proficiency to do this, with OnlyKey there are no commands necessary, setup is as easy as following step by step directions to generate a private key on Keybase and load onto the OnlyKey. This opens up the solution to a much wider range of at-risk communities.

### Plausible Deniability
Human rights activists and journalists may reside in or travel to countries with encryption bans or mandatory key disclosure. OnlyKey already has a feature for this to provide plausible deniability. Full details of this feature are available [here](https://docs.crp.to/pdguide.html).

## Technical Specs

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
