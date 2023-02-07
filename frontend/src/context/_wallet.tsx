import { ArweaveWebWallet } from "arweave-wallet-connector";
import Transaction from "arweave/web/lib/transaction";
import { createContext, ReactNode, Reducer, useContext, useReducer } from "react";

type Action = { type: 'connect' | 'connected' };
type Dispatch = (action: Action) => void;
type State = { address: string; isConnected: boolean; };
type WalletProviderProps = { children: ReactNode };

interface WalletContext {
  state: State;
  dispatch: Dispatch;
};


const wallet = new ArweaveWebWallet();
wallet.setUrl('arweave.app');

const WalletContext = createContext<WalletContext | undefined>(undefined);

const connectWallet = async (dispatch: Dispatch) => {
  await wallet?.connect();
  // console.log(await wallet.getPublicKey())
  dispatch({ type: 'connected' });
};

const signTx = async (tx: Transaction) => {
  await wallet.signTransaction(tx);
}

const walletReducer: Reducer<State, Action> = (state: State, action: Action) => {
  switch (action.type) {
    case 'connected': {
      return { address: wallet.address!, isConnected: true };
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

const WalletProvider = ({ children }: WalletProviderProps) => {
  
  const [ state, dispatch ] = useReducer(walletReducer, { address: '', isConnected: false });

  const value = { state, dispatch };

  return (
    <WalletContext.Provider value={value}>{ children }</WalletContext.Provider>
  )
}

const useWallet = () => {
  const context = useContext(WalletContext);
  
  if (context === null) {
    throw new Error('useWallet must be used within a WalletProvider')
  }

  return context;
}

export { WalletProvider, useWallet, connectWallet, signTx };