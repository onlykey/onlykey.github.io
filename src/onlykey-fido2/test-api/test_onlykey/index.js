module.exports = {
    provides: ["test_onlykey"],
    consumes: ["app", "test_list", "onlykeyApi", "kbpgp", "window"],
    setup: function(options, imports, register) {

        var EventEmitter = require("events").EventEmitter;

        register(null, {
            test_onlykey: {
                init: function() {
                    if ((findHID(3) || findHID(2))) {
                        
                        
                        //imports.test_list.add(require("./connect.js").bind({}, imports));
                        
                        // imports.test_list.add(require("./ecdh.js").bind({},imports));
                        
                        imports.test_list.add(require("./pgp.js").bind({}, imports));
                        
                        // imports.test_list.add(/*new Promise()*/);
                        
                        
                        
                        
                        return;
                    }else{
                        console.warn("Skipping ONLYKEY test (device not found)");
                    }

                    function findHID(hid_interface) {
                        const nodeHID = require('node-hid');
                        var hids = nodeHID.devices();

                        for (var i in hids) {
                            if (hids[i].product == "ONLYKEY") {
                                if (hids[i].interface == hid_interface) {
                                    return true;
                                }
                            }
                        }

                    }

                }
            }
        });
    }
}