var tokenizer = function($, onAddTokenizerItem) {
    if (!$.fn.tokenizer) {
        var PubSub = function() {
                this.topics = {};
                this.id = 0;
            },

            Tokenizer = function(element, options) {
                this.$formInput = $(element);
                this.channel = new PubSub();
                this.options = $.extend({}, $.fn.tokenizer.defaults, options);
                this.placeHolderText = element.placeholder;
                this.initialize(element);
            },

            List = function(channel, tokenizer) {
                this.tokenizer = tokenizer;
                this.channel = channel;
                this.initialize();
            },

            Item = function(channel, value) {
                this.channel = channel;
                this.value = value;
                this.initialize();
            },

            Input = function(channel, delimiters) {
                this.channel = channel;
                this.delimiters = delimiters;
                this.initialize();
            };

        PubSub.prototype = {
            subscribe(topic, callback) {
                if (!this.topics[topic]) {
                    this.topics[topic] = {};
                }
                this.topics[topic][this.id] = callback;
                return this.id++;
            },

            publish(topic, args) {
                for (var id in this.topics[topic]) {
                    this.topics[topic][id].apply(this, [].concat(args));
                }
            }
        };

        Tokenizer.prototype = {
            constructor: Tokenizer,

            initialize() {
                this.input = new Input(this.channel, this.options.delimiters);

                this.list = new List(this.channel, this)
                    .add(this.input);

                this.$formInput.attr("type", "hidden");
                this.$formInput.hide();
                this.$element = $("<div class='tokenizer'></div>")
                    .attr("id", this.$formInput.attr("id") + "_tokenizer")
                    .append(this.list.$element)
                    .on("click", $.proxy(this.handleClick, this))
                    .on("focusin", $.proxy(this.handleFocus, this))
                    .on("focusout", $.proxy(this.handleBlur, this))
                    // .width(this.$formInput.width())
                    .insertAfter(this.$formInput);
                $(window).on("")

                this.list.$list.append("<li class='placeholder'></li>");

                this.parseFormInput();
                this.list.$element.find(".placeholder").text(this.placeHolderText);
                if (this.list.values().length > 0) {
                    this.list.$element.find(".placeholder").hide();
                }
                this.channel.subscribe("add", $.proxy(this.handleAdd, this));
                this.channel.subscribe("remove", $.proxy(this.handleRemove, this));
                this.channel.subscribe("keyup", $.proxy(this.checkPlaceholder, this));

            },

            add(value) {
                if (value) {
                    var item = new Item(this.channel, value),
                        index = this.list.indexOf(this.input);
                    this.list.add(item, index);
                    this.updateFormInput();
                }
                return this;
            },

            handleAdd(value) {
                if (value) {
                    this.add(value);
                    this.input.blur().focus();
                }
            },

            checkPlaceholder(blured) {
                if (this.input.$element.text().length) {
                    this.list.$element.find(".placeholder").hide();
                }
                else if (this.list.values().length === 0) {
                    this.list.$element.find(".placeholder").show();
                }
                else {
                    this.list.$element.find(".placeholder").hide();
                }
            },
            
            addInput(){
                this.add(this.input.clearValue());
            },
            
            handleBlur() {
                //this.add(this.input.clearValue());

                this.$element.removeClass("focused");

                this.checkPlaceholder(true);
            },

            handleClick() {
                this.input.focus();
            },

            handleFocus(event) {
                if(!this.$element.hasClass("focused")){
                try {
                    var range = document.createRange();
                    var sel = window.getSelection();
                    range.setStart(this.input.$element[0], 1);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                catch (e) {}
                }
                
                this.$element.addClass("focused");

                this.checkPlaceholder();
                // this.list.$element.find(".placeholder").hide();
                // this.input.blur().focus();
                
            },

            handleRemove(item) {
                var val = this.remove(item);
                this.input.blur().focus();

                if (val) {
                    var self = this;
                    self.input.setValue(val);
                    // setTimeout(()=>{


                    // this.input.blur().focus();

                    // },100)
                }
                // this.input.$element[0].selectionStart = this.input.$element[0].selectionEnd = this.input.$element[0].value.length;
            },

            parseFormInput() {
                var values = this.$formInput.val().split(this.options.separator);
                for (var i = 0, j = 0; i < values.length; ++i) {
                    if (values[i]) {
                        this.list.add(new Item(this.channel, unescape(values[i])), j++);
                    }
                }
                this.input.focus().blur();
            },

            remove(item) {
                var val;
                if (!item) {
                    item = this.list.getPreceding(this.input);
                    if (item) {
                        val = item.$element.text()
                        
                    }
                }
                if (item) {
                    this.list.remove(item);
                    this.updateFormInput();
                }
                return val;
            },

            updateFormInput() {
                this.$formInput.attr("value", this.list.values().map(function(val){
                    return escape(val);
                }).join(this.options.separator));
                this.$formInput.change();
            }
        };

        List.prototype = {
            constructor: List,

            initialize() {
                this.$list = $("<ul></ul>");
                this.$element = $("<div></div>")
                    .append(this.$list);

                this.items = [];
                this.views = [];
            },

            add(item, index) {
                var view = $("<li></li>").append(item.$element);
                if (index >= 0) {
                    view.insertBefore(this.views[index]);
                    this.items.splice(index, 0, item);
                    this.views.splice(index, 0, view);
                }
                else {
                    this.$list.append(view);
                    this.items.push(item);
                    this.views.push(view);
                }
                var _self = this;
                if (item.value) {
                    if (item.value.slice(0, 10) !== "-----BEGIN") {
                        onAddTokenizerItem(item.value, function(datavalue) {
                            if (datavalue) {
                                item.$element.css("color", "green");
                                _self.tokenizer.$formInput.data("data-" + item.value, datavalue);
                            }
                            else { item.$element.css("color", "red"); }
                        });
                    }
                    else {
                        item.$element.css("color", "green");
                        _self.tokenizer.$formInput.data("data-" + item.value, item.value);
                    }
                }
                return this;
            },

            getPreceding(item) {
                return this.items[$.inArray(item, this.items) - 1];
            },

            indexOf(item) {
                return $.inArray(item, this.items);
            },

            remove(item) {
                var index = $.inArray(item, this.items);
                if (index >= 0) {
                    this.items.splice(index, 1);
                    this.views.splice(index, 1)[0].remove();
                }
                return this;
            },

            values() {
                return $.map(this.items, function(i) { return i.value; });
            }
        };

        Input.prototype = {
            constructor: Input,

            initialize() {
                this.$element = $("<span class='tokenizer_input' contenteditable='true'></span>");
                this.$element.on("keydown", $.proxy(this.handleKeydown, this));
                this.$element.on("keyup", $.proxy(this.handleKeyup, this));
            },

            blur() {
                this.$element.trigger("blur");
                return this;
            },

            clearValue() {
                var value = this.$element.html()
                    .replace(/<\/div><div>/g, "\r\n")
                    .replace(/<br>/g, "")
                    .replace(/<\/div>/g, "")
                    .replace(/<div>/g, "");
                this.$element.text("");
                return value;
            },

            setValue(value) {
                this.$element.text(value);
                
                var range = document.createRange();
                var sel = window.getSelection();
                range.setStart(this.$element[0], 1);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);

            },

            focus() {
                this.$element.focus();
                this.$element.trigger("focus");
                return this;
            },

            isEmpty() {
                return !this.$element.text();
            },

            handleKeydown(event) {
                if ($.inArray(event.keyCode, this.delimiters) > -1) {
                    if (!(event.keyCode == 9)) {
                        event.stopPropagation();
                        event.preventDefault();
                    }
                    this.channel.publish("add", this.clearValue());
                }
                else if (event.keyCode === 8 && this.isEmpty()) {
                    event.stopPropagation();
                    event.preventDefault();
                    this.channel.publish("remove");
                }
                this.channel.publish("keydown");
            },

            handleKeyup(event) {
                this.channel.publish("keyup");
            }
        };

        Item.prototype = {
            constructor: Item,

            initialize() {
                this.$icon = $("<svg class='remove-icon' class='bi bi-x-circle-fill' width='1em' height='1em' viewBox='0 0 16 16' fill='currentColor' xmlns='http://www.w3.org/2000/svg'><path fill-rule='evenodd' d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-4.146-3.146a.5.5 0 0 0-.708-.708L8 7.293 4.854 4.146a.5.5 0 1 0-.708.708L7.293 8l-3.147 3.146a.5.5 0 0 0 .708.708L8 8.707l3.146 3.147a.5.5 0 0 0 .708-.708L8.707 8l3.147-3.146z'/></svg>")
                    .on("click", $.proxy(this.handleRemoveClick, this));
                this.$element = $("<span class='label'></span>")
                    .append(this.value.replace(/\r\n/g, "<br>"))
                    .append(this.$icon);
            },

            handleRemoveClick(event) {
                this.channel.publish("remove", this);
            }
        };

        /* TOKENIZER PLUGIN DEFINITION
         * =========================== */

        $.fn.tokenizer = function(option) {
            return this.filter("input").each(function() {
                var $this = $(this),
                    data = $this.data("tokenizer"),
                    options = typeof option === "object" && option;
                if (!data) {
                    $this.data("tokenizer", (data = new Tokenizer(this, options)));
                }
                if (typeof option === "string") {
                    data[option]();
                }
            });
        };

        $.fn.tokenizer.defaults = {
            separator: ",",
            delimiters: [9, 13, 32, 188] // [tab, enter, space, comma]
        };

        $.fn.tokenizer.Constructor = Tokenizer;

    }
    /* TOKENIZER DATA-API
     * ================== */

    /*$(function() {
        return;*/
    // setTimeout(function(){
    // $("input[data-provide='tokenizer']").each(function() {
    //     var $element = $(this);
    //     if ($element.data("tokenizer")) {
    //         return;
    //     }
    //     $element.tokenizer($element.data());
    // });
    // },5000)
    //});


};

module.exports = tokenizer;