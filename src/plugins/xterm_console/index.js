module.exports = {
    consumes: ["app", "$"],
    provides: ["xterm"],
    setup: function(options, imports, register) {
        var $ = imports.$;
        var xtermjs = require("xterm");
        var FitAddon = require("xterm-addon-fit").FitAddon;
        var Terminal = xtermjs.Terminal;


        var term_escape = {};

        // found cool articles
        // @ https://tforgione.fr/posts/ansi-escape-codes/
        // @ https://notes.burke.libbey.me/ansi-escape-codes/
        // note: some of escapes code don't work in xtermjs but maybe listed here (try em out)
        (function() {
            var colorRGB = function(c) { return '\x1b[38;2;' + c + 'm'; };
            var color_swatch = {
                "red": "255;0;0",
                "orange": "255;165;0",
                "yellow": "255;255;0",
                "green": "50;205;50",
                "teal": "0;128;128",
                "blue": "0;0;255",
                "purple": "128;0;128",
                "white": "255;255;255",
            };
            for (var i in color_swatch) {
                term_escape[i] = colorRGB(color_swatch[i]);
            }
            var styles_swatch = {
                reset: "\x1b[0m",
                bright: "\x1b[1m",
                dim: "\x1b[2m",
                underscore: "\x1b[4m",
                // blink: "\x1b[5m",  //xtermjs no effect
                inverse: "\x1b[7m", // reverses color like highlight
                hidden: "\x1b[8m",
                strike: "\x1b[9m",
            };
            for (var i in styles_swatch) {
                term_escape[i] = styles_swatch[i];
            }

            var cursor_swatch = {
                cursor_back_one: "\b", // back 1 char
                cursor_move_one_up: "\x1b[A", //up 1 row
                cursor_move_one_down: "\x1b[B", //up 1 row
                cursor_erase_line: "\x1b[2K", // erase to end
                cursor_back_to_begining_line: "\r",
                cursor_back_to_begining_previous_line: "\x1b[F",
                // cursor_moves n lines up (replace N by the number of lines)	"\x1B[NA"
                // cursor_back_to_begining of the n-th previous line (replace N by the number of lines)	"\x1B[NF"
            }
            for (var i in cursor_swatch) {
                term_escape[i] = cursor_swatch[i];
            }

        })();

        var countMe = 0;

        function oneSecInterval() {
            _self.log("Test " + ++countMe);
            _self.log("hello","world", 1, { brad: "test" } , ["lol"]);
        }
        
        console.log()

        var appTerm = new Terminal({
            fontFamily: "monospace",
            theme: { // don't use escape codes here
                foreground: "black",
                background: "white",
                selection: "yellow",
                cursor: "pink",
                cursorAccent: "red",

                /*
                brightBlack:"",
                brightBlue:"",
                brightCyan:"",
                brightGreen:"",
                brightMagenta:"",
                brightRed:"",
                brightWhite:"",
                brightYellow:"",
                
                black:"",
                blue:"",
                cyan:"",
                green:"",
                magenta:"",
                red:"",
                white:"",
                yellow:"",
                */
            }
        });
        var fitAddon = new FitAddon();
        appTerm.loadAddon(fitAddon);
        $(window).resize(function() {
            fitAddon.fit();
        });



        var bellLoaded = false;

        function loadBeepAudio(done) {
            var xmlHTTP = new XMLHttpRequest();
            xmlHTTP.open('GET', 'sounds/beep.mp3', true);

            // Must include this line - specifies the response type we want
            xmlHTTP.responseType = 'arraybuffer';

            xmlHTTP.onload = function(e) {

                var arr = new Uint8Array(this.response);


                // Convert the int array to a binary string
                // We have to use apply() as we are converting an *array*
                // and String.fromCharCode() takes one or more single values, not
                // an array.
                var raw = String.fromCharCode.apply(null, arr);

                // This works!!!
                var b64 = window.btoa(raw);
                var dataURL = "data:audio/mpeg;base64," + b64;
                appTerm.setOption("bellSound", dataURL);
                appTerm.setOption("bellStyle", "sound");
                bellLoaded = true;
                if (done) done();
            };

            xmlHTTP.send();
        }

        function playBell() {
            if (!bellLoaded) {
                loadBeepAudio(function() {
                    appTerm._core._soundService.playBellSound();
                })
            }
            else
                appTerm._core._soundService.playBellSound();
        }

        appTerm.writeln(term_escape.green + "OnlyKey WebCrypt Log Will Appear Here" + term_escape.reset);


        var _self;
        register(null, {
            xterm: _self = {
                playBell: playBell,
                appTerm: appTerm,
                set_element: function(terminal_element) {
                    _self.open(terminal_element[0]);
                    fitAddon.fit();
                },
                rewrite: function(text) {
                    appTerm.write(term_escape.cursor_back_to_begining_line + term_escape.cursor_erase_line);
                    appTerm.write(text);
                },
                rewriteln: function(text) {
                    appTerm.write(term_escape.cursor_move_one_up);
                    appTerm.write(term_escape.cursor_erase_line);
                    appTerm.writeln(text);
                },
                log: function() {
                    for (var i = 0; i < arguments.length; i++) {
                        var isEnd = (arguments.length-1 == i);
                        // var isBegin = (i == 0);
                        var arg = arguments[i];
                        var type = typeof arg;
                        if(arg instanceof Array)
                            type = 'array';
                        var val = "";
                        switch(type){
                            case 'string':
                                val = arg;
                                break;
                            case 'number':
                                val = term_escape.blue+arg+term_escape.reset;
                                break;
                            case 'object':
                                val = JSON.stringify(arg);
                                break;
                            case 'array':
                                val = JSON.stringify(arg);
                                break;
                        }
                        if(!isEnd) val += " ";
                        appTerm[isEnd ? 'writeln' : 'write'](val);
                    }
                },
                write: appTerm.write.bind(appTerm),
                writeln: appTerm.writeln.bind(appTerm),
                open: appTerm.open.bind(appTerm),
                load_xterm:function(){
                    var temEle = $("#terminal_messages");
                    if(temEle.length == 1){
                        _self.set_element($("#terminal_messages"));
                        $("#terminal_messages").addClass('terminal_messages_style');
                    }
                },
                init: function() {

                    imports.app.on("start", _self.load_xterm);

                }
            }
        });


    }
};