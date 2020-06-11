var init = false;
var page = {

  init: function(app, $page) {
    init = true;

    console.log("page", "init");

    page.setup(app, $page);
  },
  setup: function(app, $page) {
    if (!init)
      page.init(app, $page);
      
      
      var onlykey3rd = app.onlykey3rd;
      var ok = onlykey3rd(1, 0);
      var $ = app.$;
      
      $("#onlykey_start").click(async function() {
      var phrase = $("#phrase").val();
      ok.derive_public_key(phrase, function(error, phrasePubkey) {
        ok.derive_shared_secret(phrase, phrasePubkey, async function(error, phrasePubkeySecret) {
          $("#phrase_out").val(phrasePubkeySecret);
        });
      });
    });
    console.log("page", "setup");
  }
};

module.exports = page;