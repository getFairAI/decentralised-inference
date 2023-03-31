# Fair Protocol Tags

This Document provides detailed information about the transactions involved in the platform and specifically the tags included in such transactions.

**Note**: Tag Values inside `<>` are example values, all other Tag Values are strict.

## Index
* Common Tags [:link:](#common-tags)
* Creator Flow
  * Model upload [:link:](#model-upload-to-bundlr)
  * Model upload payment [:link:](#model-upload-payment-to-marketplace)
  * Attachment [:link:](#attachment)
* User Flow
  * Script fee payment [:link:](#model-fee-payment)
  * Inference request [:link:](#model-inference-request)
  * Inference payment [:link:](#model-inference-payment)
* Operator Flow
  * Registration [:link:](#operator-registration)
  * Inference response [:link:](#model-inference-response)
  * Inference distribution [:link:](#inference-payment-distribution)
* Curator Flow
  * Script upload [:link:](#scripts-upload)
  * Script upload payment [:link:](#scripts-upload-payment)
  * Attachment [:link:](#attachment)

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

----

## Model upload to Bundlr

When a creator uploads a model to the platform the transaction occurs with the following tags:

| Tag-Name       | Optional    | Tag Value               | Description                                                 
| -------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Model-Name     | False       | < ExampleName >         | Name of the model uploaded.                                                          |
| Model-Fee      | False       | < 1000000000000 >       | Fee To be paid to Creator by the Curator when uploading scrips for a model           |
| Operation-Name | False       | Model Creation          | Name of the Operation executed in the application.                                   |
| Category       | False       | < text >                | Model Category, must `'text' \| 'document' \| 'both'`.                               |
| Description    | True        | < Example Description > | Model Description.                                                                   |

Example:
```json
{
  
  "Model-Name": "Example Name",
  "Model-Fee": "1000000000000", // winston value
  "Operation-Name": "Model Creation",
  "Category": "text",
  "Description?": "Example Description", // Optional
}
```

----

## Model Upload Payment to marketplace

Besides the model upload, a second transaction is sent to arweave corresponding to the `upload fee` payment. This transaction is a wallet to wallet transaction from the user to the `MARKETPLACE_ADDRESS` with a fixed quantity of `MARKETPLACE_FEE`, the transaction corresponds to the `upload fee` detailed in the [economy section of the whitepaper](./whitepaper.md#v-marketplace-economy):

| Tag-Name          | Optional    | Tag Value               | Description                                                 
| ----------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Model-Name        | False       | < ExampleName >         | Name of the model uploaded.                                                          |
| Model-Fee         | False       | < 1000000000000 >       | Fee To be paid to Creator by the Curator when uploading scrips for a model           |
| Operation-Name    | False       | Model Creation Payment  | Name of the Operation executed in the application.                                   |
| Category          | False       | < text >                | Model Category, must be `'text' \| 'document' \| 'both'`.                            |
| Model-Transaction | False       | < Transaction Id >      | Transaction Identifier of the model uploaded through bundlr.                         |
| Description       | True        | < Example Description > | Model Description.                                                                   |

Example:
```json
{
  
  "Model-Name": "Example Name",
  "Model-Fee": "1000000000000", // winston value
  "Operation-Name": "Model Creation Payment",
  "Category": "text",
  "Model-Transaction": "WRitxdSWNl51RgI9OYuGg7-_rb4YuP-rBxZ1jf_wnrA",
  "Description?": "Example Description", // Optional
}
```

----

## Attachment

In conjunction with the model creation transaction an user must add some usage notes for the model and optionally an image for the model, both this additions are considered attachments of the model and are sent to arweave as separate transactions with the following tags:

| Tag-Name          | Optional    | Tag Value               | Description                                                 
| ----------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Model-Transaction | False       | < Transaction Id >      | Transaction Identifier of the model uploaded through bundlr.                         |
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
| Model-Name        | False       | < ExampleName >         | Name of the model uploaded.                                                          |
| Model-Creator     | False       | < Example Address >     | Address of the wallet that uploaded model.                                           |
| Model-Transaction | False       | < Model transaction >   | Transaction Identifier of the uploaded model.                                        |
| Operator-Fee      | False       | < 1000000000000 >       | Fee Charged by the Operator to run inferences to the User.                           |
| Operation-Name    | False       | Operator Registration   | Name of the Operation executed in the application.                                   |
| Operator-Name     | False       | < Eample Name >         | Name Provided by the Operator when regisering to better be identified by Users.      |

Example:
```json
{
  "Model-Name": "Example Name",
  "Model-Creator": "28x8B6eWAMSXs8MyndatFuUZbJBfpmr7VXe4N1JxTU8", 
  "Model-Transaction": "WRitxdSWNl51RgI9OYuGg7-_rb4YuP-rBxZ1jf_wnrA",
  "Operator-Fee": "1000000000000", // winston value
  "Operation-Name": "Operator Registration",
  "Operator-Name": "Example Operator Name",
}
```

## Script Fee Payment

When an user first chooses to use a model a wallet to wallet transaction is created in order to pay the `Script fee`, corresponding to the `Script Fee` detailed in the [economy section of the whitepaper](./whitepaper.md#v-marketplace-economy) with the following tags:

| Tag-Name          | Optional    | Tag Value               | Description                                                 
| ----------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Model-Name        | False       | < ExampleName >         | Name of the model uploaded.                                                          |
| Model-Creator     | False       | < Example Address >     | Address of the wallet that uploaded model.                                           |
| Model-Transaction | False       | < Model transaction >   | Transaction Identifier of the uploaded model.                                        |
| Model-Fee         | False       | < 1000000000000 >       | Fee To be paid to Creator on first model usage, value must be in winston.            |
| Operation-Name    | False       | Script Fee Payment       | Name of the Operation executed in the application.                                   |

Example:
```json
{
  "Model-Name": "Example Name",
  "Model-Creator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ", 
  "Model-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Model-Fee": "1000000000000", // winston value
  "Operation-Name": "Script Fee Payment"
}
```

----

## Model Inference Request

Data transaction containing the prompts to send to the model for inference, created with the following tags:

| Tag-Name                | Optional    | Tag Value               | Description                                                 
| ----------------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Model-Name              | False       | < ExampleName >         | Name of the model uploaded.                                                          |
| Model-Creator           | False       | < Example Address >     | Address of the wallet that uploaded model.                                           |
| Model-Transaction       | False       | < Model transaction >   | Transaction Identifier of the uploaded model.                                        |
| Model-Operator          | False       | < Example Address >     | Address of the Operator that a User is using for the inference request.              |
| Operation-Name          | False       | Model Inference Request | Name of the Operation executed in the applicaiton                                    |
| Conversation-Identifier | False       | < 1 >                   | Identifier to group messages for inference, by default inference will be run using context of all messages that belong to one identifier, generating a new identifier will reset the context.                                                                            |

Example:
```json
{
  "Model-Name": "Example Name",
  "Model-Creator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ", 
  "Model-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Model-Operator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ",
  "Operation-Name": "Model Inference Request",
  "Conversation-Identifier": "1", // chat id number
}
```

----

## Model Inference Payment

Wallet to Wallet transaction to pay for the `Inference Payment` fee. This transaction corresponds to the `Inference Payment` detailed in the [economy section of the whitepaper](./whitepaper.md#v-marketplace-economy) and contains the folllowing tags:

| Tag-Name                | Optional    | Tag Value               | Description                                                 
| ----------------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Model-Name              | False       | < ExampleName >         | Name of the model uploaded.                                                          |
| Model-Creator           | False       | < Example Address >     | Address of the wallet that uploaded model.                                           |
| Model-Transaction       | False       | < Model transaction >   | Transaction Identifier of the uploaded model.                                        |
| Model-Operator          | False       | < Example Address >     | Address of the Operator that a User is using for the inference request.              |
| Operation-Name          | False       | Inference Payment       | Name of the Operation executed in the application.                                   |
| Inference-Transaction   | False       | < Example Transaction > | Transaction Identifier of the inference request.                                     |
| Conversation-Identifier | False       | < 1 >                   | Identifier to group messages for inference, by default inference will be run using context of all messages that belong to one identifier, generating a new identifier will reset the context.                                                                            |

Example
```json
{
  "Model-Name": "Example Name",
  "Model-Creator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ", 
  "Model-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Model-Operator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ",
  "Operation-Name": "Inference Payment",
  "Conversation-Identifier": "1",
  "Inference-Transaction": "LXKYYdE_7zX7t5OSjFQXlgf1TexvuEXkmt6BkrCRdy8",
}
```

---

## Model Inference Response

Data Transaction created by the operator to respond to a inference request by the user. It contains the response data with the following tags:

| Tag-Name                | Optional    | Tag Value                | Description                                                 
| ----------------------- | ----------- | ------------------------ | ------------------------------------------------------------------------------------ |
| Model-Name              | False       | < ExampleName >          | Name of the model uploaded.                                                          |
| Model-Creator           | False       | < Example Address >      | Address of the wallet that uploaded model.                                           |
| Model-Transaction       | False       | < Model transaction >    | Transaction Identifier of the uploaded model.                                        |
| Model-User              | False       | < Example Address >      | Address of the User that requested inference.                                        |
| Operation-Name          | False       | Model Inference Response | Name of the Operation executed in the application.                                   |
| Request-Transaction     | False       | < Example Transaction >  | Transaction Identifier of the inference request.                                     |
| Conversation-Identifier | False       | < 1 >                    | Identifier to group messages for inference, by default inference will be run using context of all messages that belong to one identifier, generating a new identifier will reset the context.                                                                                                                                                  |

Example:
```json
{
  "Model-Name": "Example Name",
  "Model-Creator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ", 
  "Model-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Model-User": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ",
  "Operation-Name": "Model Inference Response",
  "Request-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Conversation-Identifier": "1", // chat id number
}
```

---

## Inference Payment Distribution

When an operator receives a request payment from the user he is responsible to take the extra 5% sent by the user and distribute it to the marketplace, paying the `inference fee` in a wallet to wallet transaction with the following tags:

| Tag-Name                | Optional    | Tag Value                      | Description                                                 
| ----------------------- | ----------- | ------------------------------ | ------------------------------------------------------------------------------------ |
| Model-Name              | False       | < ExampleName >                | Name of the model uploaded                                                           |
| Model-Creator           | False       | < Example Address >            | Address of the wallet that uploaded model                                            |
| Model-Transaction       | False       | < Model transaction >          | Transaction Id of the uploaded model                                                 |
| Model-User              | False       | < Example Address >            | Address of the user that requested inference                                         |
| Operation-Name          | False       | Inference Payment Distribution | Name of the Operation executed in the applicaiton                                    |
| Request-Transaction     | False       | < Example Transaction >        | Transaction Id of the inference request                                              |
| Response-Transaction    | False       | < Example Transaction >        | Transaction Id of the inference response                                             |
| Conversation-Identifier | False       | < 1 >                          | Identifier to group messages for inference, by default inference will be run using context of all messages that belong to one identifier, generating a new identifier will reset the context |

Example:
```json
{
  "Model-Name": "Example Name",
  "Model-Creator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ", 
  "Model-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Model-User": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ",
  "Operation-Name": "Inference Payment Distribution",
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
| Model-Transaction | False       | < Transaction Id >  | Transaction Identifier of the model uploaded through bundlr.                         |
| Script-Fee        | False       | < 1000000000000 >   | Fee to be paid by the User when first using a script.                                |
| Registration-Fee  | False       | < 1000000000000 >   | Fee to be paid by the Operator when registering for a script.                        |
| Operation-Name    | False       | Scripts Upload      | Name of the Operation executed in the application.                                   |


Example:
```json
{
  "Model-Name": "Example Name",
  "Model-Creator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ", 
  "Model-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Script-Fee": "1000000000000", // winston value
  "Registration-Fee": "1000000000000", // winston value
  "Operation-Name": "Script Upload",
}
```

## Scripts upload payment

Wallet to Wallet transaction created to pay `Model Fee` to the Creator when uploading a script. This transaction corresponds to the `Model Fee` detailed in the [economy section of the whitepaper](./whitepaper.md#v-marketplace-economy) and contains the folllowing tags:

| Tag-Name           | Optional    | Tag Value           | Description                                                 
| ------------------ | ----------- | ------------------- | ------------------------------------------------------------------------------------ |
| Model-Name         | False       | < ExampleName >     | Name of the model uploaded.                                                          |
| Model-Creator      | False       | < Example Address > | Address of the wallet that uploaded model.                                           |
| Model-Transaction  | False       | < Transaction Id >  | Transaction Identifier of the model uploaded through bundlr.                         |
| Script-Fee         | False       | < 1000000000000 >   | Fee to be paid by the User when first using a script.                                |
| Registration-Fee   | False       | < 1000000000000 >   | Fee to be paid by the Operator when registering for a script.                        |
| Operation-Name     | False       | Model Fee Payment   | Name of the Operation executed in the application.                                   |
| Script-Transaction | False       | < Transaction Id >  | Transaction Identifier of the script uploaded through bundlr                         |

Example:
```json
{
  "Model-Name": "Example Name",
  "Model-Creator": "z5fyErzDaCCyVk3_RwbO9IbL88SLaeJuN7nivehwGfQ", 
  "Model-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34",
  "Script-Fee": "1000000000000", // winston value
  "Registration-Fee": "1000000000000", // winston value
  "Operation-Name": "Model Fee Payment",
  "Script-Transaction": "3uxkbyLgcrw2lMocy5MI3SmYvvijNzYyPxErHgRgb34"
}
```
