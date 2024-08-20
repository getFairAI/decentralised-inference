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

import { Box, Container, IconButton, Typography, useTheme } from '@mui/material';
import {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Navbar from './navbar';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import useScroll from '@/hooks/useScroll';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useComponentDimensions from '@/hooks/useComponentDimensions';
import { MIN_U_BALANCE } from '@/constants';
import { EVMWalletContext } from '@/context/evm-wallet';
import { StyledMuiButton } from '@/styles/components';
import { motion } from 'framer-motion';

// icons
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import usePrevious from '@/hooks/usePrevious';

const WarningMessage = ({ smallScreen }: { smallScreen: boolean }) => {
  const [showWarning, setShowWarning] = useState(false);
  const { currentAddress, usdcBalance } = useContext(EVMWalletContext);
  const theme = useTheme();
  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    setShowWarning(false);
    localStorage.setItem('warningClosed', 'true');
  }, [setShowWarning]);

  useEffect(() => setShowWarning(localStorage.getItem('warningClosed') !== 'true'), []);

  const handleSignIn = useCallback(() => navigate('sign-in'), [navigate]);

  if (!localStorage.getItem('evmProvider') && !currentAddress) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0, minHeight: 0 }}
        animate={{
          opacity: 1,
          height: 'fit-content',
          minHeight: '40px',
          width: '100%',
          maxWidth: !smallScreen ? '1200px' : '100%',
          marginTop: !smallScreen ? '30px' : '0px',
          padding: !smallScreen ? '20px' : '10px',
          borderRadius: !smallScreen ? '20px' : '0px',
          background: 'linear-gradient(200deg, #bfe3e0, #a9c9d4)',
          color: '#003030',
          transition: { duration: 0 },
        }}
        className='w-full flex flex-wrap justify-center xl:justify-between items-center gap-3 shadow-sm font-medium overflow-hidden text-xs md:text-base'
      >
        <span className='px-2 flex flex-nowrap gap-3 items-center'>
          <ErrorRoundedIcon
            style={{
              width: '24px',
            }}
          />
          You don&apos;t seem to have a wallet connected. Connect a wallet to experience all FairAI
          features and benefits.
        </span>

        <StyledMuiButton
          style={{
            display: 'flex',
            gap: '5px',
            alignItems: 'center',
          }}
          className='plausible-event-name=Onboarding+Click primary'
          onClick={handleSignIn}
        >
          <OpenInNewRoundedIcon style={{ width: '20px', marginRight: '4px' }} />
          Connect a wallet or learn more
        </StyledMuiButton>
      </motion.div>
    );
  } else if (showWarning && currentAddress && usdcBalance < MIN_U_BALANCE) {
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
          Looks Like you are running low on your USDC balance,{' '}
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
  const [headerHeight, setHeaderHeight] = useState('64px');
  const { width, height } = useWindowDimensions();
  const scrollableRef = useRef<HTMLDivElement>(null);
  const { scrollTop: currentScrollAmount } = useScroll(scrollableRef);
  const { pathname } = useLocation();
  const warningRef = useRef<HTMLDivElement>(null);
  const { height: warningHeight } = useComponentDimensions(warningRef);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const theme = useTheme();

  useLayoutEffect(() => {
    const currHeaderHeight = document.querySelector('header')?.clientHeight;
    if (currHeaderHeight) {
      setHeaderHeight(`${currHeaderHeight}px`);
    }
  }, [width, height]);

  useEffect(() => {
    const md = theme.breakpoints.values.md;
    setIsSmallScreen(width < md);
  }, [width, theme, setIsSmallScreen]);

  const oldScrollValue = usePrevious(currentScrollAmount);
  const userScrolledDown = useMemo(() => {
    if (currentScrollAmount > (oldScrollValue ?? 0)) return true;
    else return false;
  }, [currentScrollAmount, oldScrollValue]);

  if (pathname === '/sign-in' || pathname === '/swap') {
    return children;
  }

  return (
    <>
      <Container
        disableGutters
        sx={{
          width: '100%',
          height: !userScrolledDown && !isSmallScreen ? `calc(100% - ${headerHeight})` : '100%',
          top: userScrolledDown && isSmallScreen ? 0 : headerHeight,
          position: 'fixed',
          transition: 'all 0.2s',
        }}
        maxWidth={false}
      >
        <Box
          height={!userScrolledDown && !isSmallScreen ? `calc(100% - ${warningHeight}px)` : '100%'}
        >
          {pathname !== '/terms' && pathname !== '/request' && pathname !== '/browse' && (
            <Box
              ref={warningRef}
              id={'warning-box'}
              sx={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {(!isSmallScreen || (!userScrolledDown && isSmallScreen)) && (
                <WarningMessage smallScreen={isSmallScreen} />
              )}
            </Box>
          )}
          <main style={{ height: '100%' }} ref={scrollableRef} id='main'>
            {children}
          </main>
        </Box>
      </Container>
      <Navbar userScrolledDown={isSmallScreen && userScrolledDown} />
    </>
  );
}
