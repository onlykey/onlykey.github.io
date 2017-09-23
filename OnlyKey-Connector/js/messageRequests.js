window.addEventListener('message', function (event) {
	// if (originWhitelist.includes(event.origin)) {
	msg(`onMessage event:`);
	for (var k in event) {
		msg(`${k}: ${JSON.stringify(event[k])}`);
	}

	if (event.origin) {
		const type = event && event.data && event.data.action;
		msg(`postMessage received: ${type}`);
		return handleMessage({ event, type, connector: new OnlyKeyConnector() });
	}
});

function handleMessage(params = {}) {
	msg(`handleMessage params: ${JSON.stringify(params)}`);

	const { event, type, connector } = params;

	if (!(event && type && connector)) {
		let err = `params event, type, and connector are required.`;
		msg(`handleMessage error: ${err}`)
		throw new ReferenceError(err);
	}

	msg(`handling message type ${type}`);
	msg(JSON.stringify(event));

	switch(type) {
		case 'GET_CONNECTOR':
			event.source.postMessage({ data: event.data, connector, type }, event.origin);
			break;
		default:
			// unhandled type
			break;
	}
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
