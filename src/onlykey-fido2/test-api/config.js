var tests = [];

// test KBPGP.js to confirm the normal API works without onlykey modifications
tests.push(require("./test_pgp/index.js"));

tests.push(require("./test_list/index.js"));// test list plugin, to control testing orders

tests.push(require("./test_onlykey/index.js")); // onlykey test scenarios

tests.push(require("./window_replacements/index.js"));//load replacement onlykey need for plugin

tests.push(require("../plugin.js"));//load onlykey plugin for testing

module.exports = tests;