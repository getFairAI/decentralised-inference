import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import ProfileMenu from './profile-menu';
import { ChangeEvent, Dispatch, SetStateAction, useContext } from 'react';
import { Button, Icon, IconButton, InputBase, styled, Tooltip, useTheme } from '@mui/material';
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
  const theme = useTheme();
  const { currentAddress, currentBalance, connectWallet } = useContext(WalletContext);

  if (!currentAddress && currentAddress !== '') {
    return (
      <IconButton onClick={connectWallet}>
        <img src='/icon-empty-wallet.svg' />
      </IconButton>
    );
  }

  return (
    <>
      <Box
        sx={{
          borderRadius: '23px',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 0,
          gap: '17px',
          background: theme.palette.secondary.main,
        }}
      >
        <Box display={'flex'}>
          <Typography sx={{ paddingRight: '6px', paddingLeft: '23px' }}>
            {currentBalance.toFixed(4)}
          </Typography>
          <img src='/arweave-small.svg' />
        </Box>
        <Box
          sx={{
            background: theme.palette.background.default,
            borderRadius: '43px',
            padding: '7px 20px 7px 20px',
          }}
        >
          <Tooltip title={currentAddress} placement={'left-start'}>
            <Typography sx={{ color: theme.palette.text.primary }}>
              {currentAddress.slice(0, 10)}...{currentAddress.slice(-3)}
            </Typography>
          </Tooltip>
        </Box>
        <ProfileMenu />
      </Box>
    </>
  );
};

const Navbar = ({
  showBanner,
  setShowBanner,
  setFilterValue,
}: {
  showBanner: boolean;
  setShowBanner: Dispatch<SetStateAction<boolean>>;
  setFilterValue: Dispatch<SetStateAction<string>>;
}) => {
  const { pathname, state } = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <>
      <AppBar className='navbar'>
        {showBanner && (
          <Banner>
            <Box sx={{ flexGrow: 1, display: { md: 'flex', justifyContent: 'flex-start' } }}>
              <Typography variant='h4'>
                This Application is in <b>PRE-ALPHA</b>. Please Make sure you understand before using
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
              <img src='/fair-protocol-logo.svg' />
            </Link>
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            {pathname && (pathname === '/' || pathname === '/explore') && (
              <Box
                sx={{
                  borderRadius: '30px',
                  margin: '0 50px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '3px 20px 3px 50px',
                  alignItems: 'center',
                  background: theme.palette.background.default
                }}
              >
                <InputBase
                  sx={{
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '18px',
                    lineHeight: '16px',
                    width: '100%',
                  }}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFilterValue(event.target.value)
                  }
                  placeholder='Search...'
                />
                <Icon
                  sx={{
                    height: '30px',
                  }}
                >
                  <img src='/search-icon.svg'></img>
                </Icon>
              </Box>
            )}
          </Box>
          <Box className={'navbar-right-content'}>
            {pathname.includes('chat') ? (
              <>
                <Button
                  sx={{ borderRadius: '20px', padding: '8px 16px' }}
                  startIcon={<img src='/chevron-bottom.svg' />}
                  onClick={() =>
                    navigate(`${pathname}/change-operator`, {
                      state: { ...state.fullState, ...state },
                    })
                  }
                >
                  <Typography
                    sx={{
                      fontWeight: 500,
                      fontSize: '18px',
                      lineHeight: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      color: theme.palette.primary.contrastText,
                    }}
                  >
                    Change Operator
                  </Typography>
                </Button>
                <NavLink to='/' className='navbar-links'>
                  Explore
                </NavLink>
                <WalletState />
              </>
            ) : (
              <>
                <NavLink to='/' className='navbar-links'>
                  Explore
                </NavLink>
                <NavLink to='/upload' className='navbar-links'>
                  Curators
                </NavLink>
                <NavLink to='/operators' className='navbar-links'>
                  Operators
                </NavLink>
                <WalletState />
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar />
      {showBanner && <Banner />}
    </>
  );
};

export default Navbar;
