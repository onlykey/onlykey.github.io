// node test/version-route.test.js
'use strict';
const assert = require('assert');
const r = require('../src/plugins/version-route/version-route-core.js');
const at = (hostname, pathname = '/app/decrypt', search = '', hash = '') => ({ hostname, pathname, search, hash });

// The numeric triple decides, not the keyword suffix.
assert.deepStrictEqual(r.parseFirmwareVersion('v3.0.5-prodc'), [3, 0, 5]);
assert.strictEqual(r.parseFirmwareVersion('v0.2-beta.8c'), null);
assert.strictEqual(r.isNewFirmware('v3.0.5-prod'), true);
assert.strictEqual(r.isNewFirmware('v3.0.5-test'), true);
assert.strictEqual(r.isNewFirmware('v3.0.4-prod'), false);
assert.strictEqual(r.isNewFirmware('v3.1.0'), true);
assert.strictEqual(r.isNewFirmware('v2.10.9'), false);
assert.strictEqual(r.isNewFirmware('v0.2-beta.8c'), false);
assert.strictEqual(r.isNewFirmware(''), false);
assert.strictEqual(r.isNewFirmware(undefined), false);

// apps.crp.to: v3.0.4 and older stay; newer goes to apps.onlykey.io.
assert.strictEqual(r.afterHandshake(at('apps.crp.to'), 'v3.0.4-prod').action, 'stay');
assert.strictEqual(r.afterHandshake(at('apps.crp.to'), 'v0.2-beta.8c').action, 'stay');
assert.strictEqual(r.afterHandshake(at('apps.crp.to'), 'v3.0.5-prod').action, 'redirect');
assert.strictEqual(r.afterHandshake(at('apps.crp.to'), 'v3.0.5-prod').url, 'https://apps.onlykey.io/app/decrypt');

// Nowhere else redirects to apps.onlykey.io (local builds, Heroku's own hostname).
for (const host of ['localhost', 'onlykey.herokuapp.com', 'onlyagent.app']) {
  assert.strictEqual(r.afterHandshake(at(host), 'v3.0.5-prod').action, 'stay');
}

// Shared pages keep their path, query and fragment; others go to the home page.
assert.strictEqual(r.afterHandshake(at('apps.crp.to', '/app/encrypt.html', '?type=e', '#m'), 'v3.0.5-prod').url,
  'https://apps.onlykey.io/app/encrypt?type=e#m');
assert.strictEqual(r.afterHandshake(at('apps.crp.to', '/app/password-generator'), 'v3.0.5-prod').url,
  'https://apps.onlykey.io/');
assert.strictEqual(r.afterHandshake(at('apps.crp.to', '/'), 'v3.0.5-prod').url, 'https://apps.onlykey.io/');

// No answer on apps.crp.to: nothing to do (no key and an old key both stay).
assert.strictEqual(r.noAnswerHint(at('apps.crp.to')), null);

console.log('version-route: all assertions passed');
