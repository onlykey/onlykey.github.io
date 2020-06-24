
module.exports = {
    consumes: ["app"],
    provides: ["bs_modal_dialog"],
    setup: function(options, imports, register) {
        
        var bs_modal_dialog;
        
        var modal = require("./bs.modal.html").default;
        register(null, {
            bs_modal_dialog: bs_modal_dialog = {
                
                confirm:function(title, question, answers, done){
                    var $ = imports.app.$;
                    
                    var m = $(modal);
                    
                    m.find(".modal-title").text(title);
                    m.find(".modal-body").text(question);
                    
                    for(var i in answers){
                        ((ans)=>{
                            var b = $(`<button type="button" class="btn btn-primary">${ans}</button>`);
                        b.click(function(){
                            m.modal("hide");
                            done(null, ans);
                        });
                        m.find(".modal-footer").append(b);
                        })(answers[i]);
                        
                    }
                    
                    var cancel = `<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>`;
                    m.find(".modal-footer").append(cancel);
                    

                    m.on("hidden.bs.modal",function(){
                        m.modal("dispose");
                        m.remove();
                    });
                    
                    m.appendTo("body");
                    m.modal('show');
                    return m;
                },
                
                init: function() {
                    
                    
                    imports.app.on("start",function(){
                        
                        /*bs_modal_dialog.confirm("Test Confirm","Would you like to do something?", ["Yes"], function(cancel, answer){
                            console.log(cancel, answer);
                            if(answer)alert(answer);
                        });*/
                        
                    });  
                }
            }
        });
        
        
    }
};