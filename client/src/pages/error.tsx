import Layout from '@/components/layout';
import { BundlrProvider } from '@/context/bundlr';
import { WalletProvider } from '@/context/wallet';
import { Alert, Box, Container, CssBaseline, Typography } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { Fragment, useEffect, useState } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { AppThemeProvider } from '@/context/theme';

const Error = () => {
  const error = useRouteError();
  const [errorMessage, setErrorMessage] = useState(<></>);

  useEffect(() => {
    if (isRouteErrorResponse(error)) {
      if (error.status === 404) {
        setErrorMessage(<Fragment>The requested page doesn&apos;t exist!</Fragment>);
      }

      if (error.status === 401) {
        setErrorMessage(<Fragment>You aren&apos;t authorized to see this</Fragment>);
      }
    } else {
      setErrorMessage(<Fragment>Something Went Wrong</Fragment>);
    }
  }, [error]);

  return (
    <>
      <AppThemeProvider>
        <SnackbarProvider maxSnack={3}>
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

export default Error;
