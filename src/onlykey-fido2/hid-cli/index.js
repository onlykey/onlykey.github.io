// module.exports = function() {

//-- commandline args
var optimist = require('optimist')
	.usage('Usage: $0 --cmd [cmd]')
	.demand('cmd')
	.describe('cmd', 'Command to run settime , getlables')
	.alias('cmd', 'c')
	.describe('slot', 'slot id to choose')
	.alias('slot', 's')
	.describe('data', 'additional data')
	.alias('data', 'd')
	.describe('keytype', 'keytype')
	.alias('keytype', 't')
	.describe('help', 'Show Help')
	.alias('help', 'h').alias('help', '?');
	
	var argv = optimist.argv;
	
	if(argv.help){
		return optimist.showHelp();
	}

//-- INCLUDES

const nodeHID = require('node-hid');

//-- CONST / vars

const messageHeader = [255, 255, 255, 255];

const messageFields = {
	LABEL: 1,
	URL: 15,
	NEXTKEY4: 18, //Before Username
	NEXTKEY1: 16, //After Username
	DELAY1: 17,
	USERNAME: 2,
	NEXTKEY5: 19, //Before OTP
	NEXTKEY2: 3, //After Password
	DELAY2: 4,
	PASSWORD: 5,
	NEXTKEY3: 6, //After OTP
	DELAY3: 7,
	TFATYPE: 8,
	TFAUSERNAME: 9,
	YUBIAUTH: 10,
	LOCKOUT: 11,
	WIPEMODE: 12,
	BACKUPKEYMODE: 20,
	SSHCHALLENGEMODE: 21,
	PGPCHALLENGEMODE: 22,
	SECPROFILEMODE: 23,
	TYPESPEED: 13,
	LEDBRIGHTNESS: 24,
	LOCKBUTTON: 25,
	KBDLAYOUT: 14
};

const messages = {
	OKSETPIN: 225, //0xE1
	OKSETSDPIN: 226, //0xE2
	OKSETPIN2: 227, //0xE3
	OKSETTIME: 228, //0xE4
	OKGETLABELS: 229, //0xE5
	OKSETSLOT: 230, //0xE6
	OKWIPESLOT: 231, //0xE7
	OKSETU2FPRIV: 232, //0xE8
	OKWIPEU2FPRIV: 233, //0xE9
	OKSETU2FCERT: 234, //0xEA
	OKWIPEU2FCERT: 235, //0xEB
	OKGETPUBKEY: 236,
	OKSIGN: 237,
	OKWIPEPRIV: 238,
	OKSETPRIV: 239,
	OKDECRYPT: 240,
	OKRESTORE: 241,
	OKFWUPDATE: 244,
};


//--PROCESS

switch (argv.cmd) {
	case 'settime':
		setTime();
		break;

	case 'getlabels':
		getLabels();
		break;

	case 'getpub':
		getPub();
		break;

	default:

		console.log("argv", argv);

}



//-- FUNCTIONS

function findHID(hid_interface) {
	var hids = nodeHID.devices();

	for (var i in hids) {
		if (hids[i].product == "ONLYKEY") {
			if (hids[i].interface == hid_interface) {
				return hids[i];
			}
		}
	}
}

function sendMessage(com, options) {

	var bytesPerMessage = 64;

	var msgId = typeof options.msgId === 'string' ? options.msgId.toUpperCase() : null;
	var slotId = typeof options.slotId === 'number' || typeof options.slotId === 'string' ? options.slotId : null;
	var fieldId = typeof options.fieldId === 'string' || typeof options.fieldId === 'number' ? options.fieldId : null;
	var contents = typeof options.contents === 'number' || (options.contents && options.contents.length) ? options.contents : '';
	var contentType = (options.contentType && options.contentType.toUpperCase()) || 'HEX';

	// callback = typeof callback === 'function' ? callback : ()=>{} ;

	var reportId = 0;
	var bytes = new Uint8Array(bytesPerMessage);
	var cursor = 0;

	for (; cursor < messageHeader.length; cursor++) {
		bytes[cursor] = messageHeader[cursor];
	}

	if (msgId && messages[msgId]) {
		bytes[cursor] = strPad(messages[msgId], 2, 0);
		cursor++;
	}

	if (slotId !== null) {
		bytes[cursor] = strPad(slotId, 2, 0);
		cursor++;
	}

	if (fieldId !== null) {
		if (messageFields[fieldId]) {
			bytes[cursor] = strPad(messageFields[fieldId], 2, 0);
		}
		else {
			bytes[cursor] = fieldId;
		}

		cursor++;
	}

	if (!Array.isArray(contents)) {
		switch (typeof contents) {
			case 'string':
				contents = contents.replace(/\\x([a-fA-F0-9]{2})/g, (match, capture) => {
					return String.fromCharCode(parseInt(capture, 16));
				});

				for (var i = 0; i < contents.length && cursor < bytes.length; i++) {
					if (contents.charCodeAt(i) > 255) {
						throw "I am not smart enough to decode non-ASCII data.";
					}
					bytes[cursor++] = contents.charCodeAt(i);
				}
				break;
			case 'number':
				if (contents < 0 || contents > 255) {
					throw "Byte value out of bounds.";
				}
				bytes[cursor++] = contents;
				break;
		}
	}
	else {
		contents.forEach(function(val) {
			bytes[cursor++] = contentType === 'HEX' ? hexStrToDec(val) : val;
		});
	}

	var pad = 0;
	for (; cursor < bytes.length;) {
		bytes[cursor++] = pad;
	}

	console.info("SENDING " + msgId + " to connectionId " + this.connection + ":", bytes);

	var messageA = Array.from(bytes);
	messageA.unshift(reportId); //reportId
	com.write(messageA);

}

function setTime() {


	var hid = findHID(2);

	if (hid) {
		var com = new nodeHID.HID(hid.path);

		com.on("data", function(msg) {
			var msg_string = bytes2string(msg);

			// console.log("handleMessage", msg, msg_string);
			if (msg_string == "INITIALIZED")
				console.log("OnlyKey Locked");
			else if (msg_string.split("v")[0] == "UNLOCKED")
				console.log("OnlyKey UnLock... Time Set!");
			com.close();
		});


		var currentEpochTime = Math.round(new Date().getTime() / 1000.0).toString(16);
		// console.info("Setting current epoch time =", currentEpochTime);
		var timeParts = currentEpochTime.match(/.{2}/g);
		var options = {
			contents: timeParts,
			msgId: 'OKSETTIME'
		};
		sendMessage(com, options);

		//console.log(hid);
	}
	else {
		console.log("onlykey not detected");
	}

}


function getPub() {


	var hid = findHID(2);

	if (hid) {
		var com = new nodeHID.HID(hid.path);

		com.on("data", function(msg) {
			var msg_string = bytes2string(msg);

			console.log(msg,msg_string);

			com.close();
		});
		var crypto = require('crypto');
		var slot = parseInt(argv.slot, 10);
		var hash;
		
		if(slot == 132){
			hash = crypto.createHash('sha256').update(argv.data).digest();
		}else hash = '';
		hash = Array.from(hash);
		
		// console.log(hash instanceof Array,hash);
		
		hash.unshift(argv.keytype)
		var options = {
			contents: hash,
			slotId: parseInt(argv.slot, 10),
			msgId: 'OKGETPUBKEY'
		};
		sendMessage(com, options);

		//console.log(hid);
	}
	else {
		console.log("onlykey not detected");
	}

}

async function getLabels() {

	var hid = findHID(2);

	if (hid) {
		var com = new nodeHID.HID(hid.path);

		var messCount = 0;

		com.on("data", function(msg) {
			messCount += 1;
			msg = Array.from(msg);

			var msg_string = bytes2string(msg);

			// console.log("handleMessage", msg, msg_string);
			if (msg_string == "INITIALIZED")
				console.log("OnlyKey Locked");
			else if (msg_string.split("v")[0] == "UNLOCKED")
				console.log("OnlyKey UnLock... Time Set!");

			var slot = msg.shift();
			msg_string = bytes2string(msg);

			if (slot > 9) slot -= 6

			console.log("Slot:", slot, msg_string.split("|"))

			if (messCount == 12)
				com.close();
		});



		sendMessage(com, {
			msgId: 'OKGETLABELS'
		});

		//console.log(hid);
	}
	else {
		console.log("onlykey not detected");
	}

};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));


function strPad(str, places, char) {
	while (str.length < places) {
		str = "" + (char || 0) + str;
	}

	return str;
}


function hexStrToDec(hexStr) {
	return new Number('0x' + hexStr).toString(10);
}

function bytes2string(bytes) {
	if (!bytes) return;
	var ret = Array.from(bytes).map(function chr(c) {
		if (c == 0) return '';
		if (c == 255) return '';
		return String.fromCharCode(c);
	}).join('');
	return ret;
};

// };