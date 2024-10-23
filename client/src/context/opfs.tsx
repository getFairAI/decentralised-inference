import { ReactNode, createContext, useCallback, useEffect, useMemo, useReducer } from 'react';
import { JWKInterface } from 'warp-contracts';

interface OpfsState {
  payerPK: string | null; // arbitrum wallet private key to pay tx fees and operator fees
  uploaderPK: JWKInterface | null; // arweave wallet JWK to upload data to arweave
}

interface IOpfsContext extends OpfsState {
  savePayerPK: (pk: string) => Promise<void>;
  saveUploaderPK: (jwk: JWKInterface) => Promise<void>;
}

type LoadPayerPk = {
  type: 'load_payer_pk';
  payerPk: string;
};

type LoadUploaderPk = {
  type: 'load_uploader_pk';
  uploaderPk: JWKInterface;
};

type OpfsAction = LoadPayerPk | LoadUploaderPk;

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
    case 'load_uploader_pk':
      return {
        ...state,
        uploaderPK: action.uploaderPk,
      };
    default:
      return state;
  }
};

const initialState: OpfsState = {
  payerPK: null,
  uploaderPK: null,
};

export const OpfsContext = createContext<IOpfsContext>({} as IOpfsContext);

export const OpfsProvider = ({ children }: { children: ReactNode }) => {
  const [ state, dispatch ] = useReducer(walletReducer, initialState);

  useEffect(() => {
    (async () => {
      const opfsRoot = await navigator.storage.getDirectory();
      const payerFileHandle = await opfsRoot.getFileHandle('payerPK.txt', { create: true });
      const uploaderFileHandle = await opfsRoot.getFileHandle('uploaderPK.json', { create: true });
      const payerFile = await payerFileHandle.getFile();
      const uploaderFile = await uploaderFileHandle.getFile();
      try {
        const pk = await payerFile.text(); // read payerPK from file
        dispatch({ type: 'load_payer_pk', payerPk: pk });
      } catch (err) {
        console.log(err, 'error reading payerPK');
      }
     
      try {
        const jwk = JSON.parse(await uploaderFile.text()); // read uploaderPK from file
        dispatch({ type: 'load_uploader_pk', uploaderPk: jwk });
      } catch (err) {
        console.log(err, 'error reading uploaderPK');
      }
    })();
  }, [ navigator, dispatch ]); // run on first render

  const savePayerPK = useCallback(async (pk: string) => {
    const opfsRoot = await navigator.storage.getDirectory();
    const payerFileHandle = await opfsRoot.getFileHandle('payerPK.txt', { create: true });
    const payerFile = await payerFileHandle.createWritable();
    await payerFile.write(pk);
    await payerFile.close();
    dispatch({ type: 'load_payer_pk', payerPk: pk });
  }, [ navigator, dispatch ]);

  const saveUploaderPK = useCallback(async (jwk: JWKInterface) => {
    const opfsRoot = await navigator.storage.getDirectory();
    const uploaderFileHandle = await opfsRoot.getFileHandle('uploaderPK.json', { create: true });
    const uploaderFile = await uploaderFileHandle.createWritable();
    await uploaderFile.write(JSON.stringify(jwk));
    await uploaderFile.close();
    dispatch({ type: 'load_uploader_pk', uploaderPk: jwk });
  }, [ navigator, dispatch ]);

  const exportValue = useMemo(
    () => ({ ...state, savePayerPK, saveUploaderPK }),
    [ state, savePayerPK, saveUploaderPK]
  );

  return <OpfsContext.Provider value={exportValue}>{children}</OpfsContext.Provider>;
};