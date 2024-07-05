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

import { ReactNode, createContext, useEffect, useState } from 'react';
import arweave from '@/utils/arweave';
import { JWKInterface } from 'arweave/web/lib/wallet';
import { setIrys, prompt } from '@fairai/evm-sdk';
import { ConfigurationValues } from '@/interfaces/common';

export interface ThrowawayContext {
  throwawayWallet: JWKInterface | null;
  throwawayAddr: string;
  promptWithThrowaway: (
    data: string | File,
    solutionTx: string,
    operator: { arweaveWallet: string; evmWallet: `0x${string}`; operatorFee: number },
    cid?: number,
    config?: ConfigurationValues,
  ) => Promise<{ arweaveTxId: string; evmTxId: string }>;
}

const promptWithThrowaway = async (
  data: string | File,
  solutionTx: string,
  operator: { arweaveWallet: string; evmWallet: `0x${string}`; operatorFee: number },
  cid?: number,
  config?: ConfigurationValues,
) => prompt(data, solutionTx, operator, cid, config, true);

export const ThrowawayContext = createContext<ThrowawayContext>({
  throwawayWallet: null,
  throwawayAddr: '',
  promptWithThrowaway,
});

export const ThrowawayProvider = ({ children }: { children: ReactNode }) => {
  const [throwawayWallet, setThrowawayWallet] = useState<JWKInterface | null>(null);
  const [throwawayAddr, setThrowawayAddr] = useState<string>('');

  useEffect(() => {
    (async () => {
      const storedWallet = localStorage.getItem('throwawayWallet');
      if (!storedWallet || storedWallet === '') {
        const jwk = await arweave.wallets.generate();
        console.log(JSON.stringify(jwk));
        setThrowawayWallet(jwk);
        setThrowawayAddr(await arweave.wallets.jwkToAddress(jwk));
        localStorage.setItem('throwawayWallet', JSON.stringify(jwk));
        await setIrys(jwk);
      } else {
        setThrowawayWallet(JSON.parse(storedWallet));
        setThrowawayAddr(await arweave.wallets.jwkToAddress(JSON.parse(storedWallet)));
        await setIrys(JSON.parse(storedWallet));
      }
    })();
  }, [localStorage]);

  return (
    <ThrowawayContext.Provider value={{ throwawayWallet, throwawayAddr, promptWithThrowaway }}>
      {children}
    </ThrowawayContext.Provider>
  );
};
