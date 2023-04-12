# Instructions on how to install and use Alpaca-7b Q4 as an Operator

#### **Note:** All the links and instructions presented were tested and validated on 2023-03-30, in an x86-64 and AArch64 CPUs using Brave browser version 1.48.164 and Ubuntu 22.04.1 LTS. Updates could have changed things since then and other types of CPUs architectures could not work. We don't take responsibility for the links presented, as their content could have changed drastically. **Follow this guide at your own risk.**

### The Alpaca guide was mostlyy done following [this GitHub](https://github.com/Nuked88/alpaca.http).

## Depedencies
To use this library, you need to have:

* [Node.js](https://nodejs.org/en/download)
* [Boost](https://www.boost.org/users/history/version_1_81_0.html)
    * Extract the boost folder from the downloaded archive
    * Place the boost folder in the root directory of the cloned repository
* [GNU Compiler Collection (GCC)](https://linuxize.com/post/how-to-install-gcc-compiler-on-ubuntu-18-04/)
* [Bundlr](https://www.npmjs.com/package/@bundlr-network/client)
* [Arweave](https://www.npmjs.com/package/arweave)
* [Apollo](https://www.apollographql.com/tutorials/fullstack-quickstart/07-setting-up-apollo-client)
* [GraphQL](https://graphql.org/graphql-js/)


1. Intall all dependencies above

1. Download the script files on this webpage

1. Extract the script files to some folder

1. Download the model (Alpaca-7b Q4)

1. Put the model on the same folder as the files downloaded and extracted

1. Using the terminal on the same folder, run the server script with

```bash
./server
```
7. Using the terminal on the same folder, run the alpaca script with 
   
```bash
npm install
npm start
```

*Optional:* If you want to test the inference first, after putting the model on the same folder as the other files run instead the test script with

```bash
ts-node alpaca-inference-test.ts
```

#### This is all for today, congrats if you made this far!
