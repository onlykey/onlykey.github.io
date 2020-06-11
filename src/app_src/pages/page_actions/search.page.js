var init = false;


var page = {

  init: function(app, $page) {
    init = true;

    console.log("page", "init");


    var onlykeyApi = app.onlykeyApi;
    var onlykeyPGP = app.onlykeyPGP;
    page.p2g = onlykeyPGP();

    var params = onlykeyApi.getAllUrlParams();


    if (params.q) {
      app.$('#user').val(params.q);
      // $('#submit').click();
    }

    page.setup(app, $page);
  },
  setup: function(app, $page, pathname) {
    if (!init)
      page.init(app, $page);

    var default_anonymous_email = "onlykey@crp.to";

    var forge = app.forge;
    var $ = app.$;

    document.getElementsByTagName('fieldset')[0].style.backgroundColor = app.randomColor({
      luminosity: 'bright',
      format: 'rgba'
    });


    $('#submit').click(function() {

      var sites = {
        q: $("#sites option:selected").val(),
        rpp: 5
      };
      var users = {
        q: $('#user').val(),
        rpp: 5
      };
      searchKeybase(sites, users);
    });


    if ($('#user').val())
      $('#submit').click();


    function searchLayout() {
      var outDiv = $("<div class='outline'>");
      $("#results").append(outDiv);
      var leftDiv_outter = $("<div class='yui3-u-1-2'>");
      outDiv.append(leftDiv_outter);
      var rightDiv_outter = $("<div class='yui3-u-1-2'>");
      outDiv.append(rightDiv_outter);
      var leftDiv = $("<div class='block-inner'>");
      leftDiv_outter.append(leftDiv);
      var rightDiv = $("<div class='block-inner'>");
      rightDiv_outter.append(rightDiv);

      return {
        outDiv: outDiv,
        leftDiv: leftDiv,
        leftDiv_outter: leftDiv_outter,
        rightDiv: rightDiv,
        rightDiv_outter: rightDiv_outter,
      };
    }

    async function searchKeybase(sites, user) {
      console.info("sites");
      console.info(sites);
      console.info("user");
      console.info(user);
      $("#results").html("");

      var $user = user.q;
      
      History.replaceState({ pathname: pathname}, page.button.textContent, "./search?q="+sites.q);
      
      switch (sites.q) {
        //https://keybase.io/_/api/1.0/user/lookup.json?uid=4a4f61cdab6a13fb904599ef0159bd19
        case 'protonmail':

          if ($user && !($user.indexOf("0x") == 0) && !$user.split("@")[1])
            $user += "@protonmail.com";

          var response_text = await app.onlykeyApi.getKey($user, "protonmail");
          console.log(response_text);


          var sl = searchLayout();

          // var decodedkey = pgpDecoder(response_text);
          // console.log(decodedkey);


          page.p2g.getPublicKeyInfo(response_text, function(theKey) {
            if (theKey) {

              var email = theKey.pgp.userids[0].components.email;
              var username = theKey.pgp.userids[0].components.username;
              var keyid = "0x" + theKey.find_crypt_pgp_key().get_key_id().toString("hex");
              var keyid_short = theKey.find_crypt_pgp_key().get_short_key_id();


              sl.leftDiv.append("<img src='https://www.gravatar.com/avatar/" + forge.md5.create().update(email).digest().toHex() + "?s=1024default=https%3A%2F%2Fgravatar.com%2Favatar%2F" + forge.md5.create().update(default_anonymous_email).digest().toHex() + "' />");
              sl.rightDiv.append("<font color='red'>Protonmail Username = " + username + "</font><br>");
              sl.rightDiv.append("<pre color='red'>GPG KeyID = " + keyid + " (" + keyid_short + ")" + "</pre><br>");
              sl.rightDiv.append("Send Encrypted <a href='/encrypt-dev.html?type=e&recipients=" + username + "'>Message</a> <a href='/encrypt-file-dev.html?type=e&recipients=" + username + "'>File</a><br>");

              var $getpgp_btn = $("<button>Copy PGP Key</button>");
              var $pgp_copybox = $("<textarea>&nbsp;</textarea>");
              sl.rightDiv.append($getpgp_btn);
              sl.rightDiv.append($pgp_copybox);
              $pgp_copybox.hide();
              $getpgp_btn.click(async function() {
                $pgp_copybox.val(response_text);
                $pgp_copybox.show();
                $pgp_copybox.focus();
                $pgp_copybox.select();
                document.execCommand('copy');
                $pgp_copybox.hide();
                var origTxt = $getpgp_btn.text();
                $getpgp_btn.text(origTxt + " (copied)");
                setTimeout(() => { $getpgp_btn.text(origTxt); }, 5000);
              });
              console.log(theKey);
            }
          });

          break;
        case 'keybase':
          var kburl = 'https://keybase.io/_/api/1.0/user/user_search.json?q=' + user.q;
          $.ajax({
            url: kburl,
            async: true,
            dataType: 'json',
            success: function(data) {
              console.info(data);
              var result = data.list;
              if (result && result.length)
                result.forEach(function(element) {
                  console.log(element);
                  console.log(element.components);
                  var listItem = element.keybase;

                  if (listItem.uid) {
                    $.ajax({
                      url: 'https://keybase.io/_/api/1.0/user/lookup.json?uid=' + listItem.uid,
                      async: true,
                      dataType: 'json',
                      success: function(data) {
                        console.log(data);
                        if (listItem.username) {

                          var sl = searchLayout();
                          if (listItem.picture_url != null)
                            sl.leftDiv.append("<img src='" + listItem.picture_url + "' width='10' height='auto'/><br>");
                          else sl.leftDiv.append("<img src='https://raw.githubusercontent.com/keybase/client/master/browser/images/icon-keybase-logo-128.png' />");


                          sl.rightDiv.append("<font color='red'>Keybase Username = " + listItem.username + "</font><br>");
                          if (listItem.full_name) sl.rightDiv.append("Full Name = " + listItem.full_name + "<br><br>");
                          sl.rightDiv.append("View Keybase Profile <a href='https://keybase.io/" + listItem.username + "'>Here</a><br>");
                          sl.rightDiv.append("Send Encrypted <a href='/encrypt?type=e&recipients=" + listItem.username + "'>Message</a> <a href='/encrypt-file?type=e&recipients=" + listItem.username + "'>File</a><br>");

                          for (var i in element.services_summary) {
                            sl.rightDiv.append("<font color='blue'>" + element.services_summary[i].service_name.toUpperCase() + " Username = " + element.services_summary[i].username + "</font><br>");
                          }
                          var $getpgp_btn = $("<button>Copy PGP Key</button>");
                          var $pgp_copybox = $("<textarea>&nbsp;</textarea>");
                          sl.rightDiv.append($getpgp_btn);
                          sl.rightDiv.append($pgp_copybox);
                          $pgp_copybox.hide();
                          $getpgp_btn.click(async function() {
                            var url = 'https://keybase.io/' + listItem.username + '/pgp_keys.asc';
                            var response_text = await app.onlykeyApi.getKey(url);
                            $pgp_copybox.val(response_text);
                            $pgp_copybox.show();
                            $pgp_copybox.focus();
                            $pgp_copybox.select();
                            var successful = document.execCommand('copy');
                            $pgp_copybox.hide();
                            var origTxt = $getpgp_btn.text();
                            $getpgp_btn.text(origTxt + " (copied)");
                            setTimeout(() => { $getpgp_btn.text(origTxt); }, 5000);
                          });
                        }
                      }
                    });
                  }
                  // else {
                  //   $("#results").append("<br>No matchs found!");
                  // }
                });
            }
          });
          break;
        case 'protonmail':
          break;

      }


      $(window).scrollTo("h4", 800);
    }

    console.log("page", "setup");
  }
};

module.exports = page;