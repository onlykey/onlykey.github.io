window.addEventListener('message', function (event) {
	// if (originWhitelist.includes(event.origin)) {
	if (event.origin) {
		const action = event && event.data && event.data.action;
		msg(`HTML5 message received: ${action}`);
		return handleMessage({ event, action });
	} else {
		msg(`[ERROR: postMessage missing event.origin]`);
	}
});

function handleMessage(params = {}) {
	msg(`handleMessage params:`);
	msgObjectProps(params);

	const { event, action } = params;

	if (!(event && action)) {
		let err = `params event and action are required.`;
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

	switch(action) {
		case 'ENCRYPT':
			auth_sign(event.data.data, data => respondToAction({
				extensionId,
				ok_sig: data
			}));
			break;
		case 'DECRYPT':
			// perform auth_decrypt()
			break;
		default:
			// unhandled action
			break;
	}

}

function respondToAction(params = {}) {
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
