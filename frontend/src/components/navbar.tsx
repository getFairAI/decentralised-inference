import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import useArweave from '@/context/arweave';
// import { connectWallet, useWallet } from '@/context/wallet';

const Navbar = () => {
  
  const { connect, arweave, addresses, isLoading, error, isConnected, network } = useArweave();
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            News
          </Typography>
          {
            isConnected ? (
              <div>
                <p>{addresses[0]}</p><p>{network}</p>
              </div>)
              : <Button color="inherit" onClick={connect}>Connect</Button>
          }
        </Toolbar>
      </AppBar>
    </Box>
  );
}

export default Navbar;