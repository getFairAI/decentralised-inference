# Fair Protocol Tags

This document provides detailed information about the Fair Platform marketplace transactions, specifically the tags included in such transactions. Please read the [Fair Protocol whitepaper](https://lqcpjipmt2d2daazjknargowboxuhn3wgealzbqdsjmwxbgli52q.arweave.net/XAT0oeyeh6GAGUqaCJnWC69Dt3YxALyGA5JZa4TLR3U) to understand the context of this document or to have a deeper explanation of each one of the transactions.

**Note**: Tag Values inside `<>` are example values, all other Tag Values are strict.

## Index
* [Common Tags](#common-tags)
* [Save Transaction Tags](#save-transaction)
* Creator Flow
  * [Model upload](#model-upload-to-bundlr)
  * [Model upload payment](#model-upload-payment-to-marketplace)
  * [Attachment](#attachment)
* User Flow
  * [Script fee payment](#script-fee-payment)
  * [Script inference request](#script-inference-request)
  * [Script inference payment](#script-inference-payment)
  * [Conversation Start](#conversation-start)
* Operator Flow
  * [Registration](#operator-registration)
  * [Script Inference response](#script-inference-response)
  * [Fee Redistribution](#inference-redistribution)
* Curator Flow
  * [Script upload](#scripts-upload)
  * [Script upload payment](#scripts-upload-payment)

## Common Tags
This Tags are applied in all the transactions executed in the platform

| Tag-Name     | Optional    | Tag Value         | Description                                                  |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------ |
| App-Name     | False       | Fair-Protocol     | Name of the Application.                                     |
| App-Version  | False       | < v0.01 >         | Version of the Application.                                  |
| Content-Type | True        | < text/markdown > | Type of transaction content, only used if content is a file. |
| Unix-Time    | False       | <1680017348>      | Timestamp in seconds.                                        |

Example:
```json
{
  "App-Name": "Fair-Protocol",
  "App-Version": "v0.01",
  "Content-Type": "text/markdown", // data content type
  "Unix-Time": "1680017348", // Unix Timestamp in seconds
}
```

## Save Transaction

Dispatch Transaction submitted when any payment is done without an associated biundlr transaction. This Transaction serves as a guaranteed record keeping when a payment is done, registering every payment tags in order to be able to retry later if payment transaction fails to be included in the network.

| Tag-Name         | Optional    | Tag Value                   | Description                                                  |
| ---------------- | ----------- | --------------------------- | ------------------------------------------------------------ |
| Operation-Name   | False       | < Model Fee Payment Save >  | Name of the Operationm, must be one of `'Model Fee Payment Save' \| 'Operator Registration Save'` |
| Payment-Quantity | False       | < 1000000000000 >           | Quantity paid in the corresponding payment transaction       |
| Paymnent-Target  | False       | < Example Address >         | Address of the recipient in the corresponding payment transaction |

**NOTE: This Transaction will need to include all the same tags of the corresponding payment transaction** 

Example:
```json
{
  "Model-Name": "Example Name",
  "Model-Creator": "28x8B6eWAMSXs8MyndatFuUZbJBfpmr7VXe4N1JxTU8", 
  "Model-Transaction": "WRitxdSWNl51RgI9OYuGg7-_rb4YuP-rBxZ1jf_wnrA",
  "Operator-Fee": "1000000000000", // winston value
  "Operation-Name": "Operator Registration Save",
  "Operator-Name": "Example Operator Name",
  "Payment-Quantity": "1000000000000",
  "Payment-Target": "28x8B6eWAMSXs8MyndatFuUZbJBfpmr7VXe4N1JxTU8"
}
```

----

# Model upload to Bundlr

When a creator uploads a model to the platform the transaction occurs with the following tags:

| Tag-Name       | Optional    | Tag Value               | Description                                                 
| -------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Model-Name     | False       | < ExampleName >         | Name of the model uploaded.                                                          |
| Model-Fee      | False       | < 1000000000000 >       | Fee To be paid to Creator by the Curator when uploading scrips for a model.          |
| Operation-Name | False       | Model Creation          | Name of the Operation executed in the application.                                   |
| Description    | True        | < Example Description > | Model Description.                                                                   |
| Payment-Quantity | False       | < 1000000000000 >           | Quantity paid in the corresponding payment transaction                         |
| Paymnent-Target  | False       | < Example Address >         | Address of the recipient in the corresponding payment transaction              |

Example:
```json
{
  "Model-Name": "Example Name",
  "Model-Fee": "1000000000000", // winston value
  "Operation-Name": "Model Creation",
  "Category": "text",
  "Description?": "Example Description", // Optional
  "Payment-Quantity": "1000000000000",
  "Paymnet-Target": "28x8B6eWAMSXs8MyndatFuUZbJBfpmr7VXe4N1JxTU8"
}
```

----

## Model Upload Payment to marketplace

Besides the model upload, a second transaction is sent to arweave corresponding to the `upload fee` payment. This transaction is a wallet to wallet transaction from the user to the `MARKETPLACE_ADDRESS` with a fixed quantity of `MARKETPLACE_FEE`, the transaction corresponds to the `upload fee` detailed in the [economy section of the whitepaper](./whitepaper.md#v-marketplace-economy):

| Tag-Name          | Optional    | Tag Value               | Description                                                 
| ----------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Model-Name        | False       | < ExampleName >         | Name of the model uploaded.                                                          |
| Model-Fee         | False       | < 1000000000000 >       | Fee To be paid to Creator by the Curator when uploading scrips for a model.          |
| Operation-Name    | False       | Model Creation Payment  | Name of the Operation executed in the application.                                   |
| Model-Transaction | False       | < Transaction Id >      | Transaction Identifier of the model uploaded through Bundlr.                         |
| Description       | True        | < Example Description > | Model Description.                                                                   |

Example:
```json
{
  
  "Model-Name": "Example Name",
  "Model-Fee": "1000000000000", // winston value
  "Operation-Name": "Model Creation Payment",
  "Model-Transaction": "WRitxdSWNl51RgI9OYuGg7-_rb4YuP-rBxZ1jf_wnrA",
  "Description?": "Example Description", // Optional
}
```

----

## Attachment

In conjunction with the model creation transaction an user must add some usage notes for the model and optionally an image for the model, both this additions are considered attachments of the model and are sent to arweave as separate transactions with the following tags:

| Tag-Name          | Optional    | Tag Value               | Description                                                 
| ----------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Model-Transaction | False       | < Transaction Id >      | Transaction Identifier of the model uploaded through Bundlr.                         |
| Operation-Name    | False       | Model Attachment        | Name of the Operation executed in the application.                                   |
| Attachment-Name   | False       | < Example Name >        | Name of the attaachment file that was uploaded.                                      |
| Attachment-Role   | False       | < avatar >              | The role of the attachment, must be `avatar \| notes`, avatar means the attachment will be used to render the model avatar image, notes role will be used when render usage/instruction notes of the model.                                                                                                                                             |

Example:
```json
{
  
  "Model-Transaction": "WRitxdSWNl51RgI9OYuGg7-_rb4YuP-rBxZ1jf_wnrA",
  "Operation-Name": "Model Attachment",
  "Attachment-Name": "my-model-avatar.png",
  "Attachment-Role": "avatar",
}
```

----

## Operator Registration

When an operator registers for the model, a wallet to wallet transaction is created to pay the `registration fee` , corresponding to the `Registration Fee` detailed in the [economy section of the whitepaper](./whitepaper.md#v-marketplace-economy):

| Tag-Name          | Optional    | Tag Value               | Description                                                 
| ----------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Script-Name        | False       | < ExampleName >         | Name of the Script uploaded.                                                          |
| Script-Curator     | False       | < Example Address >     | Address of the wallet that uploaded Script.                                           |
| Script-Transaction | False       | < Script transaction >   | Transaction Identifier of the uploaded Script.                                        |
| Operator-Fee      | False       | < 1000000000000 >       | Fee Charged by the Operator to run inferences to the User.                           |
| Operation-Name    | False       | Operator Registration   | Name of the Operation executed in the application.                                   |
| Operator-Name     | False       | < Eample Name >         | Name Provided by the Operator when regisering to better be identified by Users.      |
| Payment-Quantity | False       | < 1000000000000 >           | Quantity paid in the corresponding payment transaction                         |
| Paymnent-Target  | False       | < Example Address >         | Address of the recipient in the corresponding payment transaction              |
| Save-Transaction | False       | < Save transaction >   | Transaction Identifier of the dispatched save transaction.                                        |

Example:
```json
{
  "Script-Name": "Example Name",
  "Script-Creator": "28x8B6eWAMSXs8MyndatFuUZbJBfpmr7VXe4N1JxTU8", 
  "Script-Transaction": "WRitxdSWNl51RgI9OYuGg7-_rb4YuP-rBxZ1jf_wnrA",
  "Operator-Fee": "1000000000000", // winston value
  "Operation-Name": "Operator Registration",
  "Operator-Name": "Example Operator Name",
  "Payment-Quantity": "1000000000000",
  "Paymnet-Target": "28x8B6eWAMSXs8MyndatFuUZbJBfpmr7VXe4N1JxTU8",
  "Save-Transaction": "WRitxdSWNl51RgI9OYuGg7-_rb4YuP-rBxZ1jf_wnrA",
}
```

## Script Fee Payment

When an user first chooses to use a model a wallet to wallet transaction is created in order to pay the `Script fee`, corresponding to the `Script Fee` detailed in the [economy section of the whitepaper](./whitepaper.md#v-marketplace-economy) with the following tags:

| Tag-Name          | Optional    | Tag Value               | Description                                                 
| ----------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Script-Name        | False       | < ExampleName >         | Name of the Script uploaded.                                                          |
| Script-Curator     | False       | < Example Address >     | Address of the wallet that uploaded Script.                                           |
| Script-Transaction | False       | < Script transaction >   | Transaction Identifier of the uploaded Script.                                        |
| Script-Fee         | False       | < 1000000000000 >       | Fee To be paid to Creator on first Script usage, value must be in winston.            |
| Operation-Name    | False       | Script Fee Payment       | Name of the Operation executed in the application.                                  |
| Save-Transaction | False       | < Save transaction >   | Transaction Identifier of the dispatched save transaction.                                        |

Example:
```json
{
  "Script-Name": "Example Name",
  "Script-Curator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ", 
  "Script-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Script-Fee": "1000000000000", // winston value
  "Operation-Name": "Script Fee Payment",
  "Save-Transaction": "WRitxdSWNl51RgI9OYuGg7-_rb4YuP-rBxZ1jf_wnrA",
}
```

----

## Script Inference Request

Data transaction containing the prompts to send to the script for inference, created with the following tags:

| Tag-Name                | Optional    | Tag Value               | Description                                                 
| ----------------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Script-Name              | False       | < ExampleName >         | Name of the Script uploaded.                                                          |
| Script-Curator           | False       | < Example Address >     | Address of the wallet that uploaded Script.                                           |
| Script-Transaction       | False       | < Script transaction >   | Transaction Identifier of the uploaded Script.                                        |
| Script-Operator          | False       | < Example Address >     | Address of the Operator that a User is using for the inference request.              |
| Operation-Name          | False       | Script Inference Request | Name of the Operation executed in the applicaiton.                                   |
| Conversation-Identifier | False       | < 1 >                   | Identifier to group messages for inference, by default inference will be run using context of all messages that belong to one identifier, generating a new identifier will reset the context.                                                                            |
| Payment-Quantity | False       | < 1000000000000 >           | Quantity paid in the corresponding payment transaction       |
| Paymnent-Target  | False       | < Example Address >         | Address of the recipient in the corresponding payment transaction |

Example:
```json
{
  "Script-Name": "Example Name",
  "Script-Curator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ", 
  "Script-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Script-Operator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ",
  "Operation-Name": "Script Inference Request",
  "Conversation-Identifier": "1", // chat id number
  "Payment-Quantity": "1000000000000",
  "Paymnet-Target": "28x8B6eWAMSXs8MyndatFuUZbJBfpmr7VXe4N1JxTU8"
}
```

----

## Script Inference Payment

Wallet to Wallet transaction to pay for the `Inference Payment` fee. This transaction corresponds to the `Inference Payment` detailed in the [economy section of the whitepaper](./whitepaper.md#v-marketplace-economy) and contains the folllowing tags:

| Tag-Name                | Optional    | Tag Value               | Description                                                 
| ----------------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Script-Name              | False       | < ExampleName >         | Name of the Script uploaded.                                                          |
| Script-Curator           | False       | < Example Address >     | Address of the wallet that uploaded Script.                                           |
| Script-Transaction       | False       | < Script transaction >   | Transaction Identifier of the uploaded Script.                                        |
| Script-Operator          | False       | < Example Address >     | Address of the Operator that a User is using for the inference request.              |
| Operation-Name          | False       | Inference Payment       | Name of the Operation executed in the application.                                   |
| Inference-Transaction   | False       | < Example Transaction > | Transaction Identifier of the inference request.                                     |
| Conversation-Identifier | False       | < 1 >                   | Identifier to group messages for inference, by default inference will be run using context of all messages that belong to one identifier, generating a new identifier will reset the context.                                                                            |

Example
```json
{
  "Script-Name": "Example Name",
  "Script-Curator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ", 
  "Script-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Script-Operator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ",
  "Operation-Name": "Inference Payment",
  "Conversation-Identifier": "1",
  "Inference-Transaction": "LXKYYdE_7zX7t5OSjFQXlgf1TexvuEXkmt6BkrCRdy8",
}
```

---

## Script Inference Response

Data Transaction created by the operator to respond to a inference request by the user. It contains the response data with the following tags:

| Tag-Name                | Optional    | Tag Value                | Description                                                 
| ----------------------- | ----------- | ------------------------ | ------------------------------------------------------------------------------------ |
| Script-Name              | False       | < ExampleName >          | Name of the Script uploaded.                                                          |
| Script-Curator           | False       | < Example Address >      | Address of the wallet that uploaded Script.                                           |
| Script-Transaction       | False       | < Script transaction >    | Transaction Identifier of the uploaded Script.                                        |
| Script-User              | False       | < Example Address >      | Address of the User that requested inference.                                        |
| Operation-Name          | False       | Script Inference Response | Name of the Operation executed in the application.                                   |
| Request-Transaction     | False       | < Example Transaction >  | Transaction Identifier of the inference request.                                     |
| Conversation-Identifier | False       | < 1 >                    | Identifier to group messages for inference, by default inference will be run using context of all messages that belong to one identifier, generating a new identifier will reset the context.                                                                                                                                                  |
| Payment-Quantity | False       | < 1000000000000 >           | Quantity paid in the corresponding payment transaction       |
| Paymnent-Target  | False       | < Example Address >         | Address of the recipient in the corresponding payment transaction |

Example:
```json
{
  "Script-Name": "Example Name",
  "Script-Curator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ", 
  "Script-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Script-User": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ",
  "Operation-Name": "Script Inference Response",
  "Request-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Conversation-Identifier": "1", // chat id number
  "Payment-Quantity": "1000000000000",
  "Paymnet-Target": "28x8B6eWAMSXs8MyndatFuUZbJBfpmr7VXe4N1JxTU8"
}
```

---

## Inference Redistribution

When an operator receives a request payment from the user he is responsible to take the extra 5% sent by the user and distribute it to the marketplace, paying the `inference fee` in a wallet to wallet transaction with the following tags:

| Tag-Name                | Optional    | Tag Value                      | Description                                                 
| ----------------------- | ----------- | ------------------------------ | ------------------------------------------------------------------------------------ |
| Script-Name              | False       | < ExampleName >                | Name of the Script uploaded.                                                          |
| Script-Curator           | False       | < Example Address >            | Address of the wallet that uploaded Script.                                           |
| Script-Transaction       | False       | < Script transaction >          | Transaction Identifier of the uploaded Script.                                        |
| Script-User              | False       | < Example Address >            | Address of the User that requested inference.                                        |
| Operation-Name          | False       | Inference-Fee                  | Name of the Operation executed in the application.                                   |
| Request-Transaction     | False       | < Example Transaction >        | Transaction Identifier of the inference request.                                     |
| Response-Transaction    | False       | < Example Transaction >        | Transaction Identifier of the inference response.                                    |
| Conversation-Identifier | False       | < 1 >                          | Identifier to group messages for inference, by default inference will be run using context of all messages that belong to one identifier, generating a new identifier will reset the context. |

Example:
```json
{
  "Script-Name": "Example Name",
  "Script-Curator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ", 
  "Script-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Script-User": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ",
  "Operation-Name": "Fee Redistribution",
  "Request-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Response-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Conversation-Identifier": "1", // chat id number
}
```

---

## Scripts upload

Data transaction containing any necessary files to run a specific model, created with the following tags:

| Tag-Name          | Optional    | Tag Value           | Description                                                 
| ----------------- | ----------- | ------------------- | ------------------------------------------------------------------------------------ |
| Model-Name        | False       | < ExampleName >     | Name of the model uploaded.                                                          |
| Model-Creator     | False       | < Example Address > | Address of the wallet that uploaded model.                                           |
| Model-Transaction | False       | < Transaction Id >  | Transaction Identifier of the model uploaded through Bundlr.                         |
| Script-Fee        | False       | < 1000000000000 >   | Fee to be paid by the User when first using a script.                                |
| Registration-Fee  | False       | < 1000000000000 >   | Fee to be paid by the Operator when registering for a script.                        |
| Operation-Name    | False       | Scripts Upload      | Name of the Operation executed in the application.                                   |
| Payment-Quantity  | False       | < 1000000000000 >    | Quantity paid in the corresponding payment transaction       |
| Paymnent-Target   | False       | < Example Address >  | Address of the recipient in the corresponding payment transaction |

**NOTE:** Registration-Fee  not implemented yet

Example:
```json
{
  "Model-Name": "Example Name",
  "Model-Creator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ", 
  "Model-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Script-Fee": "1000000000000", // winston value
  "Registration-Fee": "1000000000000", // winston value
  "Operation-Name": "Script Creation",
  "Payment-Quantity": "1000000000000",
  "Paymnet-Target": "28x8B6eWAMSXs8MyndatFuUZbJBfpmr7VXe4N1JxTU8"
}
```

## Scripts upload payment

Wallet to Wallet transaction created to pay `Model Fee` to the Creator when uploading a script. This transaction corresponds to the `Model Fee` detailed in the [economy section of the whitepaper](./whitepaper.md#v-marketplace-economy) and contains the folllowing tags:

| Tag-Name           | Optional    | Tag Value           | Description                                                 
| ------------------ | ----------- | ------------------- | ------------------------------------------------------------------------------------ |
| Model-Name         | False       | < ExampleName >     | Name of the model uploaded.                                                          |
| Model-Creator      | False       | < Example Address > | Address of the wallet that uploaded model.                                           |
| Model-Transaction  | False       | < Transaction Id >  | Transaction Identifier of the model uploaded through Bundlr.                         |
| Script-Fee         | False       | < 1000000000000 >   | Fee to be paid by the User when first using a script.                                |
| Registration-Fee   | False       | < 1000000000000 >   | Fee to be paid by the Operator when registering for a script.                        |
| Operation-Name     | False       | Model Fee Payment   | Name of the Operation executed in the application.                                   |
| Script-Transaction | False       | < Transaction Id >  | Transaction Identifier of the script uploaded through Bundlr.                        |

**NOTE:** Registration-Fee  not implemented yet

Example:
```json
{
  "Model-Name": "Example Name",
  "Model-Creator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ", 
  "Model-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Script-Fee": "1000000000000", // winston value
  "Registration-Fee": "1000000000000", // winston value
  "Operation-Name": "Script Fee Payment",
  "Script-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34"
}
```

## Conversation Start

Dispatch Transaction to register the start of a conversation in chat

| Tag-Name           | Optional    | Tag Value           | Description                                                 
| ------------------ | ----------- | ------------------- | ------------------------------------------------------------------------------------ |
| Script-Name         | False       | < ExampleName >     | Name of the Script uploaded.                                                          |
| Script-Curator      | False       | < Example Address > | Address of the wallet that uploaded Script.                                           |
| Script-Transaction  | False       | < Transaction Id >  | Transaction Identifier of the Script uploaded through Bundlr.                         |
| Operation-Name     | False       | Conversation Start   | Name of the Operation executed in the application.                                   |
| Conversation-Identifier | False       | < 1 >                          | Identifier to group messages for inference, by default inference will be run using context of all messages that belong to one identifier, generating a new identifier will reset the context. |

**NOTE:** Registration-Fee  not implemented yet

Example:
```json
{
  "Script-Name": "Example Name",
  "Script-Curator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ", 
  "Script-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Operation-Name": "Conversation Start",
  "Conversation-Identifier": "1"
}
```
