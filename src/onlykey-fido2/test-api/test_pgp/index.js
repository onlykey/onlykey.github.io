module.exports = {
    provides: ["test_pgp"],
    consumes: ["app", "test_list", "kbpgp"],
    setup: function(options, imports, register) {

        var EventEmitter = require("events").EventEmitter;

        register(null, {
            test_pgp: {
                init:function(){
                    imports.test_list.add(require("./kbpgp.js").bind({},imports.kbpgp));
                }
            }
        });
    }
}