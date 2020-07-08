# node-onlykey-fido2

http://onlykey.io/sea


#### requirments
---

* node >= v12
* libusb libudev

------

#### Developer Serial Monitor
---

This provides no help when debugging only key production.

#### Fido2 testing suite
---


# This is a 3rd Party API for onlykey
---

#### Supports
* NACL
* ECDH and ECDSA (p256)
* CURVE25519


## API
----

```js
var ok = onlykey(KEYTYPE , ENCRYPT_RESP);
```
`KEYTYPE`
*   KEYTYPE_NACL = `0`
*   KEYTYPE_P256R1 = `1`
*   KEYTYPE_P256K1 = `2`
*   KEYTYPE_CURVE25519 = `3`

`ENCRYPT_RESP`
*   OFF = `0`
*   ON  = `1`

Methods
-----

```js
ok.connect(function() {})
```
_connect sets onlykey time_



Events
-----

```js
ok.on(event,function() {})
```

List of events

* `"status"`  outputs current operation in english
* `"error"`   emits any errors during operations
* `"debug"`   outpus any debug and status in english, _like `status` but more details_


ECDH 
-----

__KEYTYPE_P256R1 = `1`__

After `connect`, 2 methods are added to `ok`


```js
ok.derive_public_key(additional_d, function(error, jwk_epub) {})
ok.derive_shared_secret(additional_d, jwk_epub, function(error, shared_secret) {})
```

*   `additional_d` = `string` or `buffer` to point to a derived key
*   `jwk_epub` = public key in jwk format
*   `shared_secret`  = shared AES-GCM key




API Authors
-----------
* Tim ~  onlykey.io
* Brad ~  bmatusiak.us
