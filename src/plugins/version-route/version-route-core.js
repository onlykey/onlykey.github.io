/*
 * Which web app serves which firmware.
 *
 *   apps.crp.to      the 2022 app. Speaks transit v1, which firmware newer
 *                    than v3.0.4 refuses, so a newer key can connect there but
 *                    cannot do anything after the handshake.
 *   apps.onlykey.io  this app. Firmware v3.0.4 and earlier does not have it in
 *                    its trusted-origin table, so an older key cannot even
 *                    complete the handshake here.
 *
 * Both origins are in the table of every firmware newer than v3.0.4
 * (webcryptcheck(), fido2/device.cpp), which is why the handshake reply - the
 * model string, sent in the clear - can be read on either site by a new key.
 *
 * Only these two hostnames ever redirect. Staging (onlyagent.app) and local
 * builds stay where they are, whatever key turns up.
 *
 * The version is PARSED, never string-matched: a production build reports
 * "v3.0.5-prod" and a debug build "v3.0.5-test", and both are 3.0.5. Anything
 * that does not parse as a numeric triple (the v0.2-beta.8c line) is treated
 * as old, which keeps it on the site that has always served it.
 *
 * Plain CommonJS with no imports so the same file can be checked in Node
 * (test/version-route.test.js) and dropped into the old app unchanged.
 */
'use strict';

var OLD_APP = 'https://apps.crp.to';
var NEW_APP = 'https://apps.onlykey.io';
var LAST_OLD_FIRMWARE = [3, 0, 4];

/* Pages that exist under the same path on both apps. Anything else lands on
 * the other app's home page rather than on a 404. */
var SHARED_PATHS = ['/app/encrypt', '/app/decrypt', '/app/encrypt-file',
                    '/app/decrypt-file', '/app/search'];

function parseFirmwareVersion(s) {
  var m = /v?(\d+)\.(\d+)\.(\d+)/.exec(String(s || ''));
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function compare(a, b) {
  for (var i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

/** true for firmware newer than v3.0.4; false for older or unparseable. */
function isNewFirmware(s) {
  var v = parseFirmwareVersion(s);
  return !!v && compare(v, LAST_OLD_FIRMWARE) > 0;
}

function samePageOn(origin, loc) {
  var path = String((loc && loc.pathname) || '/').replace(/\.html$/, '').replace(/\/+$/, '');
  var target = SHARED_PATHS.indexOf(path) !== -1 ? path : '/';
  return origin + target + ((loc && loc.search) || '') + ((loc && loc.hash) || '');
}

/**
 * After a successful handshake: stay, or go to the app that serves this key.
 * @param {{hostname:string, pathname?:string, search?:string, hash?:string}} loc
 * @param {string} firmware  the version string from the OKCONNECT reply
 * @returns {{action:'stay'} | {action:'redirect', url:string, reason:string}}
 */
function afterHandshake(loc, firmware) {
  var host = loc && loc.hostname;
  var isNew = isNewFirmware(firmware);
  if (host === 'apps.crp.to' && isNew) {
    return { action: 'redirect', url: samePageOn(NEW_APP, loc),
             reason: 'OnlyKey ' + firmware + ' is served by apps.onlykey.io' };
  }
  if (host === 'apps.onlykey.io' && !isNew) {
    return { action: 'redirect', url: samePageOn(OLD_APP, loc),
             reason: 'OnlyKey ' + firmware + ' is served by apps.crp.to' };
  }
  return { action: 'stay' };
}

/**
 * When the handshake got no answer. On apps.onlykey.io that is exactly what a
 * v3.0.4-or-older key looks like - it refuses this origin - and it is also
 * what no key at all looks like, so this never redirects: it only offers the
 * other site. Returns null anywhere else.
 */
function noAnswerHint(loc) {
  if (!loc || loc.hostname !== 'apps.onlykey.io') return null;
  return { url: samePageOn(OLD_APP, loc),
           text: 'OnlyKey firmware v3.0.4 or earlier? Use apps.crp.to' };
}

module.exports = {
  OLD_APP: OLD_APP,
  NEW_APP: NEW_APP,
  LAST_OLD_FIRMWARE: LAST_OLD_FIRMWARE,
  parseFirmwareVersion: parseFirmwareVersion,
  isNewFirmware: isNewFirmware,
  afterHandshake: afterHandshake,
  noAnswerHint: noAnswerHint,
};
