# Upload Attachments

This is a utility to upload attachments to an already created model or script in the fair protocol application

## Installation
* Install depependencies
```sh
  npm install
```

## Usage
Place a wallet to be used for upload in the folder, with the name `wallet.json`, **Be Careful as other wallets names will not be ignored by git.**

**Note:** Wallet must have balance in bundlr

**Note!:** For Attachment to be correctly identified, wallet used to upload attachment must be the same wallet that uploaded the model 

**Note!!:** Current script uploads with `APP_VERSION='0.1'`

Tthe command acceps 4 arguments in order:
  * path to the file to be uploaded (preferred relative path)
  * Transaction Id of the Model or script to which the attachment will be associated
  * Attachment Role: 'avatar' or 'notes'
  * Attaachment For: 'forModel' or 'forScript'
  
Example:
```sh
  ts-node upload.ts <./image.png> <transaction_id> <avatar> <forModel> # replace <...> with the desired values
```

