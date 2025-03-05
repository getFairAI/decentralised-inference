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

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
import { BaseWebIrys } from '@irys/sdk/build/esm/web/base';
import EthereumConfig from '@irys/sdk/build/esm/node/tokens/ethereum';
import { type WebToken } from '@irys/sdk/build/esm/web/types';
import { ITag } from '@/interfaces/arweave';

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
  customUpload: (data: string, tags: ITag[]) => Promise<string>;
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
  customUpload: async () => '',
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
  const [privateKey, setPrivateKey] = useState<string>('');
  const [throwawayAddr, setThrowawayAddr] = useState<string>('');
  const [throwawayBalance, setThrowawayBalance] = useState<number>(0);
  const [throwawayUsdcAllowance, setThrowawayUsdcAllowance] = useState<number>(0);
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
      // throwaway wallet is stored in local storage in the format of `${connectedAddress}:${privateKey}`
      // connectedAddress is the last connected address that has been used to generate the throwaway wallet
      // if current address and last connected address differ, then there is the need to generate new encrypted throwaway wallet and save to arweave
      const isOldVersion =
        localStorage.getItem('throwawayWallet') &&
        !localStorage.getItem('throwawayWallet')?.includes(':');

      const storedWallet = localStorage.getItem('throwawayWallet')?.split(':')[1];
      const lastConnectedAddress = localStorage.getItem('throwawayWallet')?.split(':')[0];
      if (
        mainAddr &&
        storedWallet &&
        mainAddr.toLowerCase() === lastConnectedAddress?.toLowerCase()
      ) {
        setPrivateKey(storedWallet);
        await setIrys(storedWallet as `0x${string}`);
        setThrowawayProvider(storedWallet as `0x${string}`);
        const addr = privateKeyToAddress(storedWallet as `0x${string}`);
        setThrowawayBalance(await getEthBalance(addr));
        setThrowawayUsdcAllowance(await getUsdcAllowance(mainAddr as `0x${string}`, addr));
        setThrowawayAddr(addr);
      } else if (!mainAddr) {
        // no wallet connected ignore
      } else if (mainAddr || isOldVersion) {
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

  const customUpload = useCallback(
    async (data: string, tags: ITag[]) => {
      const irys = new BaseWebIrys({
        network: 'mainnet',
        config: {
          providerUrl: 'https://arb1.arbitrum.io/rpc',
        },
        getTokenConfig: (i): WebToken =>
          new EthereumConfig({
            irys: i,
            name: 'arbitrum',
            ticker: 'ARB',
            minConfirm: 1,
            providerUrl: 'https://arb1.arbitrum.io/rpc',
            wallet: privateKey,
          }) as unknown as WebToken,
      });
      await irys.ready();

      const { id } = await irys.upload(data, { tags });

      return id;
    },
    [privateKey],
  );

  useEffect(() => {
    (async () => {
      if (throwawayData.data && throwawayData.data.transactions.edges.length > 0) {
        setIsLayoverOpen(true);
        const result = await fetch(
          `https://arweave.net/${throwawayData.data.transactions.edges[0].node.id}`,
        );
        const encData = await result.text();
        const buf = Buffer.from(
          encData,
          'utf8'
        );
        const encryptedValue = '0x' + buf.toString('hex');  
        const decData = await decrypt(encryptedValue as `0x${string}`);
        setPrivateKey(decData);
        await setIrys(decData as `0x${string}`);
        setThrowawayProvider(decData as `0x${string}`);
        localStorage.setItem('throwawayWallet', `${mainAddr}:${decData}`);

        const addr = privateKeyToAddress(decData as `0x${string}`);
        setThrowawayBalance(await getEthBalance(addr));
        setThrowawayUsdcAllowance(await getUsdcAllowance(mainAddr as `0x${string}`, addr));
        setThrowawayAddr(addr);
        setIsLayoverOpen(false);
      } else if (!isNetworkRequestInFlight(throwawayData.networkStatus) && throwawayData.called) {
        setIsLayoverOpen(true);
        // get key from storage or generate new throwaway key
        const storedWallet =
          localStorage.getItem('throwawayWallet')?.split(':')[1] ??
          localStorage.getItem('throwawayWallet');
        const throwawayKey = storedWallet ?? generatePrivateKey();
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

        setPrivateKey(throwawayKey);
        await setIrys(throwawayKey as `0x${string}`);
        setThrowawayProvider(throwawayKey as `0x${string}`);
        localStorage.setItem('throwawayWallet', `${mainAddr}:${throwawayKey}`);
        const addr = privateKeyToAddress(throwawayKey as `0x${string}`);

        setThrowawayBalance(await getEthBalance(addr));
        setThrowawayUsdcAllowance(await getUsdcAllowance(mainAddr as `0x${string}`, addr));
        setThrowawayAddr(addr);
        setIsLayoverOpen(false);
      } else {
        // ignore
      }
    })();
  }, [mainAddr, throwawayData]);

  const updateBalance = useCallback(
    async (newAmount?: number) =>
      setThrowawayBalance(newAmount ?? (await getEthBalance(throwawayAddr as `0x${string}`))),
    [throwawayAddr],
  );

  const updateAllowance = useCallback(
    async (newAmount?: number) =>
      setThrowawayUsdcAllowance(
        newAmount ??
          (await getUsdcAllowance(mainAddr as `0x${string}`, throwawayAddr as `0x${string}`)),
      ),
    [throwawayAddr, mainAddr],
  );

  const value = useMemo(
    () => ({
      throwawayAddr,
      promptWithThrowaway,
      throwawayBalance,
      throwawayUsdcAllowance,
      updateBalance,
      updateAllowance,
      customUpload,
    }),
    [
      throwawayAddr,
      throwawayBalance,
      throwawayUsdcAllowance,
      promptWithThrowaway,
      updateBalance,
      updateAllowance,
      customUpload,
    ],
  );

  return (
    <ThrowawayContext.Provider value={value}>
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
    </ThrowawayContext.Provider>
  );
};
