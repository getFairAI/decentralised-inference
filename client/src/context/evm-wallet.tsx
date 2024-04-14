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

import 'viem/window';
import { createContext, Dispatch, ReactNode, useEffect, useMemo, useReducer, useState } from 'react';
import { EIP1193Provider } from 'viem';
import { arbitrum } from 'viem/chains';
import { getConnectedAddress, getEthBalance, getUsdcBalance, setProvider, countStamps, switchChain, getCurrentChain, startConversation, setIrys, postOnArweave, prompt } from '@fairai/evm-sdk';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useEvmProviders } from '@/hooks/useEvmProviders';
import { EIP6963ProviderDetail } from '@/interfaces/evm';

type WalletConnectedAction = {
  type: 'wallet_connected';
  address: string;
  ethBalance: number;
  usdcBalance: number;
};

type UpdateProvidersAction = {
  type: 'update_providers';
  providers: EIP6963ProviderDetail[];
};

type WalletDisconnectedAction = {
  type: 'wallet_disconnected';
};

type EVMWalletAction = WalletConnectedAction | WalletDisconnectedAction | UpdateProvidersAction;

interface EVMWalletState {
  currentAddress: string;
  ethBalance: number;
  usdcBalance: number;
  providers: EIP6963ProviderDetail[];
}

interface IEVMWalletContext extends EVMWalletState {
  connect: (provider: EIP1193Provider) => Promise<void>;
  startConversation: (txid: string, cid: string) => Promise<void>;
  prompt: (data: string | File, scriptTx: string, operator: { evmWallet: `0x${string}`, operatorFee: number }, cid?: number) => Promise<{ arweaveTxId: string, evmTxId: string }>;
  postOnArweave: (text: string, tags: {name: string, value: string}[]) => Promise<string>;
  countStamps: (txids: string[]) => Promise<Record<string, number>>;
}

const walletReducer = (state: EVMWalletState, action: EVMWalletAction) => {
  if (!action) {
    return state;
  }

  switch (action.type) {
    case 'wallet_connected':
      return {
        ...state,
        currentAddress: action.address,  
        ethBalance: action.ethBalance,
        usdcBalance: action.usdcBalance,
      };
    case 'wallet_disconnected':
      return {
        ...state,
        currentAddress: '',  
        ethBalance: 0,
        usdcBalance: 0,
      };
    case 'update_providers':
      return {
        ...state,
        providers: action.providers,
      };
    default:
      return state;
  }
};

const initialState: EVMWalletState = {
  currentAddress: '',
  ethBalance: 0,
  usdcBalance: 0,
  providers: []
};


const asyncEvmWalletconnect = async (dispatch: Dispatch<EVMWalletAction>, provider: EIP1193Provider) => {
  try {
    await setProvider(provider);
    await setIrys(window?.ethereum as EIP1193Provider);
    if (getCurrentChain() !== arbitrum) {
      switchChain(arbitrum);
    }
    const address = getConnectedAddress();
    const ethBalance = await getEthBalance();
    const usdcBalance = await getUsdcBalance();
    dispatch({ type: 'wallet_connected', address, ethBalance, usdcBalance });
  } catch (error) {
    console.error('Error connecting wallet', error);
  }
};

export const EVMWalletContext = createContext<IEVMWalletContext>({} as IEVMWalletContext);

export const EVMWalletProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const [ currentProvider, setCurrentProvider ] = useState<EIP1193Provider | null>(null);

  
  const providers = useEvmProviders();
  const { localStorageValue: previousProvider } = useLocalStorage('evmProvider');
  
  // update the connect function with async method
  const value = useMemo(() => ({
    ...state,
    countStamps,
    startConversation,
    postOnArweave,
    prompt,
    connect: async (provider: EIP1193Provider) => {
      setCurrentProvider(provider);
      
      return asyncEvmWalletconnect(dispatch, provider);
    },
  } as IEVMWalletContext), [state, dispatch]);

  useEffect(() => {
    if (currentProvider) {
      // subscribe to wallet changes
      currentProvider.on('accountsChanged', async () => asyncEvmWalletconnect(dispatch, currentProvider));
      currentProvider.on('disconnect', () => dispatch({ type: 'wallet_disconnected' }));

      return () => {
        currentProvider.removeListener('accountsChanged', async () => asyncEvmWalletconnect(dispatch, currentProvider));
        currentProvider.removeListener('disconnect', () => dispatch({ type: 'wallet_disconnected' }));
      };
    }
  }, [ currentProvider ]);

  useEffect(() => {
    dispatch({ type: 'update_providers', providers });
    const previousConnectedProvider = providers.find(provider => provider.info.name === previousProvider);
    if (previousConnectedProvider) {
      // if it has previously connected to a provider and that provider is available, connect to it
      setCurrentProvider(previousConnectedProvider.provider);
      (async () => asyncEvmWalletconnect(dispatch, previousConnectedProvider.provider))();
    }
  }, [ previousProvider, providers ]);

  return <EVMWalletContext.Provider value={value}>{children}</EVMWalletContext.Provider>;
};
