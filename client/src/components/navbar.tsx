import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import ProfileMenu from './profile-menu';
import { useContext, useState } from 'react';
import { IconButton, styled, Tooltip } from '@mui/material';
import { WalletContext } from '@/context/wallet';
import CloseIcon from '@mui/icons-material/Close';

const Banner =  styled(Toolbar)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.error.contrastText,
  // Override media queries injected by theme.mixins.toolbar
  '@media all': {
    minHeight: '30px',
  },
}));

const Navbar = () => {
  const { currentAddress, currentBalance, connectWallet } = useContext(WalletContext);
  const [ showBanner, setShowBanner ] = useState(true);

  return (<>
    <AppBar position='fixed'>
      {
        showBanner &&
          <Banner>
            <Box sx={{ flexGrow: 1, display: { md: 'flex', justifyContent: 'flex-start' } }}>
              <Typography variant='body1'>This Application is in <b>ALPHA</b>. Please Make sure you understand before using any of the functionalities.</Typography>
            </Box>
            <Box sx={{ flexGrow: 0 }}>
              <IconButton size='small' onClick={() => setShowBanner(false)}>
                <CloseIcon fontSize='inherit'/>
              </IconButton>
            </Box>
          </Banner>
      }
      <Toolbar>
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
    <Toolbar />
    <Banner />
  </>);
};

export default Navbar;
