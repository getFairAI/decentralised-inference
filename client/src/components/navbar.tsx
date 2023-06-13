/*
 * Fair Protocol, open source decentralised inference marketplace for artificial intelligence.
 * Copyright (C) 2023 Fair Protocol
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 */

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import ProfileMenu from './profile-menu';
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useState,
  MouseEvent,
} from 'react';
import {
  Button,
  Icon,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  styled,
  Tooltip,
  useTheme,
} from '@mui/material';
import { WalletContext } from '@/context/wallet';
import CloseIcon from '@mui/icons-material/Close';
import Pending from './pending';
import NavigationMenu from './navigation-menu';
import { ChooseWalletContext } from '@/context/choose-wallet';
import { Timeout } from 'react-number-format/types/types';

const Banner = styled(Toolbar)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.error.contrastText,
  // Override media queries injected by theme.mixins.toolbar
  '@media all': {
    minHeight: '25px',
  },
}));

const CurrencyMenu = () => {
  const itemNumber = 4.5;
  const ITEM_HEIGHT = 64;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [selected, setSelected] = useState<'AR' | 'U'>('AR');
  const { currentBalance, currentUBalance } = useContext(WalletContext);

  const handleClick = useCallback((event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleArClick = useCallback(() => {
    setSelected('AR');
    handleClose();
  }, [setSelected, handleClose]);

  const handleUClick = useCallback(() => {
    setSelected('U');
    handleClose();
  }, [setSelected, handleClose]);

  return (
    <>
      <Typography sx={{ paddingRight: '6px', paddingLeft: '23px' }}>
        {selected === 'AR' ? `${currentBalance}` : `${currentUBalance}`}
      </Typography>
      {selected === 'AR' ? (
        <img width='20px' height='29px' src='./arweave-small.svg' />
      ) : (
        <img
          width='20px'
          height='29px'
          src='https://arweave.net/J3WXX4OGa6wP5E9oLhNyqlN4deYI7ARjrd5se740ftE'
        />
      )}
      <IconButton
        aria-label='more'
        id='long-button'
        aria-controls={open ? 'long-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup='true'
        onClick={handleClick}
      >
        <img src='./chevron-bottom.svg' />
      </IconButton>
      <Menu
        id='long-menu'
        MenuListProps={{
          'aria-labelledby': 'long-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * itemNumber,
            width: '20ch',
          },
        }}
      >
        <MenuItem onClick={handleArClick}>
          <Typography>{'AR'}</Typography>
        </MenuItem>
        <MenuItem onClick={handleUClick}>
          <Typography>{'U'}</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

const WalletState = () => {
  const theme = useTheme();
  const { currentAddress, isWalletVouched } = useContext(WalletContext);

  const { setOpen: connectWallet } = useContext(ChooseWalletContext);

  const handleConnect = useCallback(() => connectWallet(true), [connectWallet]);

  if (!currentAddress || currentAddress === '') {
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
          <Typography sx={{ paddingRight: '6px', paddingLeft: '23px' }}>Connect Wallet</Typography>
          <IconButton onClick={handleConnect} sx={{ paddingRight: '16px' }}>
            <img src='./icon-empty-wallet.svg' />
          </IconButton>
        </Box>
        <ProfileMenu />
      </>
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
          <CurrencyMenu />
        </Box>
        <Box
          sx={{
            background: theme.palette.background.default,
            borderRadius: '43px',
            padding: '7px 20px 7px 20px',
          }}
          display={'flex'}
          gap={'8px'}
        >
          <Tooltip title={currentAddress} placement={'left-start'}>
            <Typography sx={{ color: theme.palette.text.primary }}>
              {currentAddress.slice(0, 10)}...{currentAddress.slice(-3)}
            </Typography>
          </Tooltip>
          {isWalletVouched && (
            <Tooltip title={'Wallet is Vouched'}>
              <img src='./vouch.svg' />
            </Tooltip>
          )}
        </Box>
        <Pending />
      </Box>
      <ProfileMenu />
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
  const extraIndex = 2; // number to add to zIndex to make sure it's above the drawer
  const zIndex = theme.zIndex.drawer + extraIndex; // add 2 to make sure it's above the drawer
  const navbarLinkStyles = {
    fontWeight: 400,
    fontSize: '18px',
    lineHeight: '24px',
    display: { sm: 'none', md: 'flex' },
  };

  let keyTimeout: Timeout;
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    clearTimeout(keyTimeout);
    keyTimeout = setTimeout(() => {
      setFilterValue(event.target.value);
    }, 500);
  };

  return (
    <>
      <AppBar className='navbar' sx={{ zIndex }}>
        {showBanner && (
          <Banner>
            <Box sx={{ flexGrow: 1, display: { md: 'flex', justifyContent: 'flex-start' } }}>
              <Typography variant='h4'>
                This App is in <b>ALPHA</b> version and the code has not been audited yet. Please
                make sure you understand before using any of the functionalities.
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
              <img
                src={
                  theme.palette.mode === 'dark'
                    ? './fair-protocol-logo.svg'
                    : './fair-protocol-logo-light.svg'
                }
              />
            </Link>
          </Box>
          <Box sx={{ flexGrow: 1 }} display={{ sm: 'none', lg: 'flex' }}>
            {' '}
            {/* hide searchbar on small screens */}
            {pathname && (pathname === '/' || pathname === '/explore') && (
              <Box
                sx={{
                  borderRadius: '30px',
                  margin: '0 50px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '3px 20px 3px 50px',
                  alignItems: 'center',
                  background: theme.palette.background.default,
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
                  onChange={handleChange}
                  placeholder='Search...'
                />
                <Icon
                  sx={{
                    height: '30px',
                  }}
                >
                  <img src='./search-icon.svg'></img>
                </Icon>
              </Box>
            )}
          </Box>
          <Box
            className={'navbar-right-content'}
            sx={{
              justifyContent: { sm: 'flex-end', md: 'center' },
              gap: { sm: '16px', md: '34px' },
              flexGrow: { sm: 1, md: 0 },
            }}
          >
            {pathname.includes('chat') ? (
              <>
                <Button
                  sx={{ borderRadius: '20px', padding: '8px 16px' }}
                  startIcon={<img src='./chevron-bottom.svg' />}
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
                <Typography
                  component={NavLink}
                  to='/'
                  className='navbar-links'
                  sx={navbarLinkStyles}
                >
                  Explore
                </Typography>
                <Typography
                  component={NavLink}
                  to='/upload-creator'
                  className='navbar-links'
                  sx={navbarLinkStyles}
                >
                  Creators
                </Typography>
                <Typography
                  component={NavLink}
                  to='/upload'
                  className='navbar-links'
                  sx={navbarLinkStyles}
                >
                  Curators
                </Typography>
                <Typography
                  component={NavLink}
                  to='/operators'
                  className='navbar-links'
                  sx={navbarLinkStyles}
                >
                  Operators
                </Typography>
                <NavigationMenu navStyles={navbarLinkStyles} />
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
