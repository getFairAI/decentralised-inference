import { WebBundlr } from "bundlr-custom";
import { createContext, Dispatch, ReactNode, Reducer, useReducer } from "react";

type BundlrAction = { type: 'requestConnect' } | { type: 'connected', bundlr: WebBundlr };

interface BundlrContext {
  state: WebBundlr;
  dispatch: Dispatch<BundlrAction>;
};

const BundlrContext = createContext<BundlrContext | undefined>(undefined);

const bundlrReducer: Reducer<WebBundlr, BundlrAction> = async (state: WebBundlr, action: BundlrAction) => {
  switch (action.type) {
    case 'connect':
      const 
    default:
      return;
  }
};

const BundlrProvider = ({ children }: { children: ReactNode}) => {
  
  const [ state, dispatch ] = useReducer(bundlrReducer, undefined);

  const value = { state, dispatch };

  return (
    <BundlrContext.Provider value={value}>{ children }</BundlrContext.Provider>
  )
}