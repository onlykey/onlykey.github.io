module.exports = {
    consumes: ["app", "$"],
    provides: ["ok-status-icon"],
    setup: function(options, imports, register) {
        var demo = false;
        var colorSwatch = {
            "red": "255, 0, 0",
            "orange": "255, 165, 0",
            "yellow": "255, 255, 0",
            "green": "50, 205, 50",
            "teal": "0, 128, 128",
            "blue": "0, 0, 255",
            "purple": "128, 0, 128",
        };
        //--------------------------------------------
        var $ = imports.$;
        var wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        var html_template;
        var rainbowRunning = false;
        var pulseRunning = false;
        function setColor(color) {
            if (colorSwatch[color]) {
                color = "rgb(" + colorSwatch[color] + ")";
            }
            if (html_template) {
                if (color) {
                    if(!isInserted())
                        connection_pos(true);
                    html_template.find(".ok-staus-color").
                    css("filter", "drop-shadow(0 0 0.75rem " + color + ")");
                }
                else {
                    html_template.find(".ok-staus-color").
                    css("filter", "");
                }
            }
        }
        var rb_colorSwatch = [];
        for (var color in colorSwatch) {
            rb_colorSwatch.push(color);
            setColor[color] = (c => {
                return function(pulse) {
                    setColor.off();
                    if (pulse)
                        doPulse(c);
                    else
                        setColor(c);
                };
            })(color);
        }
        setColor.rainbow = function() {
            var loopSwatch = [].concat(rb_colorSwatch, [].concat(rb_colorSwatch).reverse()); //cylon
            var ri;
            var pdone;
            connection_pos(function(){
                if(pdone) return;
                ri = setInterval(function() {
                    loopSwatch.unshift(loopSwatch.pop());
                    setColor(loopSwatch[0]);
                }, 100);    
            });
            rainbowRunning = function() {
                pdone = true;
                setColor(false);
                clearInterval(ri);
                rainbowRunning = false;
            };
        };
        setColor.off = function(disconnect) {
            if (rainbowRunning)
                rainbowRunning();
            if (pulseRunning)
                pulseRunning();
            setColor(false);
            if(disconnect) connection_pos();
        };
        function doPulse(color) {
            var c = colorSwatch[color];
            if (!c) c = color;
            var i = 0;
            var d;
            var ri;
            var pdone = false;
            connection_pos(function(){
                if(pdone) return;
                ri = setInterval(function() {
                if (i >= 1) d = 1;
                if (i <= 0) d = 0;
                if (d == 1)
                    i -= 0.1;
                else
                    i += 0.1;

                setColor("rgba(" + c + "," + i + ")");

            }, 100);
            
            });
            pulseRunning = function() {
                pdone = true;
                setColor(false);
                if(ri)
                    clearInterval(ri);
                pulseRunning = false;
            };
        }
        var insertDist = "30";
        var _inserted = false;
        function isInserted() {
            return !!_inserted;
        }
        function connection_pos(inserted) {
            _inserted = !!inserted;
            if(!html_template) return;
            if (inserted) {
                html_template.animate({
                    "margin-left": insertDist
                }, 250, function() {
                    un_inserted_animation.inAnimation = false;
                    if(typeof inserted == "function") inserted();
                });
            }
            else {
                html_template.animate({
                    "margin-left": "-"+insertDist
                }, 250, function() {
                    un_inserted_animation.inAnimation = false;
                });
            }
            un_inserted_animation.inAnimation = true;
        }
        html_template = imports.$(require("./ok-status.template.html").default);
        html_template.find("img").on("load", function() {
            finishRegister();
            
            if(!html_template) return;
            $('[src="ok-plugged4.png"]').attr("src", "ok-plugged5.png");
            html_template.css("position", "absolute");
            html_template.css("display", "inline");
            html_template.css("float", "left");
            html_template.css("z-index", "-1");
            html_template.css("top", "185px");
            // connection_pos();
            setInterval(un_inserted_animation.interval, 500);
        });
        var un_inserted_animation = {
            length_loop: 12,
            step: -1,
            inAnimation: false,
            interval: function() {
                if (un_inserted_animation.inAnimation) return;

                if (un_inserted_animation.step > un_inserted_animation.length_loop)
                    un_inserted_animation.step = -1;
                un_inserted_animation.step++;

                if (!isInserted()) {
                    if (un_inserted_animation.step == 8 || un_inserted_animation.step == 10) {
                        html_template.animate({
                            "margin-left": insertDist
                        }, 250, function() {
                            un_inserted_animation.inAnimation = false;
                        });
                    }
                    else {
                        html_template.animate({
                            "margin-left": "-"+insertDist
                        }, 250, function() {
                            un_inserted_animation.inAnimation = false;
                        });
                    }
                    un_inserted_animation.inAnimation = true;
                }
                else {
                    un_inserted_animation.step = -1;
                }
            }

        };
        var ch = imports.$("body").find('[src="ok-plugged4.png"]');
        if(ch[0])
            ch.parent().prepend(html_template);
        else html_template = false;
        
        function finishRegister(){
        register(null, {
            "ok-status-icon": {
                setColor: setColor,
                init: function() {
                    imports.app.on("start", function() {
                        setColor.off(true);// default state
                        if(demo){
                            setTimeout(async function() {
                                setColor.rainbow();
                                await wait(5000);
                                setColor.green();//solid
                                await wait(5000);
                                setColor.yellow(true);//pulse
                                await wait(5000);
                                setColor.red();//solid
                                await wait(5000);
                                setColor.off(true);//disconnected and led off
                            }, 10000);
                        }else{
                            imports.app.on("ok-disconnected", function(){
                                setColor.off(true);
                            });
                            imports.app.on("ok-connecting", function(){
                                setColor.rainbow();
                            });
                            imports.app.on("ok-connected", function(){
                                setColor.green();
                            });
                            imports.app.on("ok-activity", function(){
                                setColor.blue(true);
                            });
                            imports.app.on("ok-error", function(){
                                setColor.red();
                            });
                            imports.app.on("ok-signing", function(){
                                setColor.purple(true);
                            });
                            imports.app.on("ok-decrypting", function(){
                                setColor.teal(true);
                            });
                            imports.app.on("ok-waiting", function(){
                                setColor.yellow(true);
                            });
                        }
                    });
                }
            }
        });
        }
    }
};