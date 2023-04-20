import { createContext, Dispatch, ReactNode, useEffect, useReducer } from 'react';
import { INFERENCE_PAYMENT, INFERENCE_PAYMENT_DISTRIBUTION, MODEL_CREATION, MODEL_CREATION_PAYMENT, MODEL_FEE_PAYMENT, MODEL_FEE_PAYMENT_SAVE, MODEL_INFERENCE_REQUEST, MODEL_INFERENCE_RESPONSE, REGISTER_OPERATION, SAVE_REGISTER_OPERATION, TAG_NAMES } from '@/constants';
import { ITag } from '@/interfaces/arweave';
import arweave from '@/utils/arweave';

interface Job {
  workerRef: Worker;
  address: string;
  operationName: string;
}

interface WorkerInfo {
  txid: string,
  operationName: string;
  address: string;
  tags: ITag[];
}

interface WorkerContext {
  state: Job[];
  startJob: (payload: WorkerInfo) => Promise<void>,
}

interface WorkerActions {
  type: 'handleStart' | 'handleStop',
  payload: Job;
}

const subscribeMessages = (payload: WorkerInfo, dispatch: Dispatch<WorkerActions>, workerRef: Worker) => (
  async (event: MessageEvent<string>) => {
    const currentJob = { address: payload.address, workerRef, operationName: payload.operationName };
    if (event.data === 'tx lost') {
      // trigger retry
      dispatch({ type: 'handleStop', payload: currentJob });
      const result = await handleRetry(payload.tags, payload.operationName, payload.txid);
      if (typeof result !== 'string') {
        // dispatch new job for retried tx
        await asyncStart(dispatch, {
          address: payload.address,
          operationName: payload.operationName,
          txid: result.txid,
          tags: result.tags,
        });
      } else {
        // stop worker
        dispatch({ type: 'handleStop', payload: currentJob });
      }
    } else {
      // stop worker
      dispatch({ type: 'handleStop', payload: currentJob });
    }
  }
);

const handleRetry = async (originalTags: ITag[], operationName: string, txid: string) => {
  // retry current tx
  // get previous tags and filter quantity and target quantities and operation name
  const tags = originalTags.filter(
    (el) =>
      el.name !== TAG_NAMES.paymentQuantity &&
      el.name !== TAG_NAMES.paymentTarget &&
      el.name !== TAG_NAMES.operationName &&
      el.name !== 'Signing-Client-Version' &&
      el.name !== 'Signing-Client',
  );
  const quantity = originalTags.find(el => el.name === TAG_NAMES.paymentQuantity)?.value;
  const target = originalTags.find(el => el.name === TAG_NAMES.paymentTarget)?.value;
  if (!target || !quantity) {
    return 'Insufficient Tags to retry Transaction...';
  }
  try {
    const retryTx = await arweave.createTransaction({
      target,
      quantity,
    });
    switch (operationName) {
      case MODEL_INFERENCE_RESPONSE:
        retryTx.addTag(TAG_NAMES.operationName, INFERENCE_PAYMENT_DISTRIBUTION);
        retryTx.addTag(TAG_NAMES.responseTransaction, txid);
        break;
      case MODEL_FEE_PAYMENT_SAVE:
        retryTx.addTag(TAG_NAMES.operationName, MODEL_FEE_PAYMENT);
        retryTx.addTag(TAG_NAMES.saveTransaction, txid);
        break;
      case MODEL_INFERENCE_REQUEST:
        retryTx.addTag(TAG_NAMES.operationName, INFERENCE_PAYMENT);
        retryTx.addTag(TAG_NAMES.inferenceTransaction, txid);
        break;
      case MODEL_CREATION:
        retryTx.addTag(TAG_NAMES.operationName, MODEL_CREATION_PAYMENT);
        retryTx.addTag(TAG_NAMES.modelTransaction, txid);
        break;
      case SAVE_REGISTER_OPERATION:
        retryTx.addTag(TAG_NAMES.operationName, REGISTER_OPERATION);
        retryTx.addTag(TAG_NAMES.saveTransaction, txid);
        break;
      default:
        return 'Invalid Operation Name';
    }
    tags.forEach((tag) =>
      tag.name === TAG_NAMES.unixTime
        ? retryTx.addTag(tag.name, (Date.now() / 1000).toString())
        : retryTx.addTag(tag.name, tag.value),
    );
  
    await arweave.transactions.sign(retryTx);
    const response = await arweave.transactions.post(retryTx);
    
    if (response.status === 200) return { txid: retryTx.id, tags: retryTx.tags };
    else return response.statusText;
  } catch (error) {
    return error as string;
  }
};

const workerReducer = (state: WorkerContext, action: WorkerActions) => {
  switch (action.type) {
    case 'handleStart': {
      const jobs = state.state;
      jobs.push(action.payload);
      return state;
    }
    case 'handleStop': {
      return {
        ...state,
        state: state.state.filter(el => el.workerRef !== action.payload.workerRef),
      };
    }
    default: {
      return state;
    }
  }
};

const asyncStart = async (dispatch: Dispatch<WorkerActions>, payload: WorkerInfo) => { 
  const worker = new Worker(new URL('../workers/retry.ts', import.meta.url), { type: 'module' });
  
  worker.onmessage = subscribeMessages(payload, dispatch, worker);
  worker.postMessage(JSON.stringify(payload));
  const job: Job = { address: payload.address, workerRef: worker, operationName: payload.operationName };
  dispatch({ type: 'handleStart', payload: job});
};

const asyncStop = async (dispatch: Dispatch<WorkerActions>, payload: Job) => {
  const worker = payload.workerRef;
  worker.terminate();
  dispatch({ type: 'handleStop', payload });
};

const createActions = (dispatch: Dispatch<WorkerActions>) => {
  return {
    start: async (payload: WorkerInfo) => asyncStart(dispatch, payload),
    stop: async (payload: Job) => asyncStop(dispatch, payload),
  };
};

const initialState: WorkerContext = {
  state: [],
  startJob: async (payload: WorkerInfo) => console.log(payload),
};

export const WorkerContext = createContext<WorkerContext>(initialState);

export const WorkerProvider = ({ children }: { children: ReactNode }) => {

  const [ state, dispatch ] = useReducer(workerReducer, initialState);
  const actions = createActions(dispatch);


  useEffect(() => {
    // terminate all workers on component unmount
    return () => state.state.forEach(job => job.workerRef.terminate()); 
  }, []);

  return <WorkerContext.Provider value={{ ...state, startJob: actions.start }}>{children}</WorkerContext.Provider>;
};
