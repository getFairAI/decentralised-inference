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

import { ApolloProvider } from '@apollo/client';
import {
  Alert,
  Backdrop,
  Button,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
} from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/layout';
import { WalletProvider } from './context/wallet';
import { client } from './utils/apollo';
import { AppThemeProvider } from './context/theme';
import { StyledMaterialDesignContent } from './styles/components';
import { useCallback, useEffect, useState } from 'react';
import { ChooseWalletProvider } from './context/choose-wallet';
import { SwapProvider } from './context/swap';
import { TradeProvider } from './context/trade';
import SignIn from './pages/sign-in';

const App = () => {
  const [ isFirstTime, setIsFirstTime ] = useState(true);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsFirstTime(localStorage.getItem('isFirstTime') === 'true');
  }, []);


  if (!isFirstTime) {
    return <WalletProvider>
      <ChooseWalletProvider>
        <SignIn />
      </ChooseWalletProvider>
    </WalletProvider>;
  } else {
    return (
      <WalletProvider>
        <ChooseWalletProvider>
          <SwapProvider>
            <TradeProvider>
              <Layout>
                <Outlet />
              </Layout>
            </TradeProvider>
          </SwapProvider>
        </ChooseWalletProvider>
      </WalletProvider>
    );
  }
};

export const Root = () => {
  return (
    <ApolloProvider client={client}>
      <AppThemeProvider>
        <SnackbarProvider
          maxSnack={3}
          Components={{
            error: StyledMaterialDesignContent,
            success: StyledMaterialDesignContent,
            info: StyledMaterialDesignContent,
          }}
        >
          <CssBaseline />
          <App />
        </SnackbarProvider>
      </AppThemeProvider>
    </ApolloProvider>
  );
};

export default Root;
