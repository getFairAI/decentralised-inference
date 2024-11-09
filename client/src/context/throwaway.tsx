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
  useReducer,
  useState,
} from 'react';
import {
  getEthBalance,
  getUsdcAllowance,
  prompt,
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
import { OpfsContext } from './opfs';
import { BaseWebIrys } from '@irys/sdk/build/esm/web/base';
import { ITag } from '@/interfaces/arweave';
import { WebToken } from '@irys/sdk/build/esm/web/types';
import EthereumConfig from '@irys/sdk/build/esm/node/tokens/ethereum';

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

type ProxyWalletState = {
  current: 'initial' | 'wallet-connected' | 'ready' | 'proxy-found-in-opfs' | 'proxy-found-in-arweave' | 'proxy-generated';
  data: string;
};

type ProxyWalletAction = { type: 'set-proxy-found-in-opfs', data: string } |
  { type: 'set-wallet-connected' } |
  { type: 'set-proxy-found-in-arweave', data: string } |
  { type: 'set-proxy-generated', data: string } |
  { type: 'set-ready' } |
  { type: 'set-initial' };

const proxyWalletReducer: (state: ProxyWalletState, action: ProxyWalletAction) => ProxyWalletState = (state, action) => {
  switch (action.type) {
    case 'set-wallet-connected':
      return { ...state, current: 'wallet-connected', data: '' };
    case 'set-initial':
      return { ...state, current: 'initial', data: '' };
    case 'set-proxy-found-in-opfs':
      return { ...state, current: 'proxy-found-in-opfs', data: action.data };
    case 'set-proxy-generated':
      return { ...state, current: 'proxy-generated', data: action.data };
    case 'set-proxy-found-in-arweave':
      return { ...state, current: 'proxy-found-in-arweave', data: action.data };
    case 'set-ready':
      return { ...state, current: 'ready',  data: state.data };
    default:
      return state;
  };
};

export const ThrowawayProvider = ({ children }: { children: ReactNode }) => {
  const [ state, dispatch ] = useReducer(proxyWalletReducer, { current: 'initial', data: '' });

  const { payerPK: proxyKey, savePayerPK: setProxyKey } = useContext(OpfsContext);
  const [ throwawayAddr, setThrowawayAddr] = useState<string>('');
  const [ throwawayBalance, setThrowawayBalance] = useState<number>(0);
  const [ throwawayUsdcAllowance, setThrowawayUsdcAllowance] = useState<number>(0);
  const {
    currentAddress: mainAddr,
    getPubKey,
    postOnArweave,
    decrypt,
  } = useContext(EVMWalletContext);
  const [ getProxyKey, proxyData ] = useLazyQuery(irysQuery);
  const [isLayoverOpen, setIsLayoverOpen] = useState<boolean>(false);
  const theme = useTheme();

  useEffect(() => {
    if (mainAddr) {
      dispatch({ type: 'set-wallet-connected' });
    } else {
      dispatch({ type: 'set-initial' });
    }
  }, [ mainAddr, dispatch ]);

  useEffect(() => {
    // code to handleold versions of app, simple remove key from localStorage
    // it will then look for a key in arweave throught the new app normal flow
    const storedWallet = localStorage.getItem('throwawayWallet')?.split(':')[1] ?? localStorage.getItem('throwawayWallet');
    if (storedWallet) {
      localStorage.removeItem('throwawayWallet');
    }
  }, []);

  const customUpload = useCallback(
    async (data: string, tags: ITag[]) => {
      const arx = new BaseWebIrys({
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
            wallet: proxyKey!,
          }) as unknown as WebToken,
      });
      await arx.ready();

      const { id } = await arx.upload(data, { tags });

      return id;
    },
    [proxyKey],
  );

  useEffect(() => {
    (async () => {
      if (proxyData.data && proxyData.data.transactions.edges.length > 0) {
        const result = await fetch(
          `https://arweave.net/${proxyData.data.transactions.edges[0].node.id}`,
        );
        const encData = await result.text();
        const decData = await decrypt(encData as `0x${string}`);
        dispatch({ type: 'set-proxy-found-in-arweave', data: decData });
      } else if (!isNetworkRequestInFlight(proxyData.networkStatus) && proxyData.called) {
        // did not find proxy key on arweave; generate new one
        setIsLayoverOpen(true);
        // get key from storage or generate new throwaway key
        const newProxyKey = generatePrivateKey();
        dispatch({ type: 'set-proxy-generated', data: newProxyKey });
      } else {
        // ignore
      }
    })();
  }, [ mainAddr, proxyData, dispatch ]);

  const saveProxyKey = useCallback(async (pk: string) => {
    // save encrypted throwaway key
    let pubKey = localStorage.getItem(`pubKeyFor:${mainAddr}`);

    if (!pubKey) {
      pubKey = await getPubKey();
      localStorage.setItem(`pubKeyFor:${mainAddr}`, pubKey);
    }

    const encData = encryptSafely({
      data: pk,
      publicKey: pubKey,
      version: 'x25519-xsalsa20-poly1305',
    });
    const secondInMS = 1000;

    await postOnArweave(JSON.stringify(encData), [
      { name: 'Protocol-Name', value: PROTOCOL_NAME },
      { name: 'Protocol-Version', value: PROTOCOL_VERSION },
      { name: 'Operation-Name', value: 'Proxy-Key' },
      { name: 'Foreign-Owner', value: mainAddr as `0x${string}` },
      { name: 'Unix-Time', value: (Date.now() / secondInMS).toString() },
    ]);
    setProxyKey(pk);
    dispatch({ type: 'set-ready' });
  }, [ mainAddr, dispatch, setProxyKey ]);

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

  useEffect(() => {
    switch(state.current) {
      case 'wallet-connected':
        // try to find existing proxy wallet
        if (proxyKey) {
          dispatch({ type: 'set-proxy-found-in-opfs', data: proxyKey });
        } else {
          // search in arweave
          getProxyKey({
            variables: {
              tags: [
                { name: 'Foreign-Owner', values: [mainAddr as `0x${string}`] },
                { name: 'Operation-Name', values: ['Ghost-Key', 'Proxy-Key'] },
                { name: 'Protocol-Version', values: [PROTOCOL_VERSION] },
                { name: 'Protocol-Name', values: [PROTOCOL_NAME] },
              ],
              first: 1,
            },
            context: { clientName: 'irys' },
          });
        }
        break;
      case 'proxy-generated':
        // save proxy key
        (async () => await saveProxyKey(state.data))();
        break;
      case 'proxy-found-in-arweave':
        // set wallet
        setProxyKey(state.data);
        dispatch({ type: 'set-ready' });
        break;
      case 'proxy-found-in-opfs':
        // set wallet
        dispatch({ type: 'set-ready' });
        break;
      case 'ready':
        // set wallet fields to export
        (async () => {
          const address = privateKeyToAddress(proxyKey as `0x${string}`);
          setThrowawayBalance(await getEthBalance(address));
          setThrowawayUsdcAllowance(await getUsdcAllowance(mainAddr as `0x${string}`, address as `0x${string}`));
          await setThrowawayProvider(proxyKey as `0x${string}`);
          setThrowawayAddr(address);

        })();
        break;
      default:
        return;
    }
  }, [ state, proxyKey, mainAddr, setProxyKey, dispatch, saveProxyKey, getProxyKey]);

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
