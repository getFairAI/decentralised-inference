// components/layout.js
import FilterContext from '@/context/filter';
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
} from '@mui/material';
import { ReactElement, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import Navbar from './navbar';
import { WalletContext } from '@/context/wallet';
import { BundlrContext } from '@/context/bundlr';
import { FundContext } from '@/context/fund';
import { ChooseWalletContext } from '@/context/choose-wallet';
import useWindowDimensions from '@/hooks/useWindowDimensions';

export default function Layout({ children }: { children: ReactElement }) {
  const [showBanner, setShowBanner] = useState(true);
  const [filterValue, setFilterValue] = useState('');
  const [headerHeight, setHeaderHeight] = useState('64px');
  const { currentAddress } = useContext(WalletContext);
  const { nodeBalance, isLoading } = useContext(BundlrContext);
  const [ignore, setIgnore] = useState(false);
  const theme = useTheme();
  const { setOpen: setFundOpen } = useContext(FundContext);
  const { open: chooseWalletOpen, setOpen: setChooseWalletOpen } = useContext(ChooseWalletContext);
  const { width, height } = useWindowDimensions();

  const showBundlrFunds = useMemo(
    () => (!isLoading && nodeBalance === 0 && !!currentAddress) || !currentAddress,
    [isLoading, nodeBalance, currentAddress],
  );
  const isOpen = useMemo(
    () => !chooseWalletOpen && !ignore && showBundlrFunds,
    [chooseWalletOpen, ignore, isLoading, nodeBalance, currentAddress],
  );

  const handleFundNow = () => {
    setIgnore(true);
    setFundOpen(true);
  };

  const getDialogTitle = () => {
    if (!currentAddress) return 'Wallet Not Connected';
    return 'Missing Bundlr Funds';
  };

  const getDialogContent = () => {
    if (!currentAddress)
      return 'Wallet Not Connected! App Functionalities will be limited, please consider connecting your wallet.';
    return 'You do not have enough Bundlr Funds to use this app. Please fund your Bundlr Node to continue.';
  };

  useEffect(() => {
    if (!localStorage.getItem('wallet')) {
      setChooseWalletOpen(true);
    }
  }, []);

  useLayoutEffect(() => {
    const currHeaderHeight = document.querySelector('header')?.clientHeight;
    if (currHeaderHeight) {
      setHeaderHeight(`${currHeaderHeight}px`);
    }
  }, [width, height]);

  return (
    <>
      <Navbar
        showBanner={showBanner}
        setShowBanner={setShowBanner}
        setFilterValue={setFilterValue}
      />
      <Container
        disableGutters
        sx={{
          width: '100%',
          height: `calc(100% - ${headerHeight})`,
          top: headerHeight,
          position: 'fixed',
        }}
        maxWidth={false}
      >
        <Box height='100%'>
          <FilterContext.Provider value={filterValue}>
            <main style={{ height: '100%' }}>{children}</main>
            <Dialog
              open={isOpen}
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
                    color: theme.palette.warning.light,
                    fontWeight: 700,
                    fontSize: '23px',
                    lineHeight: '31px',
                  }}
                >
                  {getDialogTitle()}
                </Typography>
              </DialogTitle>
              <DialogContent>
                <Alert
                  /* onClose={() => setOpen(false)} */
                  variant='outlined'
                  severity='warning'
                  sx={{
                    marginBottom: '16px',
                    borderRadius: '23px',
                    color: theme.palette.warning.light,
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
                  }}
                  icon={<img src='./warning-icon.svg'></img>}
                >
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: '30px',
                      lineHeight: '41px',
                      display: 'block',
                      textAlign: 'center',
                    }}
                  >
                    {getDialogContent()}
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
                {!currentAddress ? (
                  <Button
                    onClick={() => setIgnore(true)}
                    variant='contained'
                    color='warning'
                    sx={{ width: 'fit-content' }}
                  >
                    <Typography color={theme.palette.primary.contrastText}>I Understand</Typography>
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => setIgnore(true)}
                      variant='outlined'
                      color='warning'
                      sx={{ width: 'fit-content' }}
                    >
                      <Typography color={theme.palette.warning.main}>Fund Later</Typography>
                    </Button>
                    <Button
                      onClick={handleFundNow}
                      variant='contained'
                      color='warning'
                      sx={{ width: 'fit-content' }}
                    >
                      <Typography color={theme.palette.primary.contrastText}>Fund Now</Typography>
                    </Button>
                  </>
                )}
              </DialogActions>
            </Dialog>
          </FilterContext.Provider>
        </Box>
      </Container>
    </>
  );
}
