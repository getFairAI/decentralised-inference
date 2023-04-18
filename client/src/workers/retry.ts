import { DEFAULT_TAGS, INFERENCE_PAYMENT, INFERENCE_PAYMENT_DISTRIBUTION, MODEL_CREATION, MODEL_CREATION_PAYMENT, MODEL_FEE_PAYMENT, MODEL_FEE_PAYMENT_SAVE, MODEL_INFERENCE_REQUEST, MODEL_INFERENCE_RESPONSE, REGISTER_OPERATION, SAVE_REGISTER_OPERATION, TAG_NAMES } from '@/constants';
import { IEdge, ITransactions } from '@/interfaces/arweave';
import { QUERY_TX_WITH } from '@/queries/graphql';
import { client } from '@/utils/apollo';
import { isTxConfirmed } from '@/utils/arweave';
import { findTag } from '@/utils/common';


self.onmessage = async (e: MessageEvent<{ tx: IEdge, address: string}>) => {
  const tx = e.data.tx;
  const currentAddress = e.data.address;

  let variables;
  if (tx) {
    switch (findTag(tx, 'operationName')) {
      case MODEL_CREATION:
        // find payment for model creation
        variables = {
          address: currentAddress,
          tags: [
            ...DEFAULT_TAGS,
            { name: TAG_NAMES.operationName, values: [MODEL_CREATION_PAYMENT] },
            { name: TAG_NAMES.modelTransaction, values: tx.node.id },
          ],
        };
        break;
      case SAVE_REGISTER_OPERATION:
        variables = {
          address: currentAddress,
          tags: [
            ...DEFAULT_TAGS,
            { name: TAG_NAMES.operationName, values: [REGISTER_OPERATION] },
            { name: TAG_NAMES.saveTransaction, values: [tx.node.id] },
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
            { name: TAG_NAMES.saveTransaction, values: [tx.node.id] },
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
            { name: TAG_NAMES.inferenceTransaction, values: [tx.node.id] },
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
            { name: TAG_NAMES.responseTransaction, values: [tx.node.id] },
          ],
        };
        break;
      default:
        self.postMessage('Invalid Operation Name');
        self.close();
        return;
    }

    const loopCondition = true;
    while (loopCondition) {
      const { data }: { data: { transactions: ITransactions }} = await client.query({
        query: QUERY_TX_WITH,
        variables,
      });
      const txs = data?.transactions?.edges;
      if (txs && txs.length >= 0) {
        // check is confirmed
        const confirmed = await isTxConfirmed(txs[0].node.id);
        self.postMessage('tx confirmed');
        if (confirmed) break; // jump out of loop
      } else if (txs.length === 0) {
        // if not found then retry
        self.postMessage('tx lost');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

export {};
