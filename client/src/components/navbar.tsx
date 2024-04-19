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
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import ProfileMenu from './profile-menu';
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  Button,
  Icon,
  InputBase,
  Tooltip,
  useTheme,
} from '@mui/material';
import { Timeout } from 'react-number-format/types/types';
import Logo from './logo';
import { InfoOutlined } from '@mui/icons-material';
import { EVMWalletContext } from '@/context/evm-wallet';
import StampsMenu from './stamps-menu';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const WalletState = () => {
  const theme = useTheme();
  const { currentAddress, isWrongChain, switchChain, connect } = useContext(EVMWalletContext);
  const { localStorageValue: hasOnboarded } = useLocalStorage('hasOnboarded');
  const navigate = useNavigate();

  const handleConnect = useCallback(async () => {
    if (!hasOnboarded) {
      navigate('sign-in');
    } else {
      await connect();
    }
  }, [hasOnboarded, navigate]);
  const handleSwitchChain = useCallback(() => switchChain(), [switchChain]);

  if (!isWrongChain &&( !currentAddress || currentAddress === '')) {
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
            paddingTop: '11px',
            paddingBottom: '11px',
          }}
          onClick={handleConnect}
          className='plausible-event-name=Navbar+Connect+Wallet'
        >
          <Typography sx={{ lineHeight: '18.9px', fontSize: '14px', display: 'flex', gap: '8px' }}><img src='./arbitrum-logo.svg' width={'20px'} height={'20px'}/>Connect</Typography>
        </Button>
        <ProfileMenu />
      </>
    );
  }

  if (isWrongChain) {
    return <>
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
          paddingTop: '9.5px',
          paddingBottom: '11px',
          ':hover': {
            borderColor: theme.palette.error.main,
          }
        }}
        onClick={handleSwitchChain}
        className='plausible-event-name=Navbar+Connect+Wallet'
      >
        <Typography sx={{ lineHeight: '20.25px', fontSize: '15px', fontWeight: 700, color: theme.palette.error.main }}>Invalid Network</Typography>
      </Button>
    </>;
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
          padding: 0,
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
              sx={{ color: theme.palette.text.primary, lineHeight: '20.25px', fontSize: '15px', fontWeight: 700 }}
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
  setFilterValue,
  isScrolled,
}: {
  setFilterValue: Dispatch<SetStateAction<string>>;
  isScrolled: boolean;
}) => {
  const { address: operatorAddress } = useParams();
  const { state, pathname } = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const extraIndex = 2; // number to add to zIndex to make sure it's above the drawer
  const zIndex = theme.zIndex.drawer + extraIndex; // add 2 to make sure it's above the drawer
  let keyTimeout: Timeout;
  const [usdFee, setUsdFee] = useState(0);
  const [tooltip, setTooltip] = useState('');
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    clearTimeout(keyTimeout);
    keyTimeout = setTimeout(() => {
      setFilterValue(event.target.value);
    }, 500);
  };

  const appBarStyle = {
    zIndex,
    alignContent: 'center',
    padding: '10px 20px 10px 20px',
    ...(!isScrolled && { boxShadow: 'none' }),
  };
  const spaceBetween = 'space-between';
  const nDigits = 4;

  useEffect(() => {
    if (state && state.fee) {
      setTooltip(
        `Cost set by operator for each generation: ${(state.fee).toFixed(nDigits)} USDC`,
      );
      setUsdFee(state.fee);
    }
  }, [ state ]);

  return (
    <>
      <AppBar sx={appBarStyle} color='inherit'>
        <Toolbar sx={{ justifyContent: spaceBetween }}>
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
          <Box sx={{ flexGrow: 1 }} display={{ sm: 'none', lg: 'flex' }}>
            {' '}
            {/* hide searchbar on small screens */}
            {pathname && pathname === '/' && (
              <>
                <Box
                  sx={{
                    borderRadius: '8px',
                    margin: '0 50px',
                    display: 'flex',
                    justifyContent: spaceBetween,
                    padding: '3px 20px 3px 50px',
                    alignItems: 'center',
                    border: 'solid',
                    borderColor: theme.palette.terciary.main,
                    borderWidth: '0.5px',
                    width: '100%',
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
              </>
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
                <StampsMenu id={operatorAddress ?? ''} type='Operator'></StampsMenu>
                <Box>
                  <Typography
                    sx={{
                      fontStyle: 'normal',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    Default Cost:
                  </Typography>
                  <Typography display={'flex'} justifyContent={spaceBetween} gap={'4px'}>
                    {usdFee.toFixed(nDigits)}$
                    <Tooltip
                      title={
                        <Typography variant='caption' sx={{ whiteSpace: 'pre-line' }}>
                          {tooltip}
                        </Typography>
                      }
                      placement='bottom'
                    >
                      <InfoOutlined />
                    </Tooltip>
                  </Typography>
                </Box>
                <Button
                  sx={{ borderRadius: '8px', border: 'solid 0.5px', padding: '11px 16px' }}
                  startIcon={<img src='./chevron-bottom.svg' />}
                  onClick={() =>
                    navigate(`${pathname}/change-operator`)
                  }
                  className='plausible-event-name=Change+Operator+Click'
                >
                  <Typography
                    noWrap
                    sx={{
                      lineHeight: '18.9px',
                    }}
                  >
                    Change Operator
                  </Typography>
                </Button>
                <WalletState />
              </>
            ) : (
              <>
                <WalletState />
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  );
};

export default Navbar;
