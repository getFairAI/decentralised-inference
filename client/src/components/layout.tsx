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
import { ReactElement, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Navbar from './navbar';
import { WalletContext } from '@/context/wallet';
import { ChooseWalletContext } from '@/context/choose-wallet';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import useScroll from '@/hooks/useScroll';

export default function Layout({ children }: { children: ReactElement }) {
  const [filterValue, setFilterValue] = useState('');
  const [headerHeight, setHeaderHeight] = useState('64px');
  const scrollableRef = useRef<HTMLDivElement>(null);
  const { currentAddress } = useContext(WalletContext);
  const [ignore, setIgnore] = useState(false);
  const theme = useTheme();
  const { open: chooseWalletOpen, setOpen: setChooseWalletOpen } = useContext(ChooseWalletContext);
  const { width, height } = useWindowDimensions();
  const { isScrolled } = useScroll(scrollableRef);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('wallet')) {
      setChooseWalletOpen(true);
    }
    if (localStorage.getItem('ignoreWalletNotConnected')) {
      setIgnore(true);
    }
  }, []);

  useEffect(
    () => setIsOpen(!chooseWalletOpen && !ignore && !currentAddress),
    [chooseWalletOpen, ignore, currentAddress],
  ); // set ignore to false when user changes wallet

  useLayoutEffect(() => {
    const currHeaderHeight = document.querySelector('header')?.clientHeight;
    if (currHeaderHeight) {
      setHeaderHeight(`${currHeaderHeight}px`);
    }
  }, [width, height]);

  const handleIgnore = useCallback(() => {
    localStorage.setItem('ignoreWalletNotConnected', 'true');
    setIgnore(true);
  }, [setIgnore]);

  return (
    <>
      <Navbar
        setFilterValue={setFilterValue}
        isScrolled={isScrolled}
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
            <main style={{ height: '100%' }} ref={scrollableRef}>{children}</main>
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
                  {'Wallet Not Connected'}
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
                    {
                      'Wallet Not Connected! App Functionalities will be limited, please consider connecting your wallet.'
                    }
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
                  onClick={handleIgnore}
                  variant='contained'
                  color='warning'
                  sx={{ width: 'fit-content' }}
                >
                  <Typography color={theme.palette.primary.contrastText}>I Understand</Typography>
                </Button>
              </DialogActions>
            </Dialog>
          </FilterContext.Provider>
        </Box>
      </Container>
    </>
  );
}
