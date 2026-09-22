/*
 * Send firmware newer than v3.0.4 to apps.onlykey.io.
 *
 * Newer firmware completes the OKCONNECT handshake here - apps.crp.to is in
 * its trusted-origin table - but it speaks transit v2, which this app does
 * not, so everything after the handshake is refused. The handshake reply
 * carries the version in the clear; node-onlykey stores it in
 * onlykeyApi.FWversion and then emits "ok-connected". On apps.crp.to only,
 * a newer key is sent to the same page on apps.onlykey.io. v3.0.4 and older,
 * beta firmware and no key at all stay here.
 *
 * version-route-core.js is the same file the apps.onlykey.io app uses.
 */
var versionRoute = require("./version-route-core.js");

module.exports = {
    consumes: ["app", "onlykeyApi", "window"],
    provides: ["versionRoute"],
    setup: function(options, imports, register) {
        var window = imports.window;
        var done = false;
        imports.app.on("ok-connected", function() {
            if (done) return;
            var route = versionRoute.afterHandshake(window.location, imports.onlykeyApi.FWversion);
            if (route.action !== "redirect") return;
            done = true;
            try {
                window.document.getElementById("header_messages").innerHTML +=
                    "<br><p class='text-info'>" + route.reason + ". Taking you there...</p>";
            } catch (e) {}
            window.location.replace(route.url);
        });
        register(null, { versionRoute: versionRoute });
    }
};
