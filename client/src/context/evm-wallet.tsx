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
import { EIP1193Provider, hexToBigInt, Log } from 'viem';
import { arbitrum } from 'viem/chains';
import { getConnectedAddress, getEthBalance, getUsdcBalance, setProvider, countStamps, switchChain, getCurrentChainId, startConversation, setIrys, postOnArweave, prompt, subscribe } from '@fairai/evm-sdk';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useEvmProviders } from '@/hooks/useEvmProviders';
import { EIP6963ProviderDetail } from '@/interfaces/evm';

type WalletConnectedAction = {
  type: 'wallet_connected';
  address: string;
  ethBalance: number;
  usdcBalance: number;
};

type UpdateUSDCBalanceAction = {
  type: 'update_usdc_balance';
  newBalance: number;
};

type UpdateProvidersAction = {
  type: 'update_providers';
  providers: EIP6963ProviderDetail[];
};

type WalletDisconnectedAction = {
  type: 'wallet_disconnected';
};

type SetWalletWrongChainAction = {
  type: 'wallet_wrong_chain';
  isWrongChain: boolean;
}

type EVMWalletAction = WalletConnectedAction | WalletDisconnectedAction | UpdateProvidersAction | UpdateUSDCBalanceAction | SetWalletWrongChainAction;

interface Configuration {
  assetNames?: string[];
  customTags?: { name: string; value: string }[];
  negativePrompt?: string;
  nImages?: number;
  title?: string;
  description?: string;
  width?: number;
  height?: number;
  requestCaller?: string;
}

interface EVMWalletState {
  currentAddress: string;
  ethBalance: number;
  usdcBalance: number;
  providers: EIP6963ProviderDetail[];
  isWrongChain: boolean;
}

interface IEVMWalletContext extends EVMWalletState {
  connect: (provider?: EIP1193Provider) => Promise<void>;
  startConversation: (txid: string, cid: string) => Promise<void>;
  prompt: (data: string | File, scriptTx: string, operator: { evmWallet: `0x${string}`, operatorFee: number }, cid?: number, config?: Configuration) => Promise<{ arweaveTxId: string, evmTxId: string }>;
  postOnArweave: (text: string, tags: {name: string, value: string}[]) => Promise<string>;
  countStamps: (txids: string[]) => Promise<Record<string, number>>;
  updateUsdcBalance: (newBalance: number) => void;
  switchChain: () => void;
  disconnect: () => void;
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
        isWrongChain: false,
      };
    case 'wallet_disconnected':
      return {
        ...state,
        currentAddress: '',  
        ethBalance: 0,
        usdcBalance: 0,
        isWrongChain: false,
      };
    case 'update_providers':
      return {
        ...state,
        providers: action.providers,
      };
    case 'update_usdc_balance':
      return {
        ...state,
        usdcBalance: action.newBalance,
      };
    case 'wallet_wrong_chain':
      return {
        ...state,
        currentAddress: '',  
        ethBalance: 0,
        usdcBalance: 0,
        isWrongChain: action.isWrongChain,
      };
    default:
      return state;
  }
};

const initialState: EVMWalletState = {
  currentAddress: '',
  ethBalance: 0,
  usdcBalance: 0,
  providers: [],
  isWrongChain: false,
};


const asyncEvmWalletconnect = async (dispatch: Dispatch<EVMWalletAction>, provider: EIP1193Provider) => {
  try {
    await setProvider(provider);
    await setIrys(provider);
    if (await getCurrentChainId() !== arbitrum.id) {
      switchChain(arbitrum);
      // subscribe to chain switched event
    } else {
      const address = getConnectedAddress();
      const ethBalance = await getEthBalance();
      const usdcBalance = await getUsdcBalance();
      dispatch({ type: 'wallet_connected', address, ethBalance, usdcBalance });
    }
  } catch (error) {
    console.error('Error connecting wallet', error);
  }
};

const handleChainChanged = async (dispatch: Dispatch<EVMWalletAction>) => {
  if (await getCurrentChainId() !== arbitrum.id) {
    // 
    dispatch({ type: 'wallet_wrong_chain', isWrongChain: true });
  } else {
    const address = getConnectedAddress();
    const ethBalance = await getEthBalance();
    const usdcBalance = await getUsdcBalance();
    dispatch({ type: 'wallet_connected', address, ethBalance, usdcBalance });
  }
};

export const EVMWalletContext = createContext<IEVMWalletContext>({} as IEVMWalletContext);

export const EVMWalletProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const [ currentProvider, setCurrentProvider ] = useState<EIP1193Provider | null>(null);
  const providers = useEvmProviders();
  const { localStorageValue: previousProvider, updateStorageValue: setPreviousProvider } = useLocalStorage('evmProvider');
  
  const handleConnect = async (provider?: EIP1193Provider) => {
    if (provider) {
      setCurrentProvider(provider);
      await asyncEvmWalletconnect(dispatch, provider);
    } else {
      // connect to the previous provider
      const previousConnectedProvider = providers.find(provider => provider.info.name === previousProvider);
      if (previousConnectedProvider) {
        setCurrentProvider(previousConnectedProvider.provider);
        await asyncEvmWalletconnect(dispatch, previousConnectedProvider.provider);
      }
    }
  };

  const handleAccountChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      dispatch({ type: 'wallet_disconnected' });
      setPreviousProvider('');
    } else if (accounts[0] !== state.currentAddress) {
      await asyncEvmWalletconnect(dispatch, currentProvider as EIP1193Provider);
    } else {
      // wallet already connected ignore
    }
  };
  // update the connect function with async method
  const value = useMemo(() => ({
    ...state,
    countStamps,
    startConversation,
    postOnArweave,
    prompt,
    switchChain: () => switchChain(arbitrum),
    connect: handleConnect,
    updateUsdcBalance: (newBalance: number) => dispatch({ type: 'update_usdc_balance', newBalance }),
    disconnect: () => {
      dispatch({ type: 'wallet_disconnected' });
      setPreviousProvider('');
    },
  } as IEVMWalletContext), [state, currentProvider, dispatch]);

  useEffect(() => {
    if (currentProvider) {
      // subscribe to wallet changes
      currentProvider.on('accountsChanged', handleAccountChanged);
      currentProvider.on('chainChanged', async () => handleChainChanged(dispatch));

      return () => {
        currentProvider.removeListener('chainChanged', async () => handleChainChanged(dispatch));
        currentProvider.removeListener('accountsChanged', handleAccountChanged);
      };
    }
  }, [ currentProvider ]);

  useEffect(() => {
    dispatch({ type: 'update_providers', providers });
    (async () => await handleConnect())();
  }, [ previousProvider, providers ]);

  const handleUsdcReceived = (log: Log[]) => {
    const latest = log.pop();

    if (latest) {
      const { data } = latest;
      const received = Number(hexToBigInt(data));
      dispatch({ type: 'update_usdc_balance', newBalance: state.usdcBalance + received });
    }
  };

  useEffect(() => {
    if (state.currentAddress) {
      const unwatch = subscribe(state.currentAddress  as `0x${string}`, handleUsdcReceived);

      return () => unwatch();
    }
  }, [ state ]);

  return <EVMWalletContext.Provider value={value}>{children}</EVMWalletContext.Provider>;
};
