import CONFIG from './config.json';
import fs from 'fs';
import Bundlr from '@bundlr-network/client';
import Arweave from 'arweave';
import { graphql, buildSchema } from 'graphql';
import { ApolloClient, gql, InMemoryCache } from '@apollo/client/core';
import { JWKInterface } from 'arweave/node/lib/wallet';

const sendToBundlr = async function (
  fullText: string,
  appVersion: string,
  userAddress: string,
  requestTransaction: string,
  conversationIdentifier: string,
  JWK: JWKInterface
) {
  // initailze the bundlr SDK
  //const bundlr: Bundlr = new (Bundlr as any).default(
  const bundlr: Bundlr = new Bundlr(
    "http://node1.bundlr.network",
    "arweave",
    JWK
  );

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

  /*
	const { size } = await fs.promises.stat(fileName);
	const price = await bundlr.getPrice(size);
	console.log(price);
  */

  // Get loaded balance in atomic units
  let atomicBalance = await bundlr.getLoadedBalance();
  console.log(`node balance (atomic units) = ${atomicBalance}`);

  // Convert balance to an easier to read format
  let convertedBalance = bundlr.utils.unitConverter(atomicBalance);
  console.log(`node balance (converted) = ${convertedBalance}`);

  const tags = [
    { name: "App-Name", value: "Fair Protocol" },
    { name: "App-Version", value: appVersion },
    { name: "Model-Creator", value: CONFIG.modelCreator },
    { name: "Model-Name", value: CONFIG.modelName },
    { name: "Model-User", value: userAddress },
    { name: "Request-Transaction", value: requestTransaction },
    { name: "Operation-Name", value: "Model Inference Response" },
    { name: "Conversation-Identifier", value: conversationIdentifier },
    { name: "Content-Type", value: "application/json" },
    { name: "Unix-Time", value: (Date.now() / 1000).toString() },
  ];

  try {
    const transaction = await bundlr.upload(fullText, { tags });

    console.log(`Data uploaded ==> https://arweave.net/${transaction.id}`);
    return transaction.id;
  } catch (e) {
    console.log("Error uploading file ", e);
  }
};

const inference = async function (message: string) {
	const data = Buffer.from(message, 'utf-8').toString();
	console.log(data);
	var res = await fetch(CONFIG.url, {
	  method: "POST",
	  body: message
	});
	var tempJSON;
	tempJSON = await res.json();
	var fullText = tempJSON.output;
	console.log(fullText);

	return fullText;
  };

const sendFee = async function (
  arweave: Arweave,
  operatorFee: number,
  fullText: string,
  appVersion: string,
  userAddress: string,
  requestTransaction: string,
  conversationIdentifier: string,
  responseTransaction: string,
  key: JWKInterface
) {
  //  create a wallet-to-wallet transaction sending the marketplace fee to the target address
  let tx = await arweave.createTransaction(
    {
      target: CONFIG.marketplaceWallet,
      quantity: (operatorFee * CONFIG.inferencePercentageFee).toString(),
    },
    key
  );
  
  tx.addTag('App-Name', 'Fair Protocol');
  tx.addTag('App-Version', appVersion);
  tx.addTag('Model-Creator', CONFIG.modelCreator);
  tx.addTag('Model-Name', CONFIG.modelName);
  tx.addTag('Model-User', userAddress);
  tx.addTag('Request-Transaction', requestTransaction);
  tx.addTag('Operation-Name', 'Fee Redistribution');
  tx.addTag('Conversation-Identifier', conversationIdentifier);
  tx.addTag('Content-Type', 'application/json');
  tx.addTag('Response-Transaction', responseTransaction);
  tx.addTag('Unix-Time', (Date.now() / 1000).toString());

  // you must sign the transaction with your key before posting
  await arweave.transactions.sign(tx, key);
  
  console.log(tx);

  // post the transaction
  const res = await arweave.transactions.post(tx);
  if (res.status === 200) {
    console.log("Fee paid successfully to the Marketplace.");
  } else {
    console.log(res);
  }
};

const start = async function () {
  // load the JWK wallet key file from disk
  const JWK = JSON.parse(fs.readFileSync("wallet.json").toString());

  const clientGateway = new ApolloClient({
    uri: "https://arweave.net:443/graphql",
    cache: new InMemoryCache(),
  });

  const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });

  const address = await arweave.wallets.jwkToAddress(JWK);

  const buildQueryOperatorFee = () => {
    const queryObjectOperatorFee = {
      query: gql`
		query {
		    transactions(
		    	first: 1,
		    	owners:["${address}"],
		    	tags: [
			    	{
					name: "Operation-Name",
					values: ["Operator Registration"]
				},
				{
					name: "Model-Creator",
					values: ["${CONFIG.modelCreator}"]
				},
				{
					name: "Model-Name",
					values: ["${CONFIG.modelName}"]
				}
			],
			sort: HEIGHT_DESC
		    ) {
			edges {
			    node {
				id
				tags {
				    name
				    value
				}
				block {
				    id
				    timestamp
				    height
				    previous
				}
			    }
			}
		    }
		}
	`,
    };
    return queryObjectOperatorFee;
  };

  var query = buildQueryOperatorFee();
  var operatorFee = -1;
  try {
    const resultOperatorFee = await clientGateway.query(query);
    const edges = resultOperatorFee.data.transactions.edges;

	var firstValidTransaction = -1;
	for (let i = 0; i < edges.length; i++) {
		const getTransactionStatus = await arweave.transactions.getStatus(edges[i].node.id);
		const isTransactionConfirmed = !!getTransactionStatus.confirmed && getTransactionStatus.confirmed.number_of_confirmations > CONFIG.minBlockConfirmations;
		if (isTransactionConfirmed) {
			firstValidTransaction = i;
			break;
		}
	}
	if (firstValidTransaction == -1) {
		throw new Error("Program didn't found any conformed Operator-Fee.");
	}

    // console.log(edges);
    var tags = edges[firstValidTransaction].node.tags;
    for (let i = 0; i < tags.length; i++) {
      if (tags[i].name == "Operator-Fee") {
        operatorFee = tags[i].value;
        console.log(tags[i].value);
      }
    }
    if (operatorFee == -1) {
      throw new Error("Program didn't found a valid Operator-Fee tag.");
    }
  } catch (e) {
    console.log("GraphQL query for Operator-Fee failed: ", e);
  }

  const buildQueryTransactionsReceived = () => {
    const queryObjectTransactionsReceived = {
      query: gql`
		query {
		    transactions(
		    	tags: [
			    	{
					name: "Operation-Name",
					values: ["Model Inference Request"]
				},
				{
					name: "Model-Creator",
					values: ["${CONFIG.modelCreator}"]
				},
				{
					name: "Model-Name",
					values: ["${CONFIG.modelName}"]
				},
				{
					name: "Model-Operator",
					values: ["${address}"]
				}
			],
			sort: HEIGHT_DESC
		    ) {
			edges {
			    node {
				id
				owner {
				    address
				    key
				}
				quantity {
				    winston
				    ar
				}
				tags {
				    name
				    value
				}
			    }
			}
		    }
		}
	`,
    };
    return queryObjectTransactionsReceived;
  };

  const buildQueryTransactionAnswered = (transactionId: string) => {
    const queryObjectTransactionAnswered = {
      query: gql`
		query {
		    transactions(
		    	first: 1,
		    	owners:["${address}"],
		    	tags: [
			    	{
					name: "Operation-Name",
					values: ["Model Inference Response"]
				},
				{
					name: "Model-Creator",
					values: ["${CONFIG.modelCreator}"]
				},
				{
					name: "Model-Name",
					values: ["${CONFIG.modelName}"]
				},
				{
					name: "Request-Transaction",
					values: ["${transactionId}"]
				}
			],
			sort: HEIGHT_DESC
		    ) {
			edges {
			    node {
				id
				owner {
				    address
				    key
				}
				quantity {
				    winston
				    ar
				}
				tags {
				    name
				    value
				}
			    }
			}
		    }
		}
	`,
    };
    return queryObjectTransactionAnswered;
  };

  const buildQueryCheckUserModelRequests = (userAddress: string) => {
    const queryObjectCheckUserModelRequests = {
      query: gql`
		query {
		    transactions(
		    	owners:["${userAddress}"],
		    	tags: [
			    	{
					name: "Operation-Name",
					values: ["Inference Request"]
				},
				{
					name: "Model-Creator",
					values: ["${CONFIG.modelCreator}"]
				},
				{
					name: "Model-Name",
					values: ["${CONFIG.modelName}"]
				}
			],
			sort: HEIGHT_DESC
		    ) {
			edges {
			    node {
				id
				quantity {
				    winston
				    ar
				}
				tags {
				    name
				    value
				}
			    }
			}
		    }
		}
	`,
    };
    return queryObjectCheckUserModelRequests;
  };
  
  const buildQueryCheckUserPayment = (userAddress: string, inferenceTransaction: string) => {
    const queryObjectCheckUserPayment = {
      query: gql`
		query {
		    transactions(
		    	first: 1,
		    	owners:["${userAddress}"],
		    	tags: [
			    	{
					name: "Operation-Name",
					values: ["Inference Payment"]
				},
				{
					name: "Model-Creator",
					values: ["${CONFIG.modelCreator}"]
				},
				{
					name: "Model-Name",
					values: ["${CONFIG.modelName}"]
				},
				{
					name: "Inference-Transaction",
					values: ["${inferenceTransaction}"]
				}
			],
			sort: HEIGHT_DESC
		    ) {
			edges {
			    node {
				id
				quantity {
				    winston
				    ar
				}
				tags {
				    name
				    value
				}
			    }
			}
		    }
		}
	`,
    };
    return queryObjectCheckUserPayment;
  };

  const buildQueryModelFee = (userAddress: string) => {
    const queryObjectModelFee = {
      query: gql`
		query {
		    transactions(
		    	first: 1,
		    	owners:["${CONFIG.modelCreator}"],
		    	tags: [
			    	{
					name: "Operation-Name",
					values: ["Model Creation"]
				},
				{
					name: "Model-Name",
					values: ["${CONFIG.modelName}"]
				}
			],
			sort: HEIGHT_DESC
		    ) {
			edges {
			    node {
				id
				quantity {
				    winston
				    ar
				}
				tags {
				    name
				    value
				}
			    }
			}
		    }
		}
	`,
    };
    return queryObjectModelFee;
  };
  
  const buildQueryCheckUserCreatorPayment = (userAddress: string) => {
    const queryObjectCheckUserCreatorPayment = {
      query: gql`
		query {
		    transactions(
		    	owners:["${userAddress}"],
		    	recipients:["${CONFIG.modelCreator}"],
		    	tags: [
			    	{
					name: "Operation-Name",
					values: ["Model Fee Payment"]
				},
				{
					name: "Model-Creator",
					values: ["${CONFIG.modelCreator}"]
				},
				{
					name: "Model-Name",
					values: ["${CONFIG.modelName}"]
				}
			],
			sort: HEIGHT_DESC
		    ) {
			edges {
			    node {
				id
				quantity {
				    winston
				    ar
				}
				tags {
				    name
				    value
				}
			    }
			}
		    }
		}
	`,
    };
    return queryObjectCheckUserCreatorPayment;
  };

  try {
    // load the JWK wallet key file from disk
    const JWK = JSON.parse(fs.readFileSync("wallet.json").toString());

    query = buildQueryTransactionsReceived();
    const resultTransactionsReceived = await clientGateway.query(query);
    var edges = resultTransactionsReceived.data.transactions.edges;
    //console.log(resultTransactionsReceived.data.transactions.edges);

    for (let i = 0; i < edges.length; i++) {
      // Initialization of variables:
      
      var userHasPaidCreator = true;
      var userHasPaidOperators = true;
    
      // Check if request already answered:
      
      query = buildQueryTransactionAnswered(edges[i].node.id);
      var resultTransactionAnswered = await clientGateway.query(query);
      if (
        JSON.stringify(resultTransactionAnswered.data.transactions.edges) ===
        "[]"
      ) {
      
        
        // Creator Validations:
      	
      	query = buildQueryModelFee(edges[i].node.owner.address);
      	const modelFeeQuery = await clientGateway.query(query);
      	var modelFeeEdges = modelFeeQuery.data.transactions.edges;

      	var modelFee = -1;
      	for (let j = 0; j < modelFeeEdges[0].node.tags.length; j++) {
			if (modelFeeEdges[0].node.tags[j].name == "Model-Fee") {
				modelFee = parseFloat(modelFeeEdges[0].node.tags[j].value);
			}
       	}
        
      	query = buildQueryCheckUserCreatorPayment(edges[i].node.owner.address);
      	const userCreatorPayment = await clientGateway.query(query);
      	var userCreatorPaymentEdges = userCreatorPayment.data.transactions.edges;
		const getTransactionStatus = await arweave.transactions.getStatus(userCreatorPaymentEdges[0].node.id);
		const isTransactionConfirmed = !!getTransactionStatus.confirmed && getTransactionStatus.confirmed.number_of_confirmations > CONFIG.minBlockConfirmations;

		if(isTransactionConfirmed) {
			var creatorPaymentAmount = 0;
			for (let i = 0; i < userCreatorPaymentEdges.length; i++) {
			creatorPaymentAmount = creatorPaymentAmount + userCreatorPaymentEdges[i].node.quantity.winston;
			}
			console.log(creatorPaymentAmount);
			if (creatorPaymentAmount < modelFee) {
			userHasPaidCreator = false;
			}
			console.log(userHasPaidCreator);
		}
    
    	
    	// Operator Validations:
    	
    	if (userHasPaidCreator) {
      	  query = buildQueryCheckUserModelRequests(edges[i].node.owner.address);
     	  const checkUserModelRequests = await clientGateway.query(query);
      	  var checkUserModelRequestsEdges = checkUserModelRequests.data.transactions.edges;
		  console.log(checkUserModelRequestsEdges[0]);
      	  
      	  for (let i = 0; i < checkUserModelRequestsEdges.length; i++) {
      	    query = buildQueryCheckUserPayment(edges[i].node.owner.address, checkUserModelRequestsEdges[i].node.id);
     	    const checkUserPayment = await clientGateway.query(query);
      	    var checkUserPaymentEdges = checkUserPayment.data.transactions.edges;
      	    console.log(checkUserPaymentEdges[0]);
      	    
			if (operatorFee < checkUserPaymentEdges[0].node.quantity.winston) {
      	      userHasPaidOperators = false;
      	    }
      	  }
      	}
      	
      	
      	// Do Inference and send it to Bundlr:

      	if (userHasPaidCreator && userHasPaidOperators) {
          var appVersion = "null";
          var conversationIdentifier = "null";
          for (let j = 0; j < edges[i].node.tags.length; j++) {
            if (edges[i].node.tags[j].name == "App-Version") {
              appVersion = edges[i].node.tags[j].value;
            } else if (edges[i].node.tags[j].name == "Conversation-Identifier") {
              conversationIdentifier = edges[i].node.tags[j].value;
            }
          }
        
          await fetch("https://arweave.net/" + edges[i].node.id).then(async (data) => {
            await data.blob().then(async (blob) => {
              await blob.text().then(async (inferenceText) => {
                console.log(inferenceText);
                await inference(inferenceText).then(async (fullText) => {
                  console.log(fullText);
                  await sendToBundlr(
                    fullText,
                    appVersion,
                    edges[i].node.owner.address,
                    edges[i].node.id,
                    conversationIdentifier,
                    JWK
                  ).then(async (transactionId) => {
                    console.log(transactionId?.toString());
                    if(transactionId) {
	              await sendFee(
		        	arweave,
					operatorFee,
		        	fullText,
	                appVersion,
	                edges[i].node.owner.address,
	                edges[i].node.id,
	                conversationIdentifier,
	              	transactionId,
	                JWK
		      );
		    }
                  });
                });
              });
            });
          });
        } else {
          console.log(
            typeof resultTransactionAnswered.data.transactions.edges
          );
          console.log(
	    "Transaction with ID '" +
	    edges[i].node.id +
	    "' didn't paid enough amount."
  	  );
        }
      }
    }
  } catch (e) {
    console.log("GraphQL query for Model-Transactions failed: ", e);
  }
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cycle() {
  while (true) {
    await start();
    await sleep(CONFIG.sleepTimeSeconds * 1000);
    console.log(
      `Slept for ${CONFIG.sleepTimeSeconds} second(s). Restarting cycle now...`
    );
  }
}

cycle();
