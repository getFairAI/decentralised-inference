// components/layout.js
import { Box, Container } from '@mui/material';
import { ReactElement } from 'react';
import Navbar from './navbar';

export default function Layout({ children }: { children: ReactElement}) {
  return (
    <>
      <Navbar />
      <Container disableGutters sx={{ width: '100%' }} maxWidth={false}>
        <Box sx={{ height: '100vh' }}>
          <main style={{ height: '100%' }}>{children}</main>
        </Box>
      </Container>
    </>
  );
}