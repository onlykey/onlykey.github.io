var tests = [];

tests.push(require("./test_pgp/index.js"));

tests.push(require("./test_list/index.js"));

tests.push(require("./test_onlykey/index.js"));

tests.push(require("./window_replacements/index.js"));

tests.push(require("../plugin.js"));

module.exports = tests;