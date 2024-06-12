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
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ProfileMenu from './profile-menu';
import Option from './option';
import {
  useCallback,
  useContext,
  useState,
} from 'react';
import {
  Button,
  IconButton,
  MenuList,
  Tooltip,
  useTheme,
} from '@mui/material';
import Logo from './logo';
import { EVMWalletContext } from '@/context/evm-wallet';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ChooseWalletContext } from '@/context/choose-wallet';
import { motion } from 'framer-motion';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const WalletState = () => {
  const theme = useTheme();
  const { pathname } = useLocation();
  const { currentAddress, isWrongChain, switchChain, connect } = useContext(EVMWalletContext);
  const { setOpen: chooseWalletOpen } = useContext(ChooseWalletContext);
  const { localStorageValue: hasOnboarded } = useLocalStorage('hasOnboarded');
  const navigate = useNavigate();

  const handleConnect = useCallback(async () => {
    if (!hasOnboarded) {
      navigate('sign-in', { state: { previousPath: pathname } });
    } else {
      try {
        await connect();
      } catch (err) {
        // open choose Wallet
        chooseWalletOpen(true);
      }
    }
  }, [hasOnboarded, navigate]);

  const handleSwitchChain = useCallback(() => switchChain(), [switchChain]);

  if (!isWrongChain && (!currentAddress || currentAddress === '')) {
    return (
      <>
        <Button
          variant='outlined'
          sx={{
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '17px',
            border: 'solid',
            borderColor: theme.palette.terciary.main,
            borderWidth: '0.5px',
            padding: '10px 15px',
          }}
          onClick={handleConnect}
          className='plausible-event-name=Navbar+Connect+Wallet'
        >
          <Typography sx={{ lineHeight: '1.3', fontSize: '16px', display: 'flex', gap: '8px' }}>
            <img src='./arbitrum-logo.svg' width={'20px'} height={'20px'} />
            Connect
          </Typography>
        </Button>
      </>
    );
  }

  if (isWrongChain) {
    return (
      <>
        <Button
          variant='outlined'
          sx={{
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '17px',
            border: 'solid',
            borderColor: theme.palette.error.main,
            borderWidth: '0.5px',
            padding: '10px 15px',
            ':hover': {
              borderColor: theme.palette.error.main,
            },
          }}
          onClick={handleSwitchChain}
          className='plausible-event-name=Navbar+Connect+Wallet'
        >
          <Typography
            sx={{
              lineHeight: '1.3',
              fontSize: '16px',
              fontWeight: 700,
              color: theme.palette.error.main,
            }}
          >
            Invalid Network
          </Typography>
        </Button>
      </>
    );
  }

  return (
    <>
      <Box
        sx={{
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '17px',
          border: 'solid',
          borderColor: theme.palette.terciary.main,
          borderWidth: '0.5px',
        }}
      >
        <Box display={'flex'} padding={'6px 6px 6px 12px'}>
          <img width='25px' height='25px' src='./arbitrum-logo.svg' />
        </Box>
        <Box
          sx={{
            /* background: theme.palette.secondary.contrastText, */
            borderRadius: '8px',
            padding: '6px 8px 6px 0px',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          display={'flex'}
        >
          <Tooltip title={currentAddress} placement={'bottom-start'}>
            <Typography
              sx={{
                color: theme.palette.text.primary,
                lineHeight: '20.25px',
                fontSize: '15px',
                fontWeight: 700,
              }}
            >
              {currentAddress.slice(0, 6)}...{currentAddress.slice(-4)}
            </Typography>
          </Tooltip>
          <ProfileMenu />
        </Box>
      </Box>
    </>
  );
};

const Navbar = ({
  isScrolled,
}: {
  isScrolled: boolean;
}) => {
  const { currentAddress } = useContext(EVMWalletContext);
  const { pathname } = useLocation();
  const theme = useTheme();
  const extraIndex = 2; // number to add to zIndex to make sure it's above the drawer
  const zIndex = theme.zIndex.drawer + extraIndex; // add 2 to make sure it's above the drawer
  const isGetFair = window.location.hostname.includes('getfair.ai');
  const [ isExpanded, setIsExpanded ] = useState(false);

  const appBarStyle = {
    zIndex,
    alignContent: 'center',
    padding: '10px 20px 10px 20px',
    ...(!isScrolled && { boxShadow: 'none' }),
  };

  const handleMenuClick = () => setIsExpanded(prev => !prev);

  return (
    <>
      <AppBar sx={appBarStyle} color='inherit'>
        <motion.div className='flex-col w-full justify-start'
          animate={{
            height: isExpanded ? '100vh' : 'fit-content',
          }}
          transition={{
            duration: 0.5,
          }}
        >
          <Toolbar className='flex justify-between'>
            <Box display={'flex'} flexDirection={'row'} alignItems={'center'}>
              <Link to='/'>
                <Logo />
              </Link>
              <Typography
                sx={{
                  fontSize: '14px',
                  mt: '-18px',
                  ml: '8px',
                  padding: '0px 8px',
                  border: '0.5px solid',
                  borderRadius: '8px',
                }}
              >
                EARLY
              </Typography>
            </Box>
            <Box
              sx={{ flexGrow: 1, gap: '16px', marginLeft: '16px' }}
              display={{ sm: 'none', lg: 'flex' }}
            >
              {' '}
            </Box>
            <Box
              sx={{
                gap: '16px',
                display: { xs: 'none', sm: 'flex' },
                justifyContent: 'flex-end',
                alignItems: 'center',
                margin: '0px 16px',
                flexGrow: 1,
              }}
            >
              {pathname === '/' && (
                <Link to='/browse'>
                  <Typography
                    textTransform={'uppercase'}
                    lineHeight={1.3}
                    sx={{ textWrap: 'nowrap' }}
                  >
                    Browse Requests
                  </Typography>
                </Link>
              )}
              {pathname === '/' && currentAddress && (
                <>
                  <Link
                    to='/request'
                    style={{
                      border: `0.5px solid ${theme.palette.terciary.main}`,
                      borderRadius: '8px',
                    }}
                  >
                    <Typography
                      padding={'9.5px 15px'}
                      textTransform={'uppercase'}
                      lineHeight={1.3}
                      sx={{ textWrap: 'nowrap' }}
                    >
                      Make a request
                    </Typography>
                  </Link>
                </>
              )}
              { isGetFair && pathname === '/' &&
                <Link
                  to='https://fairapp.ar-io.dev'
                  style={{
                    border: `0.5px solid ${theme.palette.terciary.main}`,
                    borderRadius: '8px',
                  }}
                >
                  <Typography
                    padding={'9.5px 15px'}
                    textTransform={'uppercase'}
                    lineHeight={1.3}
                    sx={{ textWrap: 'nowrap' }}
                  >
                    Open On Arweave
                  </Typography>
                </Link>
              }
            </Box>
            <Box
              className={'navbar-right-content'}
              sx={{
                display: 'flex',
                justifyContent: { sm: 'flex-end', md: 'center' },
                gap: { sm: '16px', md: '16px' },
                flexGrow: { sm: 0, md: 0 },
              }}
            >
              <Box sx={{
                display: { xs: 'none', md: 'flex' },
              }}>
                <WalletState />
              </Box>
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                }}
              >
                <IconButton
                  aria-haspopup='true'
                  onClick={handleMenuClick}
                >
                  {isExpanded ? <CloseIcon color='action' /> : <MenuIcon color='action' />}
                </IconButton>
              </Box> 
            </Box>
          </Toolbar>
          {isExpanded && <Box>
            <MenuList>
              {/* <Option option='Links' setOpen={setIsExpanded} setLinksOpen={setLinksOpen} /> */}
              <Option option='Twitter' setOpen={setIsExpanded} />
              <Option option='Github' setOpen={setIsExpanded} />
              <Option option='Discord' setOpen={setIsExpanded} />
              <Option option='Whitepaper' setOpen={setIsExpanded} />
              <Option option='Studio' setOpen={setIsExpanded} />
              <Option option='Terms And Conditions' setOpen={setIsExpanded} />
            </MenuList>
          </Box>}
        </motion.div>
      </AppBar>
      <Toolbar />
    </>
  );
};

export default Navbar;
