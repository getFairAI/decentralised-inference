import {
  EthEncryptedData,
  decryptSafely,
  encryptSafely,
  getEncryptionPublicKey,
} from '@metamask/eth-sig-util';
import { ReactNode, createContext, useCallback, useEffect, useMemo, useReducer } from 'react';

interface OpfsState {
  payerPK: string | null; // arbitrum wallet private key to pay tx fees and operator fees
}

interface IOpfsContext extends OpfsState {
  savePayerPK: (pk: string) => Promise<void>;
}

type LoadPayerPk = {
  type: 'load_payer_pk';
  payerPk: string;
};

type OpfsAction = LoadPayerPk;

const walletReducer = (state: OpfsState, action: OpfsAction) => {
  if (!action) {
    return state;
  }

  switch (action.type) {
    case 'load_payer_pk':
      return {
        ...state,
        payerPK: action.payerPk,
      };
    default:
      return state;
  }
};

const initialState: OpfsState = {
  payerPK: null,
};

export const OpfsContext = createContext<IOpfsContext>({} as IOpfsContext);

export const OpfsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  useEffect(() => {
    (async () => {
      const opfsRoot = await navigator.storage.getDirectory();
      const payerFileHandle = await opfsRoot.getFileHandle('payerPK.txt', { create: true });
      // const uploaderFileHandle = await opfsRoot.getFileHandle('uploaderPK.json', { create: true });
      const payerFile = await payerFileHandle.getFile();
      /* const uploaderFile = await uploaderFileHandle.getFile(); */
      try {
        const pk = await payerFile.text(); // read payerPK from file
        dispatch({ type: 'load_payer_pk', payerPk: pk });
      } catch (err) {
        console.log(err, 'error reading payerPK');
      }
    })();
  }, [navigator, dispatch]); // run on first render

  const savePayerPK = useCallback(
    async (pk: string) => {
      const opfsRoot = await navigator.storage.getDirectory();
      const payerFileHandle = await opfsRoot.getFileHandle('payerPK.txt', { create: true });
      const payerFile = await payerFileHandle.createWritable();
      await payerFile.write(pk);
      await payerFile.close();
      dispatch({ type: 'load_payer_pk', payerPk: pk });
    },
    [navigator, dispatch],
  );

  const decrypt = useCallback(
    (data: EthEncryptedData) => {
      const pk = state.payerPK;
      if (!pk) {
        throw new Error('Private key not found');
      }

      return decryptSafely({ encryptedData: data, privateKey: pk.replace('0x', '') });
    },
    [state, decryptSafely],
  );

  const encrypt = useCallback(
    (data: string, pubKey?: string) => {
      if (!pubKey) {
        // encrypt for own private key
        const pk = state.payerPK;
        if (!pk) {
          throw new Error('Private key not found');
        }
        pubKey = getEncryptionPublicKey(pk.replace('0x', ''));
      }
      // otherswise encrypt for the given public key
      return encryptSafely({ data, publicKey: pubKey, version: 'x25519-xsalsa20-poly1305' });
    },
    [state, encryptSafely, getEncryptionPublicKey],
  );

  const exportValue = useMemo(
    () => ({ ...state, savePayerPK, decrypt, encrypt }),
    [state, savePayerPK, decrypt, encrypt],
  );

  return <OpfsContext.Provider value={exportValue}>{children}</OpfsContext.Provider>;
};
