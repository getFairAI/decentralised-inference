
![Latest Development Changes](https://github.com/FAIR-Protocol/decentralized-inference/actions/workflows/development.yml/badge.svg?event=push)

# Decentralized Inference

Welcome to the Fair Protocol GitHub! Please read our [Whitepaper](./documents/whitepaper.md) to understand more about this application.

## File Structure
```bash
├── poc-ng-wireframes
├── client
├── LICENSE
├── README.md
├── package-lock.json 
└── .gitignore
```

## Installation
Initialize Submodule:
```
git submodule update  --init --recursive --remote
```

Enter Client directory and install dependencies:
```
cd client
npm run build-deps && npm install
```

## Running
Initiate the application in a local environment:
```
npm run dev
```

## Rules, Terms, and Conditions of the App

### Terminology:

* A Creator is anyone who inserts trained models on the Fair Protocol marketplace;
* A User is anyone who requests inference tasks on models inserted by Creators;
* An Operator is anyone who responds to those inferences requests made by Users, running the specified model inference and returning it.

All the communication between participants in this network is done through Arweave. This means that a Creator inserts trained models on Arweave, so users can request inferences on those models through Arweave, and Operators can send responses on Arweave. When anything is written on Arweave, it's stored forever, due to the particularities of that blockchain.

A Creator defines all the rules needed to install a model, as well as the script that the Operators should run, and the rules for getting such a script to work. A Creator then sends all this data to Arweave, and for his model to be listed in the marketplace he must pay a fee to the marketplace of 0.1 AR. The fee is intended to filter out people who want to put junk on the marketplace.

To become an Operator you have to install a template inserted in Arweave by a Creator, following the rules defined by that Creator. These rules should result in a script that will run in some kind of infinite loop, waiting for some inference request to be made by a User. **It is the Operator's responsibility to verify that a Creator's code and rules make sense and are legit. The instructions may be a scam and the code may contain malware. We highly advise you to use a PC other than your own to perform the inferences.**

After a successful installation, an Operator should make a transaction to Arweave saying that it started business on that specific model, in order to inform the marketplace. This transaction will have an extra cost of 0.05 AR, sent to the marketplace, to filter out some potential bad actors. Operators charge a fee for performing inferences to Users. This fee is specified by themselves in the start business transaction.

**If an Operator starts business, but doen't return any inference required by a User within **X blocks**, it will be removed from the marketplace as a viable option to perform inference, and will only be able to perform inference again if it realizes a new transaction to open a business.** **To do: decide about blocks/time until penalization**

**Statistics are especially important for Operators, as this is what Users will rely on when choosing someone to perform inference. To obtain the best possible statistics, an Operator must return as many inferences as possible without failing to return any.**

Operators can decide to terminate business whenever they want. To do so, they should send a new transaction, specifying this business termination. This transaction will be free of costs, and the advantage of doing it will be that no penalization will be executed by the marketplace to the Operator, and will have best stats. They can start business again later on. **To do: specify rules for this in the app**

To reward the train of models executed by Creators as well as the fees paid by those Creators when submitting models to Arweave, the marketplace ensures that every time a User requests an inference on a specified model to an Operator, it pays an extra 5% fee to the Operator, so the Operator can reward afterwards the Creator of that model. 

The Fair Protocol marketplace will ensure that all participants follow all the rules specified, charging another 5% fee for that service to Users when they request inferences. Those 5% will be paid to Operators, that in turn will pay to the marketplace. **If any of those extra fees are not paid by the Operator, the marketplace won't show the results of the inference to the User. If was the Operator who didn't had paid back, he will be penalized by the marketplace, by not being shown as a valid option to Users.** **To do: detail more these rules**

By using this app, you accept all these rules, terms, and conditions specified above.
