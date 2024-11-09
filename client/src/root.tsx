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
import { CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { Outlet, useLocation } from 'react-router-dom';
import Layout from './components/layout';
import { client } from './utils/apollo';
import { AppThemeProvider } from './context/theme';
import { StyledMaterialDesignContent } from './styles/components';
import { ReactElement } from 'react';
import { ChooseWalletProvider } from './context/choose-wallet';
import { TradeProvider } from './context/trade';
import { UserFeedbackProvider } from './context/user-feedback';
import { EVMWalletProvider } from './context/evm-wallet';
import { ThrowawayProvider } from './context/throwaway';
import { OpfsProvider } from './context/opfs';

const BaseRoot = ({ children }: { children: ReactElement }) => {
  return (
    <OpfsProvider>
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
            <EVMWalletProvider>
              <ChooseWalletProvider>
                <UserFeedbackProvider>
                  <TradeProvider>
                    <ThrowawayProvider>{children}</ThrowawayProvider>
                  </TradeProvider>
                </UserFeedbackProvider>
              </ChooseWalletProvider>
            </EVMWalletProvider>
          </SnackbarProvider>
        </AppThemeProvider>
      </ApolloProvider>
    </OpfsProvider>
  );
};

export const Root = () => {
  const { pathname } = useLocation();

  if (pathname === '/request') {
    return (
      <BaseRoot>
        <Outlet />
      </BaseRoot>
    );
  }

  return (
    <BaseRoot>
      <Layout>
        <Outlet />
      </Layout>
    </BaseRoot>
  );
};
