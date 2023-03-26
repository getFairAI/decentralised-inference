import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link, NavLink, useLocation } from 'react-router-dom';
import ProfileMenu from './profile-menu';
import { Dispatch, SetStateAction, useContext } from 'react';
import { Icon, IconButton, InputBase, styled, Tooltip } from '@mui/material';
import { WalletContext } from '@/context/wallet';
import CloseIcon from '@mui/icons-material/Close';

const Banner = styled(Toolbar)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.error.contrastText,
  // Override media queries injected by theme.mixins.toolbar
  '@media all': {
    minHeight: '25px',
  },
}));

const WalletState = () => {
  const { currentAddress, currentBalance, connectWallet } = useContext(WalletContext);

  if (!currentAddress && currentAddress !== '') {
    return <IconButton onClick={connectWallet}>
      <img src='/public/icon-empty-wallet.svg'/>
    </IconButton>;
  }

  return <>
    <Box sx={{
      background: '#222222',
      borderRadius: '23px',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 0,
      gap: '17px',
    }}>
      <Box display={'flex'}>
        <Typography sx={{ paddingRight: '6px', paddingLeft: '23px'}}>{currentBalance.toFixed(4)}</Typography>
        <img src='/public/arweave-small.svg'/>
      </Box>
      <Box sx={{
        background: '#D9D9D9',
        borderRadius: '43px',
        padding: '7px 20px 7px 20px',
      }}>
        <Tooltip title={currentAddress} placement={'left-start'}>
          <Typography sx={{color: '#222222'}}>
            {currentAddress.slice(0, 10)}...{currentAddress.slice(-3)}
          </Typography>
        </Tooltip>
      </Box>
      <ProfileMenu />
    </Box>
  </>;
};

const Navbar = ({
  showBanner,
  setShowBanner,
}: {
  showBanner: boolean;
  setShowBanner: Dispatch<SetStateAction<boolean>>;
}) => {
  const { pathname } = useLocation();

  return (
    <>
      <AppBar className='navbar' sx={{ background: '#000000'}}>
        {showBanner && (
          <Banner>
            <Box sx={{ flexGrow: 1, display: { md: 'flex', justifyContent: 'flex-start' } }}>
              <Typography variant='body1'>
                This Application is in <b>ALPHA</b>. Please Make sure you understand before using
                any of the functionalities.
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 0 }}>
              <IconButton size='small' onClick={() => setShowBanner(false)}>
                <CloseIcon fontSize='inherit' />
              </IconButton>
            </Box>
          </Banner>
        )}
        <Toolbar>
          <Box display={'flex'} flexDirection={'row'}>
            <Link to='/'>
              <img src="/public/fair-protocol-logo.svg" />
            </Link>
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            {
              pathname && (pathname === '/' || pathname === '/explore') &&
                <Box sx={{
                  background: '#B1B1B1',
                  borderRadius: '30px',
                  margin: '0 50px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '3px 20px 3px 50px',
                  alignItems: 'center'
                }}>
                  <InputBase sx={{
                    color: '#595959',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '16px',
                  }}
                  placeholder='Search...'/>
                  <Icon sx={{
                    height: '30px'
                  }}>
                    <img src='/public/search-icon.svg'></img>
                  </Icon>
                </Box>
            }
          </Box>
          <Box className={'navbar-right-content'}>
            <NavLink to='/explore' className='navbar-links'>
              Explore
            </NavLink>
            <NavLink to='/upload' className='navbar-links'>
              Create
            </NavLink>
            <NavLink to='/operators' className='navbar-links'>
              Operators
            </NavLink>
            <WalletState />
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar />
      {showBanner && <Banner />}
    </>
  );
};

export default Navbar;
