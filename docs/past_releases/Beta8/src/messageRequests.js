window.addEventListener('message', function (e) {
	console.dir(e);
	switch(e && e.data && e.data.action) {
		case "ENCRYPT":
			return handleEncryptMessage(e);
			break;
		default:
			//swallow
	}
});

function handleEncryptMessage(e) {
	e.source.postMessage({ result: 'ENCRYPTED', data: e.data }, e.origin);	
}
