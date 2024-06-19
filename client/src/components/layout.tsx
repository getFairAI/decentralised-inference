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

const WarningMessage = ({ isScrolled }: { isScrolled: boolean }) => {
  const [showWarning, setShowWarning] = useState(false);
  const { currentAddress, usdcBalance } = useContext(EVMWalletContext);
  const theme = useTheme();
  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    setShowWarning(false);
    localStorage.setItem('warningClosed', 'true');
  }, [setShowWarning]);

  useEffect(() => setShowWarning(localStorage.getItem('warningClosed') !== 'true'), []);

  if (!localStorage.getItem('evmProvider') && !currentAddress) {
    return (
      <>
        {!isScrolled && (
          <motion.div
            initial={{ opacity: 0, height: 0, minHeight: 0 }}
            animate={{
              opacity: 1,
              height: 'fit-content',
              minHeight: '80px',
              transition: { duration: 0.4, type: 'smooth' },
            }}
            className='w-fit flex flex-wrap p-4 mx-2 justify-center items-center gap-3 rounded-[30px] bg-slate-500 font-semibold text-white overflow-hidden text-md'
          >
            <span className='px-2 flex flex-nowrap gap-3 items-center'>
              <ErrorRoundedIcon
                style={{
                  width: isScrolled ? '18px' : '24px',
                }}
              />
              You don&apos;t have a wallet connected. Some functionalities will not be available
              until you connect one.
            </span>
            <StyledMuiButton
              className='plausible-event-name=Onboarding+Click primary'
              onClick={() => {
                navigate('/sign-in');
              }}
            >
              <OpenInNewRoundedIcon style={{ width: '22px' }} />
              Connect a wallet or learn more
            </StyledMuiButton>
          </motion.div>
        )}

        {isScrolled && (
          <motion.div
            initial={{ opacity: 0, height: 0, minHeight: 0 }}
            animate={{
              opacity: 1,
              height: 'fit-content',
              minHeight: '40px',
              transition: { duration: 0.4, type: 'smooth' },
            }}
            className='w-full flex flex-wrap py-2 justify-center items-center gap-3 bg-slate-500 font-semibold text-white overflow-hidden text-sm'
          >
            <span className='px-2 flex flex-nowrap gap-3 items-center'>
              <ErrorRoundedIcon
                style={{
                  width: isScrolled ? '18px' : '24px',
                }}
              />
              You don&apos;t have a wallet connected. Some functionalities will not be available
              until you connect one.
            </span>

            <StyledMuiButton
              style={{
                display: 'flex',
                gap: '5px',
                alignItems: 'center',
              }}
              className='plausible-event-name=Onboarding+Click primary mini'
              onClick={() => {
                navigate('/sign-in');
              }}
            >
              <OpenInNewRoundedIcon style={{ width: '18px' }} />
              Connect a wallet or learn more
            </StyledMuiButton>
          </motion.div>
        )}
      </>
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
  const { isScrolled } = useScroll(scrollableRef);
  const { pathname } = useLocation();
  const warningRef = useRef<HTMLDivElement>(null);
  const { height: warningHeight } = useComponentDimensions(warningRef);
  const [isMobile, setIsMobile] = useState(false);
  const theme = useTheme();

  useLayoutEffect(() => {
    const currHeaderHeight = document.querySelector('header')?.clientHeight;
    if (currHeaderHeight) {
      setHeaderHeight(`${currHeaderHeight}px`);
    }
  }, [width, height]);

  useEffect(() => {
    const sm = theme.breakpoints.values.sm;
    setIsMobile(width < sm);
  }, [width, theme, setIsMobile]);

  if (pathname === '/sign-in' || pathname === '/swap') {
    return children;
  }

  if (isMobile) {
    return (
      <>
        <Navbar isScrolled={isScrolled} />
        <Box sx={{ height: '100%', display: 'flex', aligItems: 'center' }}>
          <Typography>{'We currently do not Support Mobile. Stay tuned for updates.'}</Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <Navbar isScrolled={isScrolled} />
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
          {pathname !== '/terms' && pathname !== '/request' && pathname !== '/browse' && (
            <Box
              ref={warningRef}
              id={'warning-box'}
              style={{ display: 'flex', justifyContent: 'center' }}
            >
              <WarningMessage isScrolled={isScrolled} />
            </Box>
          )}
          <main style={{ height: '100%' }} ref={scrollableRef} id='main'>
            {children}
          </main>
        </Box>
      </Container>
    </>
  );
}
