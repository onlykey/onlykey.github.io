window.addEventListener('message', function (e) {
	console.dir(e);
	// if (originWhitelist.includes(e.origin)) {
	if (e.origin) {
		switch(e && e.data && e.data.action) {
			case "GET_CONNECTOR":
				return new OnlyKeyConnector();
				break;
			default:
				//swallow
		}
	}
});

function handleEncryptMessage(e) {
	e.source.postMessage({ result: 'ENCRYPTED', data: e.data }, e.origin);	
}

const originWhitelist = [
	'https://'
];

class OnlyKeyConnector {
	constructor(params) {
		this.Sign = auth_sign;
		this.Decrypt = auth_decrypt;
	}
}
