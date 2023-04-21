import FundDialog from '@/components/fund-dialog';
import { Dispatch, ReactNode, SetStateAction, createContext, useState } from 'react';

export interface FundContext {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export const FundContext = createContext<FundContext>({
  open: false,
  setOpen: () => undefined,
});

export const FundProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <FundContext.Provider value={{ open, setOpen }}>
      {children}
      <FundDialog open={open} setOpen={setOpen} />
    </FundContext.Provider>
  );
};
