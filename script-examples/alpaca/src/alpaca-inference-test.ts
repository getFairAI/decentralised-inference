import CONFIG from '../config.json';

const inference = async function (message: string) {
	const data = Buffer.from(message, 'utf-8').toString();
	console.log(data);
	const res = await fetch(CONFIG.url, {
	  method: 'POST',
	  body: message
	});
	const tempJSON = await res.json();
	const fullText = tempJSON.output;
	console.log(fullText);

	return fullText;
};

(async () => {
	await inference('Inferece test. Just answer something, please.');
})();

