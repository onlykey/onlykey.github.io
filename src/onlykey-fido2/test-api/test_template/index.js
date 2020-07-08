module.exports = {
    provides: ["test_name"],
    consumes: ["app", "test_list"],
    setup: function(options, imports, register) {

        var EventEmitter = require("events").EventEmitter;

        register(null, {
            test_name: {
                init:function(){
                    //imports.test_list.add(/*new Promise()*/);
                }
            }
        });
    }
}