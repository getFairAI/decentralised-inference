![Latest Development Changes](https://github.com/FAIR-Protocol/decentralized-inference/actions/workflows/development.yml/badge.svg?event=push)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=FAIR-Protocol_decentralised-inference&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=FAIR-Protocol_decentralised-inference)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=FAIR-Protocol_decentralised-inference&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=FAIR-Protocol_decentralised-inference)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=FAIR-Protocol_decentralised-inference&metric=bugs)](https://sonarcloud.io/summary/new_code?id=FAIR-Protocol_decentralised-inference)

# Fair Protocol

Welcome to the Fair Protocol GitHub! Please read our [whitepaper](./documents/whitepaper.md) to understand more about this application.
Online [marketplace](https://fair.g8way.io/) permanently on arweave.

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
Enter Client directory and install dependencies:
```
cd client
npm install
```

## Running
Initiate the application in a local environment:
```
npm run dev
```

## Rules, Terms, and Conditions of the App to Users

All the communication between participants in this network is done through Arweave. When anything is written on Arweave, it's publicly stored forever due to the particularities of that blockchain. As such, kindly exercise caution when inserting any information on this website.

By using this app, you acknowledge and accept these terms and conditions.

## Rules, Terms, and Conditions of the App to Operators

For more detailed and updated information, we recommend reading Fair Protocol's whitepaper (https://fairwhitepaper.arweave.dev/) with attention before becoming an Operator.

To become an Operator, you must install a template inserted in Arweave by a CUrator, following the rules defined by that Curator. These rules should result in a script waiting for some inference request from Users in an infinite loop. **The Operator is responsible for verifying that a Curator's code and rules make sense and are legitimate. The instructions may be a scam, and the code may contain malware. We highly advise using a PC other than your own to perform the inferences.**

**If an Operator starts an activity but doesn't return any inference required by a User within 7 blocks, it will be removed from the Marketplace as a viable option to perform inference. The wallet from the Operator can only perform inferences again if it realises a new transaction to open activity.**

**Operators must return as many inferences as possible without failures to obtain the best likely statistics. Statistics are vital for Operators, as this is what Users will rely on when choosing someone to perform inference.**

Operators can decide to terminate the activity whenever they want. They should send a new transaction specifying this business termination to end it, and they can also restart it again later on. This transaction will be free of costs, and the advantage of doing it will be that the Marketplace won't penalise the Operator since the Users won't be left without a response. As such, the Operator will have better statistics.

The Fair Protocol marketplace will ensure that all participants follow all the specified rules, charging users another 5% fee for that service when they request inferences. Those 5% will be paid to Operators, which will pay them back to the Marketplace. **If the Operator does not send the fees to the Marketplace within 7 Arweave blocks, the Marketplace won't list to Users the Operator anymore.**

By becoming an Operator, you accept all these rules, terms, and conditions.

## Protocol Owned Wallets
Vault Address: `tXd-BOaxmxtgswzwMLnryROAYlX5uDC9-XK2P4VNCQQ`

Deploy Address: `RQFarhgXPXYkgRM0Lzv088MllseKQWEdnEiRUggteIo`
