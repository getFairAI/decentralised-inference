/*
 * Fair Protocol, open source decentralised inference marketplace for artificial intelligence.
 * Copyright (C) 2023 Fair Protocol
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 */

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
  const [ state, dispatch ] = useReducer(walletReducer, initialState);

  useEffect(() => {
    (async () => {
      const opfsRoot = await navigator.storage.getDirectory();
      const payerFileHandle = await opfsRoot.getFileHandle('payerPK.txt', { create: true });
      const payerFile = await payerFileHandle.getFile();
      try {
        const pk = await payerFile.text(); // read payerPK from file
        dispatch({ type: 'load_payer_pk', payerPk: pk });
      } catch (err) {
        console.error(err, 'error reading payerPK');
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

  const exportValue = useMemo(
    () => ({ ...state, savePayerPK }),
    [ state, savePayerPK]
  );

  return <OpfsContext.Provider value={exportValue}>{children}</OpfsContext.Provider>;
};