// components/layout.js
import { Box, Container } from '@mui/material';
import { ReactElement } from 'react';
import Navbar from './navbar';

export default function Layout({ children }: { children: ReactElement }) {
  return (
    <>
      <Navbar />
      <Container disableGutters sx={{ width: '100%', height: 'calc(100% - 94px)' }} maxWidth={false} >
        <Box height='100%'>
          <main style={{ height: '100%' }}>{children}</main>
        </Box>
      </Container>
    </>
  );
}
