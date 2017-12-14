window.addEventListener('message', function (event) {
	// if (originWhitelist.includes(event.origin)) {
	if (event.origin) {
		const action = event && event.data && event.data.action;
		msg(`HTML5 message received: ${action}`);
		return handleMessage({ event });
	} else {
		msg(`[ERROR: postMessage missing event.origin]`);
	}
});

async function handleMessage(params = {}) {
	msg(`handleMessage params:`);
	msgObjectProps(params);

	const { event } = params;

	if (!event) {
		let err = `param 'event' is required.`;
		msg(`handleMessage error: ${err}`)
		console.error(ReferenceError(err));
		return false;
	}

	const extensionId = event.origin.split("//")[1];
	if (!validExtensionId(extensionId)) {
		// don't respond to unexpected origins
		return false;
	}

	msg(`Confirmed message from valid extension ${extensionId}`);

	const options = {};

	switch(event.data.action) {
		case 'ENCRYPT':
			options.ct = event.data.cipherText;
			options.poll_delay = event.data.poll_delay;
			await init();
			auth_sign(options, data => respondToEncrypt({
				extensionId,
				ok_sig: data
			}));
			break;
		case 'DECRYPT':
			options.ct = event.data.packetRaw;
			auth_decrypt(options, data => respondToDecrypt({
				extensionId,
				ok_sesskey: data
			}));
			// perform auth_decrypt()
			break;
		default:
			// unhandled action
			break;
	}

}

function respondToEncrypt(params = {}) {
	msg(`Responding to extension`);
	msgObjectProps(params);

	const { extensionId, ok_sig } = params;
	chrome.runtime.sendMessage(extensionId, { ok_sig },
		response => {
			if (!response.success) {
				msg(`sendMessage response failed:`);
				msg(JSON.stringify(response));
			} else {
				msg(`SUCCESS`);
			}
		});
}

function respondToDecrypt(params = {}) {
	msg(`Responding to extension`);
	msgObjectProps(params);

	const { extensionId, ok_sesskey } = params;
	chrome.runtime.sendMessage(extensionId, { ok_sesskey },
		response => {
			if (!response.success) {
				msg(`sendMessage response failed:`);
				msg(JSON.stringify(response));
			} else {
				msg(`SUCCESS`);
			}
		});
}

const originWhitelist = [
	'https://'
];

function validExtensionId(str) {
	const re = /^[A-Za-z]{32}$/;
	const matchArr = str.match(re);
	return (matchArr && matchArr.length);
}

function msgObjectProps(obj) {
	if (typeof obj === 'object') {
		for (var k in obj) {
			msg(`> ${k}: ${JSON.stringify(obj[k])}`);
		}
	} else {
		msg(`[value]: ${obj}`);
	}
}
