import { WebBundlr } from 'bundlr-custom';
import { createContext, Dispatch, ReactNode, useContext, useEffect, useMemo, useReducer } from 'react';
import { DEV_BUNDLR_URL, NODE1_BUNDLR_URL, NODE2_BUNDLR_URL } from '@/constants';
import { WalletContext } from './wallet';

export type bundlrNodeUrl =
  | typeof DEV_BUNDLR_URL
  | typeof NODE1_BUNDLR_URL
  | typeof NODE2_BUNDLR_URL;
type BundlrChangeNodeAction = { type: 'node_changed'; bundlr: WebBundlr };

type BundlrGetBalanceAction = { type: 'get_balance' };
type BundlrAction = BundlrChangeNodeAction | BundlrGetBalanceAction;

interface BundlrContext {
  state?: WebBundlr;
  actions: {
    changeNode: (value: bundlrNodeUrl) => Promise<void>;
  };
  retryConnection: () => Promise<void>;
}

const createActions = (dispatch: Dispatch<BundlrAction>) => {
  return {
    changeNode: async (value: bundlrNodeUrl) => asyncChangeNode(dispatch, value as bundlrNodeUrl),
  };
};

const asyncChangeNode = async (dispatch: Dispatch<BundlrAction>, node: bundlrNodeUrl) => {
  const bundlr = new WebBundlr(node, 'arweave', window.arweaveWallet);
  try {
    await bundlr.ready();
  } catch (error) {
    console.log(error);
  }
  dispatch({ type: 'node_changed', bundlr });
};

const bundlrReducer = (state?: WebBundlr, action?: BundlrAction) => {
  if (!action) return state;
  switch (action.type) {
    case 'node_changed':
      // eslint-disable-next-line no-case-declarations
      return action.bundlr;
    default:
      return state;
  }
};

export const BundlrContext = createContext<BundlrContext | undefined>(undefined);

export const BundlrProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(bundlrReducer, undefined);
  const actions = createActions(dispatch);

  const walletState = useContext(WalletContext);

  useEffect(() => {
    const addressChanged = async () => {
      await actions.changeNode(NODE1_BUNDLR_URL);
    };
    addressChanged();
  }, [walletState.currentAddress]);

  const retryConnection = async () => await state?.ready();

  const value = useMemo(() => ({ state, actions, retryConnection }), []);

  return (
    <BundlrContext.Provider value={value}>
      {children}
    </BundlrContext.Provider>
  );
};
