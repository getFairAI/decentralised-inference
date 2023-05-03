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

import Layout from '@/components/layout';
import { BundlrProvider } from '@/context/bundlr';
import { WalletProvider } from '@/context/wallet';
import { Alert, Box, Container, CssBaseline, Typography } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { Fragment, useEffect, useState } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { AppThemeProvider } from '@/context/theme';
import { StyledMaterialDesignContent } from '@/styles/components';

const notFoundErrorCode = 404;
const notAuthorizedErrorCode = 401;

const ErrorDisplay = () => {
  const error = useRouteError();
  const [errorMessage, setErrorMessage] = useState(<></>);

  useEffect(() => {
    if (isRouteErrorResponse(error)) {
      if (error.status === notFoundErrorCode) {
        setErrorMessage(<Fragment>The requested page doesn&apos;t exist!</Fragment>);
      }

      if (error.status === notAuthorizedErrorCode) {
        setErrorMessage(<Fragment>You aren&apos;t authorized to see this</Fragment>);
      }
    } else {
      setErrorMessage(<Fragment>Something Went Wrong</Fragment>);
    }
  }, [error]);

  return (
    <>
      <AppThemeProvider>
        <SnackbarProvider
          maxSnack={3}
          Components={{
            error: StyledMaterialDesignContent,
            success: StyledMaterialDesignContent,
          }}
        >
          <WalletProvider>
            <BundlrProvider>
              <CssBaseline />
              <Layout>
                <Container
                  sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}
                  maxWidth={false}
                >
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Alert
                      severity='error'
                      variant='outlined'
                      icon={<ErrorOutlineIcon fontSize='large' />}
                      sx={{
                        width: '80%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <Typography align='center'>{errorMessage}</Typography>
                    </Alert>
                  </Box>
                </Container>
              </Layout>
            </BundlrProvider>
          </WalletProvider>
        </SnackbarProvider>
      </AppThemeProvider>
    </>
  );
};

export default ErrorDisplay;
