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

import Trade from '@/components/trade';
import { ReactNode, createContext, useCallback, useMemo, useState } from 'react';

export interface TradeContext {
  open: boolean;
  setOpenWithId: (assetId: string, open: boolean) => void;
  assetId: string;
}

export const TradeContext = createContext<TradeContext>({
  open: false,
  setOpenWithId: () => undefined,
  assetId: '',
});

export const TradeProvider = ({ children }: { children: ReactNode }) => {

  const [open, setOpen] = useState(false);
  const [ assetId, setAssetId ] = useState('');

  const setOpenWithId = useCallback((newAssetId: string, newOpenState: boolean) => {
    setAssetId(newAssetId);
    setOpen(newOpenState);
  }, [ setOpen, setAssetId ]);

  const value = useMemo(() => ({ open, setOpenWithId, assetId }), [open, setOpen, assetId]);

  return (
    <TradeContext.Provider value={value}>
      {children}
      <Trade open={open} setOpenWithId={setOpenWithId} assetId={assetId}/>
    </TradeContext.Provider>
  );
};
