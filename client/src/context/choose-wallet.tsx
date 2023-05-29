import ChooseWallet from '@/components/choose-wallet';
import { Dispatch, ReactNode, SetStateAction, createContext, useState } from 'react';

export interface ChooseWalletContext {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export const ChooseWalletContext = createContext<ChooseWalletContext>({
  open: false,
  setOpen: () => undefined,
});

export const ChooseWalletProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <ChooseWalletContext.Provider value={{ open, setOpen }}>
      {children}
      <ChooseWallet open={open} setOpen={setOpen} />
    </ChooseWalletContext.Provider>
  );
};
