var express = require("express");
var app = express();
var http = require('http');
var https = require('https');
var server = http.createServer(app);
var dirname = __dirname + "/onlykey.github.io/dev-new";

app.use((req, res, next) => {
  var u = req.url.split("?")[0]
  switch(u){
    case "/":
      req.url = "/index-dev.html";
      break;
    case "/search":
    case "/encrypt":
    case "/decrypt":
    case "/encrypt-file":
    case "/decrypt-file":
    case "/password-generator":
      req.url = u+"-dev.html";//+req.url.split("?")[1];
      break;
  }
    
      next();
});

app.use(express.static(dirname));
app.get('/protonmail/:action/:address_id*', (req, res, next) => {
  var address_id = req.params.address_id;
  var action = req.params.action;
  
  var url;
  switch(action){
    case "get":
      url = 'https://api.protonmail.ch/pks/lookup?op='+action+'&search=' + address_id;
      break;
    case "index":
    url = 'https://api.protonmail.ch/pks/lookup?op='+action+'&search=' + address_id;
      break;
      default:
        return next();
  }
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
      if(action == "get" && data.slice(0, 10) != '-----BEGIN'){
        return res.status(404).send('Not found');
      }
      res.send(data);
    });
  }).on("error", () => {
    next();
  });
});

server.listen(process.env.PORT, () => {
  console.log('listening on *:' + process.env.PORT);
});