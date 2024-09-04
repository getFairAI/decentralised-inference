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

import { Box, Container, useTheme } from '@mui/material';
import { ReactElement, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Navbar from './navbar';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import useScroll from '@/hooks/useScroll';
import { useLocation } from 'react-router-dom';
import useComponentDimensions from '@/hooks/useComponentDimensions';

// icons
import usePrevious from '@/hooks/usePrevious';

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
            ></Box>
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
