import { ApolloProvider } from '@apollo/client';
import { CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { Outlet } from 'react-router-dom';
import Layout from './components/layout';
import { BundlrProvider } from './context/bundlr';
import { WalletProvider } from './context/wallet';
import { client } from './utils/apollo';
import { AppThemeProvider } from './context/theme';

export const Root = () => {
  return (
    <ApolloProvider client={client}>
      <AppThemeProvider>
        <SnackbarProvider maxSnack={3}>
          <WalletProvider>
            <BundlrProvider>
              <CssBaseline />
              <Layout>
                <Outlet />
              </Layout>
            </BundlrProvider>
          </WalletProvider>
        </SnackbarProvider>
      </AppThemeProvider>
    </ApolloProvider>
  );
};

export default Root;
