import { createContext, Dispatch, ReactNode, useEffect, useMemo, useReducer, useRef } from 'react';
import { PermissionType } from 'arconnect';
import arweave from '@/utils/arweave';
import _ from 'lodash';
import { isVouched } from '@/utils/vouch';
import { ArweaveWebWallet } from 'arweave-wallet-connector';

const wallet = new ArweaveWebWallet({
  // optionally provide information about your app that will be displayed in the wallet provider interface
  name: 'Fair Protocol',
  logo: 'https://7kekrsiqzdrmjh222sx5xohduoemsoosicy33nqic4q5rbdcqybq.arweave.net/-oioyRDI4sSfWtSv27jjo4jJOdJAsb22CBch2IRihgM',
});

wallet.setUrl('arweave.app');

const DEFAULT_PERMISSSIONS: PermissionType[] = [
  'ACCESS_PUBLIC_KEY',
  'SIGNATURE',
  'ACCESS_ADDRESS',
  'ACCESS_ALL_ADDRESSES',
  'SIGN_TRANSACTION',
  'DISPATCH',
];
type ArConnectAvailableAction = { type: 'arconnect_available' };
type WalletDisconnectAction = { type: 'wallet_disconnect' };
type WalletConnectedAction = {
  type: 'wallet_connected';
  wallet: typeof wallet.namespaces.arweaveWallet | typeof window.arweaveWallet;
};
type WalletAddressUpdatedAction = { type: 'wallet_address_updated'; address: string };
type WalletBalanceUpdatedAction = { type: 'wallet_balance_updated'; balance: number };
type WalletPermissionsChangedAction = {
  type: 'wallet_permissions_changed';
  permissions: PermissionType[];
};
type WalletVouchedAction = { type: 'wallet_vouched'; isWalletVouched: boolean };
type WalletAction =
  | ArConnectAvailableAction
  | WalletConnectedAction
  | WalletDisconnectAction
  | WalletAddressUpdatedAction
  | WalletBalanceUpdatedAction
  | WalletPermissionsChangedAction
  | WalletVouchedAction;

interface WalletContext {
  isArConnectAvailable: boolean;
  walletInstance: typeof wallet.namespaces.arweaveWallet | typeof window.arweaveWallet;
  currentAddress: string;
  currentPermissions: PermissionType[];
  currentBalance: number;
  isWalletVouched: boolean;
  connectWallet: (wallet: 'arweave.app' | 'arconnect') => Promise<void>;
  updateBalance: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

const createActions = (dispatch: Dispatch<WalletAction>, state: WalletContext) => {
  return {
    arConnectAvailable: async () => dispatch({ type: 'arconnect_available' }),
    walletDisconnect: async () => asyncDisconnectWallet(dispatch, state.walletInstance),
    arConnect: async () => asyncArConnectWallet(dispatch),
    arweaveAppConnect: async () => asyncArweaveAppConnect(dispatch),
    switchWallet: async (newAddress: string) => asyncWalletSwitch(dispatch, newAddress),
    updateBalance: async () => asyncUpdateBalance(dispatch, state.currentAddress),
  };
};

const asyncArConnectWallet = async (dispatch: Dispatch<WalletAction>) => {
  try {
    if (wallet.connected) {
      await wallet.disconnect();
    }
    const currentPermissions = await window.arweaveWallet.getPermissions();
    if (!_.isEqual(currentPermissions, DEFAULT_PERMISSSIONS)) {
      await window.arweaveWallet.connect(DEFAULT_PERMISSSIONS);
      dispatch({ type: 'wallet_connected', wallet: window.arweaveWallet });
    }
    localStorage.setItem('wallet', 'arconnect');
    const addr = await window.arweaveWallet.getActiveAddress();
    dispatch({ type: 'wallet_address_updated', address: addr });
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

const asyncArweaveAppConnect = async (dispatch: Dispatch<WalletAction>) => {
  try {
    await wallet.connect();
    localStorage.setItem('wallet', 'arweave.app');
    const walletInstance = wallet.namespaces.arweaveWallet;
    dispatch({ type: 'wallet_connected', wallet: walletInstance });
    const addr = (await walletInstance.getActiveAddress()) as string;
    dispatch({ type: 'wallet_address_updated', address: addr });
    const winstonBalance = await arweave.wallets.getBalance(addr);
    dispatch({
      type: 'wallet_balance_updated',
      balance: parseFloat(arweave.ar.winstonToAr(winstonBalance)),
    });
    const isAddrVouched = await isVouched(addr);
    dispatch({ type: 'wallet_vouched', isWalletVouched: isAddrVouched });
  } catch (error) {
    /* // manually remove arconnect overlay
    const overlays: NodeListOf<HTMLDivElement> = document.querySelectorAll(
      '.arconnect_connect_overlay_extension_temporary',
    );
    overlays.forEach((el) => el.remove()); */
    console.log(error);
  }
};

const asyncDisconnectWallet = async (
  dispatch: Dispatch<WalletAction>,
  walletInstance: typeof wallet.namespaces.arweaveWallet | typeof window.arweaveWallet,
) => {
  try {
    await walletInstance.disconnect();
    dispatch({ type: 'wallet_disconnect' });
    localStorage.removeItem('wallet');
  } catch (err) {
    console.log(err);
  }
};

const asyncWalletSwitch = async (dispatch: Dispatch<WalletAction>, newAddress: string) => {
  try {
    dispatch({ type: 'wallet_address_updated', address: newAddress });
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
    case 'wallet_connected':
      return { ...state, walletInstance: action.wallet };
    case 'arconnect_available':
      return { ...state, isArConnectAvailable: true };
    case 'wallet_address_updated':
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
        isWalletVouched: false,
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
  isArConnectAvailable: false,
  currentAddress: '',
  currentPermissions: [],
  currentBalance: 0,
  isWalletVouched: false,
  walletInstance: wallet.namespaces.arweaveWallet,
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

  const value: WalletContext = useMemo(
    () => ({
      ...state,
      connectWallet: (wallet: 'arweave.app' | 'arconnect') =>
        wallet === 'arconnect' ? actions.arConnect() : actions.arweaveAppConnect(),
      updateBalance: actions.updateBalance,
      disconnectWallet: actions.walletDisconnect,
    }),
    [state, actions],
  );

  const walletSwitched = async (event: { detail: { address: string } }) => {
    if (localStorage.getItem('wallet') === 'arconnect') {
      await actions.switchWallet(event.detail.address);
    }
  };

  const arConnectLoaded = async () => {
    await actions.arConnectAvailable();
    // if default wallet is arconnect, connect to it automatically
    if (localStorage.getItem('wallet') === 'arconnect') {
      await actions.arConnect();
    }
  };

  useEffect(() => {
    if (!window.arweaveWallet) {
      // only subscribe walletLoaded if arweave wallet does not exist
      // only subscribe if not subscribed already
      if (!connectWalletSubscriptionRef.current) {
        window.addEventListener('arweaveWalletLoaded', () => {
          arConnectLoaded();
        });
        connectWalletSubscriptionRef.current = true;
      }
    }

    if (!switchWalletSubscriptionRef.current) {
      window.addEventListener('walletSwitch', (event: { detail: { address: string } }) => {
        (async () => walletSwitched(event))();
      });
      switchWalletSubscriptionRef.current = true;
    }

    return () => {
      if (connectWalletSubscriptionRef.current) {
        window.removeEventListener('arweaveWalletLoaded', () => {
          (async () => arConnectLoaded())();
        });
        connectWalletSubscriptionRef.current = false;
      }
      if (switchWalletSubscriptionRef.current) {
        window.removeEventListener('walletSwitch', (event: { detail: { address: string } }) => {
          (async () => walletSwitched(event))();
        });
        switchWalletSubscriptionRef.current = false;
      }
    };
  }, [window.arweaveWallet]);

  const arweaveAppWalletSwitched = async (event: string | undefined) => {
    if (event) {
      await actions.switchWallet(event);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('wallet') === 'arweave.app') {
      (async () => {
        await actions.arweaveAppConnect();
      })();
      wallet.on('change', arweaveAppWalletSwitched);
    }
    return () => {
      wallet.off('change', arweaveAppWalletSwitched);
    };
  }, []);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
