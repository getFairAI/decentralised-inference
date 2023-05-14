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
import { Outlet } from 'react-router-dom';
import Layout from './components/layout';
import { BundlrProvider } from './context/bundlr';
import { WalletProvider } from './context/wallet';
import { client } from './utils/apollo';
import { AppThemeProvider } from './context/theme';
import { WorkerProvider } from './context/worker';
import { FundProvider } from './context/fund';
import { StyledMaterialDesignContent } from './styles/components';
import { useCallback, useEffect, useState } from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const App = () => {
  const [hasAgreed, setHasAgreed] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const hasAgreed = localStorage.getItem('hasAgreed');
    setHasAgreed(hasAgreed === 'true');
  }, []);

  const handleAgree = useCallback(() => {
    localStorage.setItem('hasAgreed', 'true');
    setHasAgreed(true);
  }, [setHasAgreed]);

  if (!hasAgreed) {
    return (
      <Backdrop open={true} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Dialog
          open={true}
          maxWidth={'md'}
          fullWidth
          sx={{
            '& .MuiPaper-root': {
              background:
                theme.palette.mode === 'dark'
                  ? 'rgba(61, 61, 61, 0.9)'
                  : theme.palette.background.default,
              borderRadius: '30px',
            },
          }}
        >
          <DialogTitle>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '23px',
                lineHeight: '31px',
                color: theme.palette.primary.main,
              }}
            >
              {'Terms And Conditions'}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Alert
              /* onClose={() => setOpen(false)} */
              variant='outlined'
              severity='info'
              sx={{
                marginBottom: '16px',
                borderRadius: '23px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
                '& .MuiAlert-icon': {
                  justifyContent: 'center',
                },
                '& .MuiAlert-message': {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                },
                color: theme.palette.primary.main,
              }}
              icon={<InfoOutlinedIcon fontSize='large' color='primary' />}
            >
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: '30px',
                  lineHeight: '41px',
                  display: 'block',
                  textAlign: 'justify',
                }}
              >
                All the communication between participants in this network is done through Arweave.
                When anything is written on Arweave, it&apos;s publicly stored forever due to the
                particularities of that blockchain. As such, kindly exercise caution when inserting
                any information on this website.
              </Typography>
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: '30px',
                  lineHeight: '41px',
                  display: 'block',
                  textAlign: 'justify',
                }}
              >
                By using this app, you acknowledge and accept these terms and conditions.
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: '30px',
              paddingBottom: '20px',
            }}
          >
            <Button
              onClick={handleAgree}
              variant='contained'
              color='primary'
              sx={{ width: 'fit-content' }}
            >
              <Typography color={theme.palette.primary.contrastText}>I Accept</Typography>
            </Button>
          </DialogActions>
        </Dialog>
      </Backdrop>
    );
  } else {
    return (
      <Layout>
        <Outlet />
      </Layout>
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
          <WalletProvider>
            <BundlrProvider>
              <WorkerProvider>
                <FundProvider>
                  <CssBaseline />
                  <App />
                </FundProvider>
              </WorkerProvider>
            </BundlrProvider>
          </WalletProvider>
        </SnackbarProvider>
      </AppThemeProvider>
    </ApolloProvider>
  );
};

export default Root;
