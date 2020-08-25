module.exports = function(sender,OKKB, subkey) {

  var custid = OKKB.custom_keyid.join(",");
  
  var $sender = {};
  for(var j in sender){
    if(typeof(sender[j]) == "function"){
      try{ $sender[j] = sender[j]() } catch(e){}
    }else{
      $sender[j] = sender[j]
    }
  }

  
  var $keyids = [];
  var keyids = sender.get_all_pgp_key_materials();
  for (var i in keyids) {
    var key = keyids[i][0];
    var kid = parseKeyID(key.get_key_id()).join(",");
    // if(custid == kid){
      var report = {};
      report._MATCH = (custid == kid);
      for(var j in key){
        if(typeof(key[j]) == "function"){
          try{ report[j] = key[j]() } catch(e){}
        }else{
          report[j] = key[j]
        }
      }
      $keyids.push(report);
      //$keyids.push([key, parseKeyID(key.get_key_id()).join(",")]);
    // }
  }

  return $keyids
  
  function parseKeyID(key){
    var cid = key.toString('hex').toUpperCase();
     return cid.match(/.{2}/g).map(hexStrToDec);
  }
}

function hexStrToDec(hexStr) {
  return ~~(new Number('0x' + hexStr).toString(10));
};