### Serverless OnlyKey Web App

https://apps.crp.to

### Protocol

The protocol outlined below utilizes existing communication channel via U2F. More
information is available on U2F protocol [here](https://fidoalliance.org/specs/fido-u2f-v1.0-nfc-bt-amendment-20150514/fido-u2f-raw-message-formats.html).

#### Overview

U2F utilizes registration and authentication message types. To send data to the OnlyKey, messages are encoded in the Key Handle of the authentication message type. To receive data back, messages are encoded in the Certificate of the registration message type. This method provides a reliable form of communication that is supported anywhere U2F is supported including Chrome, Chromium, Opera, and Firefox (w/plugin).


```
┌──────────────┐                                                   ┌─────────┐
│ APPLICATION  │                                                   │ OnlyKey │
└──────────────┘                                                   └─────────┘

INITIALIZE - SET TIME, GET PUBLIC KEY, GET FIRMWARE VERSION

1. Authentication Request Message: auth_timeset()
Encode a *packet in U2F Key Handle field to set current time.
┌──────────────────┬──────────────────┬──────────────────┐
│    challenge     │       appId      │    Key Handle    │  
│      random      │      crp.to      │     *packet      │  
│    (32 bytes)    │     (32 bytes)   │    (64 bytes)    │
└──────────────────┴──────────────────┴──────────────────┘
───────────────────────────────────────────────────────────────────────────▶

2.  Authentication Response Message: verify_auth_response(response)
Error type 1 (OTHER_ERROR) used as an ACK,
DESCRIPTION: Acknowledge message received. Any other error code indicates failure.
┌─────────────────┐
│  Error Message  │      
│       *ACK      │   
│     (1 byte)    │   
└─────────────────┘
◀───────────────────────────────────────────────────────────────────────────

3.  Registration Request Message: enroll_polling()
OnlyKey checks the appId and if it is correct and there is data waiting to be sent data message triggers a registration response with encoded data.
┌──────────────────┬──────────────────┬──────────────────┐
│    challenge     │       appId      │      version     │  
│      *zeros      │       crp.to     │      U2F_V2      │  
│    (32 bytes)    │     (32 bytes)   │     (4 bytes)    │
└──────────────────┴──────────────────┴──────────────────┘
───────────────────────────────────────────────────────────────────────────▶

4. Registration Response Message: process_custom_response(response)
Encode Key Handle with hardware generated *random number, Certificate field with OnlyKey Firmware *version and
a public session key for ECDH.
┌─────────────────┬────────────────┬──────────────────────┬───────────────────┐
│   Public Key    │   Key Handle   │     Certificate      │     Signature     │
│   <Not Used>    │ *random number │ *version and public  │    <Not Used>     │
│   (65 bytes)    │   (64 bytes)   │   (Variable Size)    │    (64 bytes)     │
└─────────────────┴────────────────┴──────────────────────┴───────────────────┘
◀───────────────────────────────────────────────────────────────────────────


PUBLIC KEY REQUEST - GET THE PUBLIC KEY FOR ECC KEYS (1-32) and RSA KEYS (1-4)

1. Authentication Request Message: auth_getpub()
Encode a *packet in U2F Key Handle field to request public key from slot # slotId().
┌──────────────────┬──────────────────┬──────────────────┐
│    challenge     │       appId      │    Key Handle    │  
│      random      │      crp.to      │     *packet      │  
│    (32 bytes)    │     (32 bytes)   │    (64 bytes)    │
└──────────────────┴──────────────────┴──────────────────┘
───────────────────────────────────────────────────────────────────────────▶

2.  Authentication Response Message: verify_auth_response(response)
Error type 1 (OTHER_ERROR) used as an ACK,
DESCRIPTION: Acknowledge message received. Any other error code indicates failure.
┌─────────────────┐
│  Error Message  │      
│       *ACK      │   
│     (1 byte)    │   
└─────────────────┘
◀───────────────────────────────────────────────────────────────────────────

3.  Registration Request Message: enroll_polling()
OnlyKey checks the appId and if it is correct and there is data waiting to be sent data message triggers a registration response with encoded data.
┌──────────────────┬──────────────────┬──────────────────┐
│    challenge     │       appId      │      version     │  
│      *zeros      │       crp.to     │      U2F_V2      │  
│    (32 bytes)    │     (32 bytes)   │     (4 bytes)    │
└──────────────────┴──────────────────┴──────────────────┘
───────────────────────────────────────────────────────────────────────────▶

4. Registration Response Message: process_custom_response(response)
Encode Key Handle with hardware generated *random number, Certificate field with *slot public key assigned to the requested slot #.
┌─────────────────┬────────────────┬──────────────────┬───────────────────┐
│   Public Key    │   Key Handle   │   Certificate    │     Signature     │
│   <Not Used>    │ *random number │ *slot public key │    <Not Used>     │
│   (65 bytes)    │   (64 bytes)   │ (Variable Size)  │    (64 bytes)     │
└─────────────────┴────────────────┴──────────────────┴───────────────────┘
◀───────────────────────────────────────────────────────────────────────────


DECRYPTION/SIGNING REQUEST - DECRYPT OR SIGN DATA USING ECC KEYS (1-32) and RSA KEYS (1-4)

1. Authentication Request Message: auth_decrypt(), auth_sign()

First, generate ECDH shared secret from OnlyKey's provided public session key and locally generated ECDH private using hardware generated random number from OnlyKey.


Encode a *packet in U2F Key Handle field to request decryption using private key in slot # slotId().
*encrypted packet is encrypted with key derived from shared secret - includes ciphertext broken into chunks (i.e. 1 of 3 packets for 128 byte encrypted payload).
┌──────────────────┬──────────────────┬───────────────────┐
│    challenge     │       appId      │     Key Handle    │  
│      random      │      crp.to      │ *encrypted packet │  
│    (32 bytes)    │     (32 bytes)   │     (64 bytes)    │
└──────────────────┴──────────────────┴───────────────────┘
───────────────────────────────────────────────────────────────────────────▶

2.  Authentication Response Message: verify_auth_response(response)
Error type 1 (OTHER_ERROR) used as an ACK,
DESCRIPTION: Acknowledge message received. Any other error code indicates failure.
┌─────────────────┐
│  Error Message  │      
│       *ACK      │   
│     (1 byte)    │   
└─────────────────┘
◀───────────────────────────────────────────────────────────────────────────

3.  Encode a *packet in U2F Key Handle field to request decryption using private key in slot # slotId().
*encrypted packet is encrypted with key derived from shared secret - includes ciphertext broken into chunks (i.e. 2 of 3 packets for 128 byte encrypted payload).
┌──────────────────┬──────────────────┬───────────────────┐
│    challenge     │       appId      │     Key Handle    │  
│      random      │      crp.to      │ *encrypted packet │  
│    (32 bytes)    │     (32 bytes)   │     (64 bytes)    │
└──────────────────┴──────────────────┴───────────────────┘
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

5.  Encode a *packet in U2F Key Handle field to request decryption using private key in slot # slotId().
*encrypted packet is encrypted with key derived from shared secret - includes ciphertext broken into chunks (i.e. 3 of 3 packets for 128 byte encrypted payload).
┌──────────────────┬──────────────────┬───────────────────┐
│    challenge     │       appId      │     Key Handle    │  
│      random      │      crp.to      │ *encrypted packet │  
│    (32 bytes)    │     (32 bytes)   │     (64 bytes)    │
└──────────────────┴──────────────────┴───────────────────┘
───────────────────────────────────────────────────────────────────────────▶

Once full message is received both the App and the OnlyKey generate a hash of
the message that is used to generate a 3 digit code. The OnlyKey light flashes continuously
and the app prompts the user to enter the 3 digit code to authorize the signing / decrypting of
that message. This ensures that user presence is required to sign / decrypt and that the authorization applies to a specific plaintext, not a spoofed message.

Once the 3 digit code is entered, the decryption / signing is completed and the result is stored on the OnlyKey until polling occurs.

6. Registration Response Message: process_custom_response(response)
Encode Key Handle with hardware generated *random number, Certificate field with the *encrypted packet is encrypted with key derived from shared secret - includes plaintext from decryption request or signature from signing request.
┌─────────────────┬────────────────┬────────────────────┬───────────────────┐
│   Public Key    │   Key Handle   │    Certificate     │     Signature     │
│   <Not Used>    │ *random number │ *encrypted packet  │    <Not Used>     │
│   (65 bytes)    │   (64 bytes)   │   (Variable Size)  │    (64 bytes)     │
└─────────────────┴────────────────┴────────────────────┴───────────────────┘
◀───────────────────────────────────────────────────────────────────────────


```

### Security Goals

**Empower the people**: Give people the ability to securely send and receive messages using any computer.

**Serverless**: All processing done via javascript in users own browser (no server to hack).

**Private**: No logins required. No data retention. No tracking!!! No emails. No ads. No demographics. Retain no metadata, or other tracking information we don't know who / what / where you are.

**Strong Crypto** - Everything should be sent via HTTPS and data between browser and OnlyKey should be end-to-end encrypted using AES/ECDH shared secret.

**Open source & audit-able**

### Licenses

Thanks to http://tilomitra.github.io/prettypages/

Copyright 2012 Yahoo! Inc. All rights reserved. Licensed under the BSD License. http://yuilibrary.com/license/

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

## Cryptography Notice

This distribution includes cryptographic software. The country in which you currently reside may have restrictions on the import, possession, use, and/or re-export to another country, of encryption software.
BEFORE using any encryption software, please check your country's laws, regulations and policies concerning the import, possession, or use, and re-export of encryption software, to see if this is permitted.
See <http://www.wassenaar.org/> for more information.

The U.S. Government Department of Commerce, Bureau of Industry and Security (BIS), has classified this software as Export Commodity Control Number (ECCN) 5D002.C.1, which includes information security software using or performing cryptographic functions with asymmetric algorithms.
The form and manner of this distribution makes it eligible for export under the License Exception ENC Technology Software Unrestricted (TSU) exception (see the BIS Export Administration Regulations, Section 740.13) for both object code and source code.

The following cryptographic software is included in this distribution:

   "Fast Elliptic Curve Cryptography in plain javascript" - https://github.com/indutny/elliptic

For more information on export restrictions see: http://www.apache.org/licenses/exports/
