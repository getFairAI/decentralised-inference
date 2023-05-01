import { createContext, Dispatch, ReactNode, useEffect, useMemo, useReducer, useRef } from 'react';
import { PermissionType } from 'arconnect';
import arweave from '@/utils/arweave';
import _ from 'lodash';
import { isVouched } from 'vouchdao';

const DEFAULT_PERMISSSIONS: PermissionType[] = [
  'ACCESS_PUBLIC_KEY',
  'SIGNATURE',
  'ACCESS_ADDRESS',
  'ACCESS_ALL_ADDRESSES',
  'SIGN_TRANSACTION',
  'DISPATCH',
];
type WalletLoadedAction = { type: 'wallet_loaded' };
type WalletDisconnectAction = { type: 'wallet_disconnect' };
type WalletConnectedAction = { type: 'wallet_connected'; address: string };
type WalletBalanceUpdatedAction = { type: 'wallet_balance_updated'; balance: number };
type WalletPermissionsChangedAction = {
  type: 'wallet_permissions_changed';
  permissions: PermissionType[];
};
type WalletVouchedAction = { type: 'wallet_vouched'; isWalletVouched: boolean };
type WalletAction =
  | WalletLoadedAction
  | WalletConnectedAction
  | WalletDisconnectAction
  | WalletBalanceUpdatedAction
  | WalletPermissionsChangedAction
  | WalletVouchedAction;

interface WalletContext {
  isWalletLoaded: boolean;
  currentAddress: string;
  currentPermissions: PermissionType[];
  currentBalance: number;
  isWalletVouched: boolean;
  connectWallet: () => Promise<void>;
  updateBalance: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

const createActions = (dispatch: Dispatch<WalletAction>, state: WalletContext) => {
  return {
    walletLoaded: async () => dispatch({ type: 'wallet_loaded' }),
    walletDisconnect: async () => asyncDisconnectWallet(dispatch),
    connectWallet: async () => asyncConnectWallet(dispatch),
    switchWallet: async (newAddress: string) => asyncWalletSwitch(dispatch, newAddress),
    updateBalance: async () => asyncUpdateBalance(dispatch, state.currentAddress),
  };
};

const asyncConnectWallet = async (dispatch: Dispatch<WalletAction>) => {
  try {
    const currentPermissions = await window.arweaveWallet.getPermissions();
    if (!_.isEqual(currentPermissions, DEFAULT_PERMISSSIONS)) {
      await window.arweaveWallet.connect(DEFAULT_PERMISSSIONS);
    }
    const addr = await window.arweaveWallet.getActiveAddress();
    dispatch({ type: 'wallet_connected', address: addr });
    const winstonBalance = await arweave.wallets.getBalance(addr);
    dispatch({
      type: 'wallet_balance_updated',
      balance: parseFloat(arweave.ar.winstonToAr(winstonBalance)),
    });
    const isAddrVouched = await isVouched(addr);
    dispatch({ type: 'wallet_vouched', isWalletVouched: isAddrVouched });
  } catch (error) {
    // manually remove arconnect overlay
    const overlays: NodeListOf<HTMLDivElement> = document.querySelectorAll(
      '.arconnect_connect_overlay_extension_temporary',
    );
    overlays.forEach((el) => el.remove());
  }
};

const asyncDisconnectWallet = async (dispatch: Dispatch<WalletAction>) => {
  try {
    await window.arweaveWallet.disconnect();
    dispatch({ type: 'wallet_disconnect' });
  } catch (err) {
    console.log(err);
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
    const isAddrVouched = await isVouched(newAddress);
    dispatch({ type: 'wallet_vouched', isWalletVouched: isAddrVouched });
  } catch (error) {
    console.log(error);
  }
};

const asyncUpdateBalance = async (dispatch: Dispatch<WalletAction>, addr: string) => {
  try {
    const winstonBalance = await arweave.wallets.getBalance(addr);
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
    case 'wallet_loaded':
      return { ...state, isWalletLoaded: true };
    case 'wallet_connected':
      // eslint-disable-next-line no-case-declarations
      return { ...state, currentAddress: action.address };
    case 'wallet_balance_updated':
      return { ...state, currentBalance: action.balance };
    case 'wallet_permissions_changed':
      return { ...state, currentPermissions: action.permissions };
    case 'wallet_disconnect': {
      return {
        ...state,
        currentAddress: '',
        currentPermissions: [],
        currentBalance: 0,
      };
    }
    case 'wallet_vouched': {
      return {
        ...state,
        isWalletVouched: action.isWalletVouched,
      };
    }
    default:
      return state;
  }
};

const initialState: WalletContext = {
  isWalletLoaded: false,
  currentAddress: '',
  currentPermissions: [],
  currentBalance: 0,
  isWalletVouched: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  connectWallet: async () => {}, 
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateBalance: async () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnectWallet: async () => {},
};

export const WalletContext = createContext<WalletContext>(initialState);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const actions = createActions(dispatch, state);

  const connectWalletSubscriptionRef = useRef<boolean>(false);
  const switchWalletSubscriptionRef = useRef<boolean>(false);

  const value: WalletContext = useMemo(() => ({
    ...state,
    connectWallet: actions.connectWallet,
    updateBalance: actions.updateBalance,
    disconnectWallet: actions.walletDisconnect,
  }), [state, actions]);

  const walletLoaded = async () => {
    await actions.walletLoaded();
    await actions.connectWallet();
  };

  const walletSwitched = async (event: { detail: { address: string } }) => {
    await actions.switchWallet(event.detail.address);
  };

  useEffect(() => {
    if (!window.arweaveWallet) {
      // only subscribe walletLoaded if arweave wallet does not exist
      // only subscribe if not subscribed already
      if (!connectWalletSubscriptionRef.current) {
        window.addEventListener('arweaveWalletLoaded', walletLoaded);
        connectWalletSubscriptionRef.current = true;
      }
    } else {
      walletLoaded();
    }
    if (!switchWalletSubscriptionRef.current) {
      window.addEventListener('walletSwitch', walletSwitched);
      switchWalletSubscriptionRef.current = true;
    }

    return () => {
      if (connectWalletSubscriptionRef.current) {
        window.removeEventListener('arweaveWalletLoaded', walletLoaded);
        connectWalletSubscriptionRef.current = false;
      }
      if (switchWalletSubscriptionRef.current) {
        window.removeEventListener('walletSwitch', walletSwitched);
        switchWalletSubscriptionRef.current = false;
      }
    };
  }, [window.arweaveWallet]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
