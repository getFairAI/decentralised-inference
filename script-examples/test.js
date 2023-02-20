const CONFIG = require('./config.json');
const fs = require("fs");
const Bundlr = require("@bundlr-network/client");
const Arweave = require("arweave")
const { graphql, buildSchema } = require('graphql');

const start = async function() {
	// load the JWK wallet key file from disk
	//let key = JSON.parse(fs.readFileSync("walletFile.txt").toString());
	const JWK = JSON.parse(fs.readFileSync("wallet.json").toString());

	// initailze the bundlr SDK
	const bundlr = new Bundlr.default("http://node1.bundlr.network", "arweave", JWK);
	
	// Print your wallet address
	console.log(`wallet address = ${bundlr.address}`);
	
	// Check the price to upload 1MB of data
	// The function accepts a number of bytes, so to check the price of
	// 1MB, check the price of 1,048,576 bytes.
	const dataSizeToCheck = 1048576;
	const price1MBAtomic = await bundlr.getPrice(dataSizeToCheck);
	
	// To ensure accuracy when performing mathematical operations
	// on fractional numbers in JavaScript, it is common to use atomic units.
	// This is a way to represent a floating point (decimal) number using non-decimal notation.
	// Once we have the value in atomic units, we can convert it into something easier to read.
	const price1MBConverted = bundlr.utils.unitConverter(price1MBAtomic);
	console.log(`Uploading 1MB to Bundlr costs $${price1MBConverted}`);
	
	// Do Inference
	var res = await fetch(CONFIG.url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			"sender": "test_user",
			"message": "Hi there!"
		})
	});
	var tempJSON;
	tempJSON = await res.json();
	var fullText = "";
	tempJSON.forEach(post => {
		console.log(`${post.text}`);
		fullText = fullText + `${post.text}`;
	});
	console.log(fullText);
		
	// Send text message to file
	var blob = new Blob([fullText],
                { type: "text/plain" });
        var jsonData = {
            'text': fullText
        };
	var jsonContent = JSON.stringify(jsonData);
	console.log(jsonContent);
	
	const fileName = "output.json";
	
	fs.writeFile(fileName, jsonContent, 'utf8', function (err) {
    		if (err) {
        		console.log("An error occured while writing JSON Object to File.");
        		return console.log(err);
    		}
 
    		console.log("JSON file has been saved.");
    	});
    	
    	//BUNDLR:
	
	const { size } = await fs.promises.stat(fileName);
	const price = await bundlr.getPrice(size);
	console.log(price);
	//await bundlr.fund(price);
	
	// Get loaded balance in atomic units
	let atomicBalance = await bundlr.getLoadedBalance();
	console.log(`node balance (atomic units) = ${atomicBalance}`);

	// Convert balance to an easier to read format
	let convertedBalance = bundlr.utils.unitConverter(atomicBalance);
	console.log(`node balance (converted) = ${convertedBalance}`);
	
	const tags = [
	  {name: "Content-Type", value: "application/json"},
	];
	
	try {
	    const transaction = await bundlr.uploadFile("./" + fileName, { tags });
	    //await transaction.sign()
  	    //await transaction.upload()

  	    //console.log('transaction id: ', transaction.id)
	    console.log(`Data uploaded ==> https://arweave.net/${transaction.id}`);
	} catch (e) {
	    console.log("Error uploading file ", e);
	}
	
	//ARWEAVE-JS
	
	/*
	let request = require("request");

	let options = {
	 method: 'POST',
	 url: 'https://arweave.net/graphql'
	};

	request(options, function (error, response, body) { 
	  if (error){
	   console.error(error); 
	  }
	  console.log('Arweave network height is: ' + JSON.parse(body).height);
	});
	*/
	
	// initialize an arweave instance
	const arweave = Arweave.init({
	    host: 'arweave.net',
	    port: 443,
	    protocol: 'https'
	});
	
	const buildQuery = () => {
	    const queryObject = { query: `
		query {
		    transactions(recipients:["M6w588ZkR8SVFdPkNXdBy4sqbMN0Y3F8ZJUWm2WCm8M"]) {
			edges {
			    node {
				id
			    }
			}
		    }
		}
	`}
	  return queryObject;
	}
	
	const query = buildQuery();
	try {
	    const results = await arweave.api.post('graphql', query);
	    const edges = results.data.data.transactions.edges;
	    console.log(edges);
	} catch (e) {
	    console.log("GraphQL query failed: ", e);
	}
	
	
	const address = await arweave.wallets.jwkToAddress(JWK);
	
	//const balance = await arweave.wallets.getBalance(address);
	//console.log(balance);
	
	let transaction = await arweave.createTransaction({
  		data: jsonContent
	}, JWK);
	
	// add a custom tag that tells the gateway how to serve this data to a browser
	transaction.addTag('Content-Type', 'text/plain');
	
	// Now we sign the transaction
	await arweave.transactions.sign(transaction, JWK);
	
	let uploader = await arweave.transactions.getUploader(transaction);
	
	while (!uploader.isComplete) {
		await uploader.uploadChunk();
		console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
		console.log(`Data uploaded ==> https://arweave.net/${transaction.id}`);
	}	
	
}

start();

