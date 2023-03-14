import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import ProfileMenu from './profile-menu';
import { Tooltip } from '@mui/material';
import { useContext, useEffect } from 'react';
import { WalletContext } from '@/context/wallet';

const Navbar = () => {
  const { currentAddress, currentBalance, connectWallet } = useContext(WalletContext);

  useEffect(() => {
    console.log(currentAddress);
  }, [ currentAddress]);
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position='fixed'>
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
          <Link to='/'>
            <Typography
              variant='h4'
              component='div'
              sx={{
                mr: 2,
                display: { md: 'flex' },
                color: 'inherit',
              }}
            >
              Fair protocol
            </Typography>
          </Link>
          <Box sx={{ flexGrow: 1, display: { md: 'flex', justifyContent: 'flex-start' } }}>
            <Link to='/explore'>
              <Button variant='text' color='secondary'>
                Explore
              </Button>
            </Link>
            <Link to='/upload'>
              <Button variant='text' color='secondary'>
                Create
              </Button>
            </Link>
            <Link to='/operators'>
              <Button variant='text' color='secondary'>
                Operators
              </Button>
            </Link>
          </Box>
          <Box sx={{ flexGrow: 0 }}>
            {currentAddress && currentAddress !== '' ? (
              <Box display={'flex'} alignItems={'center'}>
                <Box display={'flex'} flexDirection={'column'} alignItems={'flex-end'}>
                  <Tooltip title={currentAddress} placement={'left-start'}>
                    <Typography>
                      {currentAddress.slice(0, 10)}...{currentAddress.slice(-3)}
                    </Typography>
                  </Tooltip>
                  <Typography>{currentBalance.toFixed(4)} AR</Typography>
                </Box>
                <ProfileMenu />
              </Box>
            ) : (
              <Button color='inherit' onClick={connectWallet}>
                Connect
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navbar;
