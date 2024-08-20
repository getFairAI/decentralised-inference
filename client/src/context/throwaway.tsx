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

import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getEthBalance,
  getUsdcAllowance,
  prompt,
  setIrys,
  setThrowawayProvider,
} from '@fairai/evm-sdk';
import { ConfigurationValues } from '@/interfaces/common';
import { generatePrivateKey, privateKeyToAddress } from 'viem/accounts';
import { EVMWalletContext } from './evm-wallet';
import { encryptSafely } from '@metamask/eth-sig-util';
import { PROTOCOL_NAME, PROTOCOL_VERSION } from '@/constants';
import { gql, useLazyQuery } from '@apollo/client';
import { isNetworkRequestInFlight } from '@apollo/client/core/networkStatus';
import { Backdrop, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

export interface ThrowawayContext {
  throwawayAddr: string;
  throwawayUsdcAllowance: number;
  throwawayBalance: number;
  promptWithThrowaway: (
    data: string | File,
    solutionTx: string,
    operator: { arweaveWallet: string; evmWallet: `0x${string}`; operatorFee: number },
    cid?: number,
    config?: ConfigurationValues,
  ) => Promise<{ arweaveTxId: string; evmTxId: string }>;
  updateBalance: (newAmount?: number) => Promise<void>;
  updateAllowance: (newAmount?: number) => Promise<void>;
}

const promptWithThrowaway = async (
  data: string | File,
  solutionTx: string,
  operator: { arweaveWallet: string; evmWallet: `0x${string}`; operatorFee: number },
  cid?: number,
  config?: ConfigurationValues,
) => prompt(data, solutionTx, operator, cid, config, true);

export const ThrowawayContext = createContext<ThrowawayContext>({
  throwawayAddr: '',
  throwawayBalance: 0,
  throwawayUsdcAllowance: 0,
  promptWithThrowaway,
  updateAllowance: async () => {},
  updateBalance: async () => {},
});

const irysQuery = gql`
  query requestsOnIrys($tags: [TagFilter!], $owners: [String!], $first: Int, $after: String) {
    transactions(tags: $tags, owners: $owners, first: $first, after: $after, order: DESC) {
      edges {
        cursor
        node {
          id
          tags {
            name
            value
          }
          address
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

export const ThrowawayProvider = ({ children }: { children: ReactNode }) => {
  const [throwawayAddr, setThrowawayAddr] = useState<string>('');
  const [throwawayBalance, setThrowawayBalance] = useState<number>(0);
  const [throwawayUsdcAllowance, setThrowawayAllowance] = useState<number>(0);
  const {
    currentAddress: mainAddr,
    getPubKey,
    postOnArweave,
    decrypt,
  } = useContext(EVMWalletContext);
  const [getExistingThrowaway, throwawayData] = useLazyQuery(irysQuery);
  const [isLayoverOpen, setIsLayoverOpen] = useState<boolean>(false);
  const theme = useTheme();

  useEffect(() => {
    (async () => {
      const storedWallet = localStorage.getItem('throwawayWallet');
      if (mainAddr && storedWallet) {
        await setIrys(storedWallet as `0x${string}`);
        await setThrowawayProvider(storedWallet as `0x${string}`);
        const addr = privateKeyToAddress(storedWallet as `0x${string}`);
        setThrowawayBalance(await getEthBalance(addr as `0x${string}`));
        setThrowawayAllowance(
          await getUsdcAllowance(mainAddr as `0x${string}`, addr as `0x${string}`),
        );
        setThrowawayAddr(addr);
      } else if (mainAddr) {
        getExistingThrowaway({
          variables: {
            tags: [
              { name: 'Protocol-Name', values: [PROTOCOL_NAME] },
              { name: 'Protocol-Version', values: [PROTOCOL_VERSION] },
              { name: 'Operation-Name', values: ['Ghost-Key'] },
            ],
            owners: [mainAddr],
            first: 1,
          },
          context: {
            clientName: 'irys',
          },
        });
        /*   */
      } else {
        // no wallet connected ignore
      }
    })();
  }, [mainAddr]);

  useEffect(() => {
    (async () => {
      if (throwawayData.data && throwawayData.data.transactions.edges.length > 0) {
        setIsLayoverOpen(true);
        const result = await fetch(
          `https://arweave.net/${throwawayData.data.transactions.edges[0].node.id}`,
        );
        const encData = await result.text();
        const decData = await decrypt(encData as `0x${string}`);
        await setIrys(decData as `0x${string}`);
        await setThrowawayProvider(decData as `0x${string}`);
        localStorage.setItem('throwawayWallet', decData as `0x${string}`);

        const addr = privateKeyToAddress(decData as `0x${string}`);
        setThrowawayBalance(await getEthBalance(addr as `0x${string}`));
        setThrowawayAllowance(
          await getUsdcAllowance(mainAddr as `0x${string}`, addr as `0x${string}`),
        );
        setThrowawayAddr(addr);
        setIsLayoverOpen(false);
      } else if (!isNetworkRequestInFlight(throwawayData.networkStatus) && throwawayData.called) {
        setIsLayoverOpen(true);
        // generate new throwaway key
        const throwawayKey = generatePrivateKey();
        // save encrypted throwaway key
        let pubKey = localStorage.getItem(`pubKeyFor:${mainAddr}`);

        if (!pubKey) {
          pubKey = await getPubKey();
          localStorage.setItem(`pubKeyFor:${mainAddr}`, pubKey);
        }

        const encData = encryptSafely({
          data: throwawayKey,
          publicKey: pubKey,
          version: 'x25519-xsalsa20-poly1305',
        });
        const secondInMS = 1000;

        await postOnArweave(JSON.stringify(encData), [
          { name: 'Protocol-Name', value: PROTOCOL_NAME },
          { name: 'Protocol-Version', value: PROTOCOL_VERSION },
          { name: 'Operation-Name', value: 'Ghost-Key' },
          { name: 'Unix-Time', value: (Date.now() / secondInMS).toString() },
        ]);

        await setIrys(throwawayKey);
        await setThrowawayProvider(throwawayKey as `0x${string}`);
        localStorage.setItem('throwawayWallet', throwawayKey);
        const addr = privateKeyToAddress(throwawayKey);

        setThrowawayBalance(await getEthBalance(addr as `0x${string}`));
        setThrowawayAllowance(
          await getUsdcAllowance(mainAddr as `0x${string}`, addr as `0x${string}`),
        );
        setThrowawayAddr(addr);
        setIsLayoverOpen(false);
      } else {
        // ignore
      }
    })();
  }, [throwawayData]);

  const updateBalance = useCallback(
    async (newAmount?: number) =>
      setThrowawayBalance(newAmount ?? (await getEthBalance(throwawayAddr as `0x${string}`))),
    [throwawayAddr],
  );

  const updateAllowance = useCallback(
    async (newAmount?: number) =>
      setThrowawayAllowance(
        newAmount ??
          (await getUsdcAllowance(mainAddr as `0x${string}`, throwawayAddr as `0x${string}`)),
      ),
    [throwawayAddr, mainAddr],
  );

  return (
    <ThrowawayContext.Provider
      value={{
        throwawayAddr,
        promptWithThrowaway,
        throwawayBalance,
        throwawayUsdcAllowance,
        updateBalance,
        updateAllowance,
      }}
    >
      {children}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: theme.zIndex.drawer + 1,
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(0,0,0,0.15)',
        }}
        open={isLayoverOpen}
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { delay: 0.1, duration: 0.4 } }}
          className='w-full max-w-[600px]'
        >
          <Typography
            variant='h3'
            className='flex items-center gap-3 bg-[#3aaaaa] rounded-2xl py-3 px-6'
          >
            <img src='./fair-protocol-face-transp-eyes.png' style={{ width: '40px' }} />
            {'Please continue on your wallet extension.'}
          </Typography>
          <div className='mt-2 rounded-2xl py-3 px-6 bg-slate-500 font-semibold text-lg'>
            For the Application to function properly, we will create a temporary wallet for you.
            <br />
            This wallet will remain on your device, and will be stored encrypted on arweave as a
            fallback.
          </div>
        </motion.div>
      </Backdrop>
      ;
    </ThrowawayContext.Provider>
  );
};
