module.exports = {
    consumes: ["app"],
    provides: ["console"],
    setup: function(options, imports, register) {


        register(null, {
            console: console
        });


    }
};