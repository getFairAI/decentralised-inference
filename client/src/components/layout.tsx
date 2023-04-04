// components/layout.js
import FilterContext from '@/context/filter';
import { Box, Container } from '@mui/material';
import { ReactElement, useState } from 'react';
import Navbar from './navbar';

export default function Layout({ children }: { children: ReactElement }) {
  const [showBanner, setShowBanner] = useState(true);

  const [filterValue, setFilterValue] = useState('');

  return (
    <>
      <Navbar
        showBanner={showBanner}
        setShowBanner={setShowBanner}
        setFilterValue={setFilterValue}
      />
      <Container
        disableGutters
        sx={{ width: '100%', height: showBanner ? 'calc(100% - 94px)' : 'calc(100% - 64px)' }}
        maxWidth={false}
      >
        <Box height='100%'>
          <FilterContext.Provider value={filterValue}>
            <main style={{ height: '100%' }}>{children}</main>
          </FilterContext.Provider>
        </Box>
      </Container>
    </>
  );
}
