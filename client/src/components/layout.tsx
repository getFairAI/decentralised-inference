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
import { Box, Container, IconButton, Typography, useTheme } from '@mui/material';
import {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import Navbar from './navbar';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import useScroll from '@/hooks/useScroll';
import { WalletContext } from '@/context/wallet';
import { Link, useLocation } from 'react-router-dom';
import useComponentDimensions from '@/hooks/useComponentDimensions';
import { MIN_U_BALANCE } from '@/constants';
import CloseIcon from '@mui/icons-material/Close';

const WarningMessage = () => {
  const [showWarning, setShowWarning] = useState(false);
  const { currentAddress, currentUBalance } = useContext(WalletContext);
  const theme = useTheme();

  const handleClose = useCallback(() => {
    setShowWarning(false);
    localStorage.setItem('warningClosed', 'true');
  }, [setShowWarning]);

  useEffect(() => setShowWarning(localStorage.getItem('warningClosed') !== 'true'), []);

  if (!localStorage.getItem('wallet') && !currentAddress) {
    return (
      <>
        <Typography padding={'4px 32px'} sx={{ background: theme.palette.warning.main }}>
          Wallet Not Connected, some functionalities will not be available.{' '}
          <Link to={'/sign-in'} className='plausible-event-name=Onboarding+Click'>
            <u>Start Onboarding</u>
          </Link>
        </Typography>
      </>
    );
  } else if (showWarning && currentAddress && currentUBalance < MIN_U_BALANCE) {
    return (
      <Box
        sx={{
          background: theme.palette.warning.main,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        padding={'2px 16px 2px 32px'}
      >
        <Typography>
          Looks Like you are running low on $U balance,{' '}
          <Link to={'/swap'} className='plausible-event-name=Top+Up+Click'>
            <u>Click here to Top Up</u>
          </Link>
        </Typography>
        <IconButton
          sx={{
            border: 'none',
            padding: '2px',
          }}
          size='medium'
          onClick={handleClose}
          className='plausible-event-name=Top+Up+Warning+Close'
        >
          <CloseIcon fontSize='inherit' />
        </IconButton>
      </Box>
    );
  } else {
    return <></>;
  }
};

export default function Layout({ children }: { children: ReactElement }) {
  const [filterValue, setFilterValue] = useState('');
  const [headerHeight, setHeaderHeight] = useState('64px');
  const scrollableRef = useRef<HTMLDivElement>(null);
  const { width, height } = useWindowDimensions();
  const { isScrolled } = useScroll(scrollableRef);
  const { pathname } = useLocation();
  const warningRef = useRef<HTMLDivElement>(null);
  const { height: warningHeight } = useComponentDimensions(warningRef);

  useLayoutEffect(() => {
    const currHeaderHeight = document.querySelector('header')?.clientHeight;
    if (currHeaderHeight) {
      setHeaderHeight(`${currHeaderHeight}px`);
    }
  }, [width, height]);

  if (pathname === '/sign-in' || pathname === '/swap') {
    return children;
  }

  return (
    <>
      <Navbar setFilterValue={setFilterValue} isScrolled={isScrolled} />
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
        <Box height={`calc(100% - ${warningHeight}px)`}>
          <FilterContext.Provider value={filterValue}>
            {pathname !== '/terms' && (
              <Box ref={warningRef}>
                <WarningMessage />
              </Box>
            )}
            <main style={{ height: '100%' }} ref={scrollableRef}>
              {children}
            </main>
          </FilterContext.Provider>
        </Box>
      </Container>
    </>
  );
}
