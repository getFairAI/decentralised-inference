import { connect, assign } from '@permaweb/aoconnect';
import {
  createData,
  ArweaveSigner,
  DataItem,
  DataItemCreateOptions,
  JWKInterface,
  EthereumSigner,
} from '@dha-team/arbundles';
import { assert, isNotUndefined } from 'typed-assert';

interface SignDataItemParams extends DataItemCreateOptions {
  data: string | Uint8Array;
}

interface RawDataItem extends DataItemCreateOptions {
  data: number[];
}

function isArrayBuffer(input: unknown): asserts input is ArrayBuffer {
  isNotUndefined('Data has to be defined.');
  assert(ArrayBuffer.isView(input), 'Input is not an ArrayBuffer.');
}

const { result, results, message, spawn, monitor, unmonitor, dryrun } = connect();

// fake arweave wallet signDataItem function
const preprocess = async (dataItem: SignDataItemParams) => {
  let rawDataItem: RawDataItem;

  // validate
  if (typeof dataItem.data !== 'string') {
    isArrayBuffer(dataItem.data);

    rawDataItem = {
      ...dataItem,
      data: Array.from(dataItem.data),
    };
  } else {
    rawDataItem = {
      ...dataItem,
      data: Array.from(new TextEncoder().encode(dataItem.data)),
    };
  }

  return [rawDataItem];
};

const signDataItem = async (dataItem: DataItem) => {
  const [rawDataItem] = await preprocess(dataItem);

  // get user wallet
  const wallet = JSON.parse(localStorage.getItem('test-arweave')!) as JWKInterface;

  const { data, ...options } = rawDataItem;
  const binaryData = new Uint8Array(data);
  // create bundlr tx as a data entry
  const dataSigner = new ArweaveSigner(wallet);
  const dataEntry = createData(binaryData, dataSigner, options);
  // sign item
  await dataEntry.sign(dataSigner);

  const result = Array.from<number>(dataEntry.getRaw());

  const finalDataItem = new Uint8Array(result);

  return finalDataItem.buffer;
};

const signDataItemEth = async (dataItem: DataItem, ethPK: string) => {
  const [rawDataItem] = await preprocess(dataItem);

  // get user wallet
  // const wallet = JSON.parse(localStorage.getItem('test-arweave')!) as JWKInterface;

  const { data, ...options } = rawDataItem;
  const binaryData = new Uint8Array(data);
  // create bundlr tx as a data entry
  const dataSigner = new EthereumSigner(ethPK);
  const dataEntry = createData(binaryData, dataSigner, options);
  // sign item
  await dataEntry.sign(dataSigner);

  const result = Array.from<number>(dataEntry.getRaw());

  const finalDataItem = new Uint8Array(result);

  return finalDataItem.buffer;
};

interface signerParams {
  data?: string | Uint8Array;
  tags?: {
    name?: string;
    value?: string;
  }[];
  target?: string;
  anchor?: string;
}

/**
 * createDataItem can be passed here for the purposes of unit testing
 * with a stub
 */
const customDataSigner = async (
  { data, tags, target, anchor }: Partial<signerParams>,
  createDataItem = (buf: Buffer) => new DataItem(buf),
) => {
  /**
   * signDataItem interface according to ArweaveWalletConnector
   *
   * https://github.com/jfbeats/ArweaveWalletConnector/blob/7c167f79cd0cf72b6e32e1fe5f988a05eed8f794/src/Arweave.ts#L46C23-L46C23
   */
  const view = await signDataItem({ data, tags, target, anchor } as DataItem);
  const dataItem = createDataItem(Buffer.from(view));
  return {
    id: await dataItem.id,
    raw: await dataItem.getRaw(),
  };
};

/**
 * createDataItem can be passed here for the purposes of unit testing
 * with a stub
 */
const customDataSignerEth = (ethPk: string) => {
  const createDataItem = (buf: Buffer) => new DataItem(buf);
  const signer = async ({ data, tags, target, anchor }: signerParams) => {
    /**
     * signDataItem interface according to ArweaveWalletConnector
     *
     * https://github.com/jfbeats/ArweaveWalletConnector/blob/7c167f79cd0cf72b6e32e1fe5f988a05eed8f794/src/Arweave.ts#L46C23-L46C23
     */
    // const pk = '0xa4b46cf442ca78cbd0d57b73a45b0fe9b5a92ef6b5aba29c112f804cee64f67d';
    const view = await signDataItemEth({ data, tags, target, anchor } as DataItem, ethPk);
    const dataItem = createDataItem(Buffer.from(view));
    return {
      id: await dataItem.id,
      raw: await dataItem.getRaw(),
    };
  };

  return signer;
};

const encrypt = async (data: string, wallet: JWKInterface) => {
  const publicKey = {
    kty: 'RSA',
    e: 'AQAB',
    n: wallet.n,
    alg: 'RSA-OAEP-256',
    ext: true,
  };

  // encode data to utf-8 Uint8Array
  const binData = new TextEncoder().encode(data);
  // standard RSA decryption
  const key = await crypto.subtle.importKey(
    'jwk',
    publicKey,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt'],
  );
  const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, binData);

  return new Uint8Array(encrypted);
};

const decrypt = async (encryptedData: Uint8Array, wallet: JWKInterface) => {
  const pk = { ...wallet, alg: 'RSA-OAEP-256', ext: true };
  // standard RSA decryption
  const key = await crypto.subtle.importKey(
    'jwk',
    pk,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['decrypt'],
  );
  const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, encryptedData);

  return new TextDecoder().decode(new Uint8Array(decrypted));
};

export default {
  assign,
  result,
  results,
  message,
  spawn,
  monitor,
  unmonitor,
  dryrun,
  customDataSigner,
  customDataSignerEth,
  encrypt,
  decrypt,
};
