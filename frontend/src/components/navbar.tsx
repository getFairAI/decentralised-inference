import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import useArweave from '@/context/arweave';
import Link from 'next/link';
// import { connectWallet, useWallet } from '@/context/wallet';

const Navbar = () => {
  
  const { connect, arweave, addresses, isLoading, error, isConnected, network } = useArweave();
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="sticky">
        <Toolbar>
          {/* <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton> */}
          <Link href="/">
            <Typography variant="h4" component="div" sx={{
                mr: 2,
                display: { md: 'flex' },
                color: 'inherit',
              }}>
              Fair protocol
            </Typography>
          </Link>
          <Box sx={{ flexGrow: 1, display: { md: 'flex', justifyContent: 'flex-start' } }}>
            <Link href="/explore" passHref>
              <Button variant="text" color="secondary">Explore</Button>
            </Link>
            <Link href="/upload" passHref>
              <Button variant="text" color="secondary">Create</Button>
            </Link>
          </Box>
          <Box sx={{ flexGrow: 0 }}>
            {
              isConnected ? (
                <div>
                  <p>{addresses[0]}</p><p>{network}</p>
                </div>)
                : <Button color="inherit" onClick={connect}>Connect</Button>
            }
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

export default Navbar;