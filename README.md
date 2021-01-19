![OnlyKey WebCrypt](https://raw.githubusercontent.com/onlykey/onlykey.github.io/master/logo-with-text.png)
========

## About

OnlyKey WebCrypt provides a way to securely use OnlyKey in the browser. The Webcrypt app loads everything necessary to encrypt messages and files directly in the local browser without the need to send messages or files over the Internet. Data between [OnlyKey](https://onlykey.io) and the local browser is end-to-end encrypted.

WebCrypt integrates with services like [Keybase](https://keybase.io/) and [Protonmail](https://protonmail.com) to provide OpenPGP encryption and key management everywhere on-the-go. With OnlyKey you have offline cold storage of your OpenPGP keys and can still easily encrypt messages and files.

- Supports Firefox, Google Chrome, Brave, and Edge (new) browsers!
- Supports macOS, Windows, Linux, Chrome OS, Android, and iPhone (Safari on iOS 13.3+)

[Try it out here!](https://apps.crp.to)

[Encrypt Files](https://apps.crp.to/encrypt-file)

[Decrypt Files](https://apps.crp.to/decrypt-file)

[Encrypt Messages](https://apps.crp.to/encrypt)

[Decrypt Messages](https://apps.crp.to/decrypt)

## How it works

With Keybase and/or Protonmail management of identify and keys is easy, these services allow storage and searching of public keys. These public keys can then be retrieved and used to encrypt or verify messages and files. OnlyKey WebCrypt allows composing encrypted messages and encrypting files similarly to composing an email. The recipient is either a user's Keybase username, Protonmail email, or a pasted public key. The sender can be anyone allowing OnlyKey user's to use WebCrypt to receive encrypted messages and files from anyone, even non-OnlyKey users.

With OnlyKey, private keys remain securely offline. Private keys are not accessible to the browser or even the local computer. This provides similar function to a token/smart card but no drivers or software required. All that is needed is a browser that supports FIDO2 and an OnlyKey to send secure messages and files.

## How to send an encrypted message

{% include callout.html content="**Find a recipient -** The first step in sending a secure message or file is to identify who to send it to. Browse to [https://apps.crp.to/search](https://apps.crp.to/search) to use our custom Keybase/Protonmail search tool to search for Keybase usernames and Protonmail email addresses.<br>
This search tool returns information that can be used to match users based on:<br>
- Twitter, Github, Reddit, or Hackernews Usernames<br>
- Web domains<br>
- PGP fingerprint<br>" type="default" %}

{% include image.html file="user-search.jpg" %}

{% include callout.html content="**Send a user encrypted message or file -** Click the link in the search results to send the selected user encrypted message/file. You can also browse to [https://apps.crp.to/encrypt](https://apps.crp.to/encrypt) to send a secure message or browse to [https://apps.crp.to/encrypt-file](https://apps.crp.to/encrypt-file) to send a secure file if you already know the recipient. To encrypt files for yourself just use your Keybase username or Protonmail email as the recipient. " type="default" %}

{% include image.html file="webcrypt1.png" %}

## How to receive an encrypted message

{% include callout.html content="**Receive an encrypted message or file -** To decrypt a message or file browse to [https://apps.crp.to/decrypt](https://apps.crp.to/decrypt) or [https://apps.crp.to/decrypt-file](https://apps.crp.to/decrypt-file). " type="default" %}

{% include image.html file="webcrypt2.png" %}

{% include tip.html content="
You can receive encrypted messages and files from anyone, no technical skills are required!<br><br>
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
[![How-To: Use OnlyKey WebCrypt](https://raw.githubusercontent.com/trustcrypto/trustcrypto.github.io/master/images/webcrypt3.png)](https://vimeo.com/374672956)" %}

### See WebCrypt in action {#openpgp-action}

After configuring your OnlyKey following [these instructions](https://docs.crp.to/importpgp.html#generating-keys) you can browse to the [Webcrypt app](https://apps.crp.to/encrypt) to send secure messages/files.

{% include tip.html content="Watch a video [here](https://vimeo.com/374653109) that demonstrates using OnlyKey WebCrypt for file encryption<br>[![How-To: Use OnlyKey WebCrypt for file encryption](https://raw.githubusercontent.com/trustcrypto/trustcrypto.github.io/master/images/webcrypt.png)](https://vimeo.com/374653109)" %}

#### Step-by-step sending your first message

To create encrypted PGP message or file just:
- Browse to [https://apps.crp.to/encrypt](https://apps.crp.to/encrypt)
- Enter the recipient's Keybase username or Protonmail email in the first box
- Enter your Keybase username or Protonmail email (for the key you loaded onto OnlyKey) in the second box.

{% include tip.html content="If you didn't load your key onto OnlyKey follow these [these instructions](https://docs.crp.to/importpgp.html#generating-keys)" %}

- Enter your secure message in the third box
- Click "Encrypt and Sign"
- When prompted enter the challenge code onto the OnlyKey

The encrypted message will be displayed and you can paste it into an email, IM, app or pretty much anything.

*Alternatively, if you don't want to use Keybase or Protonmail you can paste a public key*

#### Step-by-step receiving encrypted files

To decrypt an OpenPGP encrypted file just:
- Browse to [https://apps.crp.to/decrypt-file](https://apps.crp.to/decrypt-file)
- If you know the Keybase username/Protonmail email of the sender enter this in the first box, if you don't know this click the "Decrypt Only" radio button.
- Choose encrypted file (should end in .gpg file extension)
- Click Decrypt
- When prompted enter the challenge code onto the OnlyKey

The decrypted zip file will be automatically downloaded.

{% include note.html content="Messages and files encrypted via Webcrypt do not send your data over the internet. The way it works is the necessary files are downloaded to your browser and all processing is done in your browser. Read more about [Webcrypt security here](https://docs.crp.to/webcrypt.html#security-goals)" %}

## Benefits

### Universal Support

This is accomplished by using the FIDO2 communication channel to communicate with a USB hardware device. The universal support for FIDO2 allows the web application to be used anywhere FIDO2 is supported including browsers on Android, iPhone (iOS 13.3+), Windows, Mac OS, Linux, and Chromebook. The web app can also be released as a native app that does not require a web browser if this is preferred. [More information on Android/iOS support](https://docs.crp.to/mobile)

### Key Management

In addition to universal support, OnlyKey WebCrypt works with Keybase and Protonmail for easy user key management. Key management is one of the most difficult issues to solve when it comes to encrypting messages and files.

### Better than a PGP key server

The first step in secure communication is often finding the person to communicate with and having assurance that it is them. By identifying users from their Keybase registered social media profiles, domains, PGP fingerprints, or known Protonmail email address, this provides higher assurance of user identity than use of traditional PGP key servers.

### Better than a Smart Card

Smart cards are a popular way for enterprises to keep cryptographic keys protected but they are not known for being easy to use and are definitely not universally supported. OnlyKey provides similar function to a token/smart card but no drivers or software is required. Additionally, physical user presence is required to process secure messages/files. This is in contrast to Smart cards which only require a PIN code that can in some cases be captured and replayed without physical user presence resulting in security compromise.

### Better than OpenPGP  

OpenPGP is widely used but not known for being easy to use. There have been efforts such as Keybase and Protonmail that make OpenPGP easier to use but require that private keys are accessible in software or the cloud. This means that in some cases user’s OpenPGP keys may be compromised by phishing attacks, malware, or software vulnerabilities. OnlyKey WebCrypt supports OpenPGP keys that are compatible with Protonmail, Keybase, Mailvelope, GPG, and others while allowing users to securely keep their keys offline and protected.

## Security Goals {#security-goals}

**Make PGP easier**: Traditional PGP makes journalists angry, we think you shouldn't have to be technologically savvy to use PGP or worry that a software vulnerability could compromise your PGP keys, so we built WebCrypt.

**Empower the people**: Give people the ability to securely send and receive messages using any computer or Android/iOS device with no complicated software/drivers required and no worrying about compromise of user's private identity.

**Serverless**: All encryption/decryption done via javascript in users own browser locally (no server to hack).

**Private**: No logins required. No data retention. No tracking!!! No emails. No ads. No demographics. Retain no metadata, or other tracking information.

**Strong crypto** - Everything is sent via HTTPS to/from the web application. Data between local browser and OnlyKey is encrypted using AES/ECDH shared secret (NaCl + AES-256-GCM). This means on the local computer data is end-to-end encrypted and even if a malicious applications were to intercept communication it would be encrypted and unreadable without the key.

**Phishing prevention** - The OnlyKey currently only works with apps.crp.to. Other domains are ignored, domains are enforced by origin.

**Open source & audit-able** - What you see is what you get this repository is available on Github.

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

The protocol outlined below utilizes existing communication channel via FIDO2. Currently, FIDO2 does not provide end-to-end encryption between the web and security keys. Meaning that USB data is not encrypted and any application with USB read access is able to view FIDO2 data in transit. For our application, a custom extra layer of data in transit encryption was built to ensure that even if there is a local application with access to read USB data the data would be encrypted and unreadable. Only the security key (OnlyKey) and the initiating web application are able to read the encrypted data in our implementation.

### Communication Channel Overview (Advanced)

FIDO2 utilizes registration and authentication message types. To send data to the OnlyKey, messages are encoded in the Key Handle of the authentication message type. To receive data back, messages are encoded in the signature of the authentication response. This method provides a reliable form of communication that is supported anywhere FIDO2 / U2F is supported including Firefox, Chrome, Chromium, Opera, Brave, and Edge (new).

The outline below visualizes the use of FIDO2 to communicate via browser to OnlyKey over USB.

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