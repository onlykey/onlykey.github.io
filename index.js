var express = require("express");
var app = express();
var http = require('http');
var https = require('https');


const fs = require('fs')

var server;
if(!process.env.PORT){
  process.env.PORT = 3000;
  
  var cert; 
  try{
    server = https.createServer({
      key: fs.readFileSync('_._server.key'),
      cert: cert = fs.readFileSync('_._server.cert')
    }, app);
  }catch(e){}
  if(!cert){
    console.log("need to run this command in terminal in project dir", __dirname);
    console.log("' $ openssl req -nodes -new -x509 -keyout _._server.key -out _._server.cert '");
    server = http.createServer(app);
  }
}else{
  server = http.createServer(app);
}


var dirname = __dirname + "/docs";


app.use((req, res, next) => {
  var u = req.url.split("?")[0];
  var q = req.url.split("?")[1];
  switch (u) {
    case "/":
      req.url = getFile("/index");
      break;
    case "/beta7/":
      res.redirect("/past_releases/beta7/");
      break;
    case "/search":
    case "/encrypt":
    case "/decrypt":
    case "/encrypt-file":
    case "/decrypt-file":
    case "/password-generator":
      res.redirect("/app"+u+ (q && q.length ? "?"+req.url.split("?")[1] : ""));
      break;
    default:
      req.url = getFile(u)+(q && q.length ? "?"+req.url.split("?")[1] : "");
      break;
  }

      next();
  
});

function getFile(filePath, prev) { //   /filename =  /filename || /filename.html || /filename-dev.html
  try {
    if (fs.existsSync(dirname + filePath)) {
      return filePath;
    }
    else throw new Error("Not Found");
  }
  catch (e) {
    try {
      if (fs.existsSync(dirname + filePath + ".html")) {
        return filePath + ".html";
      }
      else throw new Error("Not Found");
    }
    catch (e) {
      try {
        if (fs.existsSync(dirname + filePath + "-dev.html")) {
          return filePath + "-dev.html";
        }
        else throw new Error("Not Found");
      }
      catch (e) {
        // if(!prev)
        //   return getFile("/index", filePath);
        // else return prev;
        return filePath;
      }
    }
  }

}

app.use(express.static(dirname));
app.get('/protonmail/:action/:address_id*', (req, res, next) => {
  var address_id = req.params.address_id;
  var action = req.params.action;

  var url;
  switch (action) {
    case "get":
      url = 'https://api.protonmail.ch/pks/lookup?op=' + action + '&search=' + address_id;
      break;
    case "index":
      url = 'https://api.protonmail.ch/pks/lookup?op=' + action + '&search=' + address_id;
      break;
    default:
      return next();
  }
  res.set("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.set('Content-Type', 'text/plain');
  //https://api.protonmail.ch/pks/lookup?op=index&search=bmatusiak@protonmail.com
  //https://api.protonmail.ch/pks/lookup?op=get&search=bmatusiak@protonmail.com

  //https://api.protonmail.ch/pks/lookup?op=index&search=0x0acad543e682989d <--keyid
  //https://api.protonmail.ch/pks/lookup?op=get&search=0x0acad543e682989d <--keyid

  //https://api.protonmail.ch/pks/lookup?op=index&search=0x0396d70ff10f3c9175a76f0a149a3dc46e2e6313
  //https://api.protonmail.ch/pks/lookup?op=get&search=0x0396d70ff10f3c9175a76f0a149a3dc46e2e6313 
  https.get(url, (resp) => {
    var data = '';
    resp.on('data', (chunk) => {
      data += chunk;
    });
    resp.on('end', () => {
      if (action == "get" && data.slice(0, 10) != '-----BEGIN') {
        return res.status(404).send('Not found');
      }
      res.send(data);
    });
  }).on("error", () => {
    next();
  });
});




var $server = server.listen(process.env.PORT, () => {
  console.log('listening on *:' + process.env.PORT);
});


var Gun = require('gun');
Gun.log = function() {};
Gun.log.once = function() {};
require('gun/axe'); // is there a GUN BUG with this?
require('gun/nts'); // is there a GUN BUG with this?


var gunOptions = {
    file: 'radata',
    web: $server,
    super: false,
    stats: true
};

var gun = Gun(gunOptions);

