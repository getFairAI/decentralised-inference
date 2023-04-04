# Instructions on how to install and use Rasa as an Operator

#### **Note:** All the links and instructions presented were tested and validated on 2023-02-23, in an x86-64 and AArch64 CPUs using Brave browser version 1.48.164 and Ubuntu 22.04.1 LTS. Updates could have changed things since then and other types of CPUs architectures could not work. We don't take responsibility for the links presented, as their content could have changed drastically. **Follow this guide at your own risk.**

1. Use the offitial guide on how to install Rasa, from Rasa Learning Center. The official website for Ubuntu is [this one](https://learning.rasa.com/installation/ubuntu/), and on the left side of the screen there is an option to install for [MacOS](https://learning.rasa.com/installation/mac/) and [Windows](https://learning.rasa.com/installation/) as well;

    * **Note:** If you are using an ARM64 CPU, you need to do a workaround at the moment, using [this unofficial GitHub instructions](https://github.com/khalo-sa/rasa-apple-silicon).

1. After Rasa installation, run the "init" command as presented in the documentation above; ~~Don't start the bot already (inference);~~

1. ~~Replace the "models" folder and everything inside it, created by the "init" command, by the "models" provided on this compressed file;~~

1. Start the bot inference ("shell" command) if you haven't already;

    * Leave it running, since it will be used by our script later on.

1. Check on which link and port the bot was executed, by reading the link presented by the command line when starting Rasa (default link is **[http://0.0.0.0:5005](http://0.0.0.0:5005)**, which means that the default port is the **5005**);

    * If everything is running okay, the presented link in the command line should open and show a valid webpage on the browser;
    * We recommend to test the Rasa inference at this step. Could be done on the therminal where the "shell" command is running.

1. [Install Node.js](https://nodejs.org/en/download/), if you haven't already on your PC;

1. Download the files of this configuration by clicking on the "Downlaod" button of this web page;

    * Optional: After downloading the files, move them to the same folder that you have Rasa installed

1. Update the "config.json";

   * Change the "url" key to the one where Rasa is currently running, adding "/webhooks/rest/webhook" at the end of it. Default example should be "[http://0.0.0.0:5005/webhooks/rest/webhook](http://0.0.0.0:5005/webhooks/rest/webhook)";
   * Optional: Change the "sleepTime" key to be more suitable for your needs. By default it's set up to 0.1s, which means that will try to find new inference requestes each 0.1s. If you put lower, you will take more processing power, but you can eventually have an edge against others running inferences as well. Watch out for the infinite loops, we don't recommend to set up this to 0s.
  
1. Create a new wallet using the [ArConnect browser extension](https://chrome.google.com/webstore/detail/arconnect/einnioafmpimabjcddiinlhmijaionap). Save the recovery phrase somewhere safe and the Keyfile on your computer;

   * **Note:** We recommend the creation of a new wallet for this, so your funds are more protected and splitted. But if you do this ith a new wallet, don't forget to change your wallet connected to the marketplace;
   * Optional: you can use other wallet creators, but please check the compability to the ArConnect Keyfile format. Otherwise could not work.
  
1. Move or copy your wallet Keyfile (a json file) to the folder where you have the files of this configuration, and rename it to "wallet.json";

1. Run the "RasaInferenceFairProtocol.js" script on the same folder you have Rasa and all the other needed files, running "node RasaInferenceFairProtocol.js";

   * **Note:** We recommend to confirm the code you are running to check if isn't any kind of malware;
   * **Note:** For Windows users, you will need to change your paths in the file.
  
1. Go to the next step of this webpage and send the transaction to the Arweave blcokchain, in order to inform the marketplace that you started business and are ready to go.

   * We recommend you to do the first inference on the website yourself, so you can test if everything is working properly and you can start the counter of sucessfull inferences on the website.

#### The configuration steps have ended, congrats if you made this far!
