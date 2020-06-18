module.exports = (function() {
    //https://github.com/ConradIrwin/gpg-decoder
    var Base64 = require("./base64.js");
    var Stream = require("./stream.js");
    var Packet = require("./packet.js");

    function decode(text) {
        if(!text) return false;
        var packets = [];
        
        text = text.split("\n\n")[1].split("\n=")[0].replace(/\n/g, "");

        var bytes = Base64.decode(text);
        
        var stream = new Stream(bytes);

        do {
            var packet = new Packet(stream);
            packet.parse();
            packets.push(packet);
        } while (stream.pos < stream.end);

        return packets;
    }

    return decode;
})();