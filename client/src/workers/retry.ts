import { DEFAULT_TAGS, INFERENCE_PAYMENT, INFERENCE_PAYMENT_DISTRIBUTION, MIN_CONFIRMATIONS, MODEL_CREATION, MODEL_CREATION_PAYMENT, MODEL_FEE_PAYMENT, MODEL_FEE_PAYMENT_SAVE, MODEL_INFERENCE_REQUEST, MODEL_INFERENCE_RESPONSE, REGISTER_OPERATION, SAVE_REGISTER_OPERATION, TAG_NAMES } from '@/constants';
import { ITransactions } from '@/interfaces/arweave';
import { QUERY_TX_WITH } from '@/queries/graphql';
import { client } from '@/utils/apollo';
import arweave, { isTxConfirmed } from '@/utils/arweave';


self.onmessage = async (e: MessageEvent<string>) => {
  const { txid, operationName, address: currentAddress }: { txid: string, operationName: string, address: string} = JSON.parse(e.data);

  let variables;
  if (txid && operationName) {
    switch (operationName) {
      case MODEL_CREATION:
        // find payment for model creation
        variables = {
          address: currentAddress,
          tags: [
            ...DEFAULT_TAGS,
            { name: TAG_NAMES.operationName, values: [MODEL_CREATION_PAYMENT] },
            { name: TAG_NAMES.modelTransaction, values: txid },
          ],
        };
        break;
      case SAVE_REGISTER_OPERATION:
        variables = {
          address: currentAddress,
          tags: [
            ...DEFAULT_TAGS,
            { name: TAG_NAMES.operationName, values: [REGISTER_OPERATION] },
            { name: TAG_NAMES.saveTransaction, values: [txid] },
          ],
        };
        break;
      case MODEL_FEE_PAYMENT_SAVE:
        // check there is a model fee payment for this tx
        variables = {
          address: currentAddress,
          tags: [
            ...DEFAULT_TAGS,
            { name: TAG_NAMES.operationName, values: [MODEL_FEE_PAYMENT] },
            { name: TAG_NAMES.saveTransaction, values: [txid] },
          ],
        };
        break;
      case MODEL_INFERENCE_REQUEST:
        // check there is a inference payment for this tx
        variables = {
          address: currentAddress,
          tags: [
            ...DEFAULT_TAGS,
            { name: TAG_NAMES.operationName, values: [INFERENCE_PAYMENT] },
            { name: TAG_NAMES.inferenceTransaction, values: [txid] },
          ],
        };
        break;
      case MODEL_INFERENCE_RESPONSE:
        // check there is a inferen payment distribution for this tx
        variables = {
          address: currentAddress,
          tags: [
            ...DEFAULT_TAGS,
            { name: TAG_NAMES.operationName, values: [INFERENCE_PAYMENT_DISTRIBUTION] },
            { name: TAG_NAMES.responseTransaction, values: [txid] },
          ],
        };
        break;
      default:
        self.postMessage('Invalid Operation Name');
        return;
    }

    const loopCondition = true;
    const { height: startHeight } = await arweave.blocks.getCurrent();

    while (loopCondition) {
      const { data }: { data: { transactions: ITransactions }} = await client.query({
        query: QUERY_TX_WITH,
        variables,
        fetchPolicy: 'no-cache',
      });
      const txs = data?.transactions?.edges;
      if (txs && txs.length > 0) {
        // check is confirmed
        const confirmed = await isTxConfirmed(txs[0].node.id);
        if (confirmed) {
          self.postMessage('tx confirmed');
          break;
        }
      } else if (txs.length === 0) {
        const { height: newHeight } = await arweave.blocks.getCurrent();
         if (newHeight > startHeight + MIN_CONFIRMATIONS) {
          // if tx is not found in Min_confirmation blocks then it's lost,
          // trigger retry
          // if not found then retry
          self.postMessage('tx lost');
          break;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
};

export {};
