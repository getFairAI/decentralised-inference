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

import { EVMWalletContext } from '@/context/evm-wallet';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ReactElement, useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const WalletGuard = ({ children }: { children: ReactElement }) => {
  const { currentAddress, usdcBalance } = useContext(EVMWalletContext);
  const [canUseInference, setCanUseInference] = useState(true);
  const { localStorageValue: evmProvider } = useLocalStorage('evmProvider');

  useEffect(() => {
    if (!evmProvider && (!currentAddress || !usdcBalance)) {
      setCanUseInference(false);
    }
  }, [ evmProvider, currentAddress, usdcBalance]);

  if (canUseInference) {
    return children;
  } else if (currentAddress) {
    return <Navigate to={'/swap'} />;
  } else {
    return <Navigate to={'/sign-in'} />;
  }
};

export default WalletGuard;
