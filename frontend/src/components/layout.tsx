// components/layout.js
import { Box } from '@mui/material';
import { ReactElement } from 'react';
import Navbar from './navbar';

export default function Layout({ children }: { children: ReactElement}) {
  return (
    <>
      <Box component="main">
        <Navbar />
        <main>{children}</main>
      </Box>
    </>
  )
}