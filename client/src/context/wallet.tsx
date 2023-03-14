import { createContext, Dispatch, ReactNode, useEffect, useReducer } from 'react';
import { PermissionType } from 'arconnect';
import arweave from '@/utils/arweave';

const DEFAULT_PERMISSSIONS: PermissionType[] = [
  'ACCESS_PUBLIC_KEY',
  'SIGNATURE',
  'ACCESS_ADDRESS',
  'SIGN_TRANSACTION',
];
type WalletConnectedAction = { type: 'wallet_connected'; address: string };
type WalletBalanceUpdatedAction = { type: 'wallet_balance_updated'; balance: number };
type WalletPermissionsChangedAction = {
  type: 'wallet_permissions_changed';
  permissions: PermissionType[];
};
type WalletAction =
  | WalletConnectedAction
  | WalletBalanceUpdatedAction
  | WalletPermissionsChangedAction;

interface WalletContext {
  currentAddress: string;
  currentPermissions: PermissionType[];
  currentBalance: number;
  connectWallet: () => Promise<void>;
}

const createActions = (dispatch: Dispatch<WalletAction>) => {
  return {
    connectWallet: async () => asyncConnectWallet(dispatch),
    switchWallet: async (newAddress: string) => asyncWalletSwitch(dispatch, newAddress),
  };
};

const asyncConnectWallet = async (dispatch: Dispatch<WalletAction>) => {
  try {
    await window.arweaveWallet.connect(DEFAULT_PERMISSSIONS);
    const addr = await window.arweaveWallet.getActiveAddress();
    dispatch({ type: 'wallet_connected', address: addr });
    const winstonBalance = await arweave.wallets.getBalance(addr);
    dispatch({
      type: 'wallet_balance_updated',
      balance: parseFloat(arweave.ar.winstonToAr(winstonBalance)),
    });
  } catch (error) {
    console.log(error);
  }
};

const asyncWalletSwitch = async (dispatch: Dispatch<WalletAction>, newAddress: string) => {
  try {
    dispatch({ type: 'wallet_connected', address: newAddress });
    const winstonBalance = await arweave.wallets.getBalance(newAddress);
    dispatch({
      type: 'wallet_balance_updated',
      balance: parseFloat(arweave.ar.winstonToAr(winstonBalance)),
    });
  } catch (error) {
    console.log(error);
  }
};

const walletReducer = (state: WalletContext, action?: WalletAction) => {
  if (!action) return state;
  switch (action.type) {
    case 'wallet_connected':
      // eslint-disable-next-line no-case-declarations
      return { ...state, currentAddress: action.address };
    case 'wallet_balance_updated':
      return { ...state, currentBalance: action.balance };
    case 'wallet_permissions_changed':
      return { ...state, currentPermissions: action.permissions };
    default:
      return state;
  }
};

const initialState = {
  currentAddress: '',
  currentPermissions: [],
  currentBalance: 0,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  connectWallet: async () => {},
};

export const WalletContext = createContext<WalletContext>(initialState);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const actions = createActions(dispatch);

  const value = { ...state, connectWallet: actions.connectWallet };

  useEffect(() => {
    const walletSwitched = async (event: { detail: { address: string } }) => {
      if (event && event.detail && event.detail.address)
        await actions.switchWallet(event.detail.address);
      else await actions.connectWallet();
    };
    window.addEventListener('arweaveWalletLoaded', () => walletSwitched);
    window.addEventListener('walletSwitch', (e) => walletSwitched(e));

    return () => {
      window.removeEventListener('arweaveWalletLoaded', () => walletSwitched);
      window.removeEventListener('walletSwitch', (e) => walletSwitched(e));
    };
  }, []);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
