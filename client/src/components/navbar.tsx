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
  IconButton,
  InputBase,
  MenuItem,
  Select,
  Switch,
  Tooltip,
  styled,
  useTheme,
} from '@mui/material';
import { WalletContext } from '@/context/wallet';
import { Timeout } from 'react-number-format/types/types';
import { defaultDecimalPlaces, U_LOGO_SRC } from '@/constants';
import { usePollingEffect } from '@/hooks/usePollingEffect';
import Logo from './logo';
import { parseUBalance } from '@/utils/u';
import { findTag, getArPriceUSD } from '@/utils/common';
import CopyIcon from '@mui/icons-material/ContentCopy';
import { useSnackbar } from 'notistack';
import { InfoOutlined } from '@mui/icons-material';
import StampsMenu from '@/components/stamps-menu';
import { SnowContext } from '@/context/snow';

const SnowSwitch = styled(Switch)(() => ({
  width: 62,
  height: 34,
  padding: 7,
  '& .MuiSwitch-switchBase': {
    margin: 1,
    padding: 0,
    transform: 'translateX(6px)',
    '&.Mui-checked': {
      backgroundColor: '#1F1F26',
      transform: 'translateX(22px)',
      '& .MuiSwitch-thumb': {
        backgroundColor: '#1F1F26',
        border: 'none',
      },
      '& .MuiSwitch-thumb:before': {
        backgroundSize: '20px',
        backgroundImage:
          "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='35.79' height='35.79'%3E%3Cpath d='M7.161 22.223l.026-.047.865.5-.026.047a.503.503 0 0 1-.434.25c-.019 0-.034-.013-.053-.016l-.355-.205a.493.493 0 0 1-.023-.529zM9.969 8.988l2.785.001 1.393-2.414a.502.502 0 0 0-.869-.499l-1.103 1.913-2.208-.001a.5.5 0 1 0 .002 1zm15.854 17.813h-2.785l-1.393 2.411a.499.499 0 0 0 .436.75c.172 0 .34-.09.434-.25l1.104-1.911h2.207c.274 0 .5-.224.5-.5a.505.505 0 0 0-.503-.5zM23.038 8.99h2.785a.5.5 0 0 0 0-1h-2.207l-1.105-1.913a.5.5 0 0 0-.868.5l1.395 2.413zM12.754 26.801H9.967a.5.5 0 0 0 0 1h2.209l1.105 1.912a.496.496 0 0 0 .682.184.5.5 0 0 0 .184-.684l-1.393-2.412zm-7.218-6.309a.502.502 0 0 0 .685-.184l1.391-2.413-1.394-2.413a.5.5 0 0 0-.867.5l1.104 1.913-1.104 1.913a.5.5 0 0 0 .185.684zM30.254 15.3a.505.505 0 0 0-.685.183l-1.392 2.412 1.395 2.414a.501.501 0 0 0 .867-.5l-1.104-1.914 1.104-1.912a.5.5 0 0 0-.185-.683zm3.138 11.542a.501.501 0 0 1-.683.184l-.98-.565-2.137 1.231a.516.516 0 0 1-.5 0l-2.385-1.377a.502.502 0 0 1-.25-.433v-.854h-4.441l-2.225 3.852.736.428c.154.088.25.254.25.432l.001 2.755a.5.5 0 0 1-.25.433l-2.133 1.229v1.136c0 .274-.225.5-.5.5s-.5-.226-.5-.5v-1.136l-2.136-1.23a.5.5 0 0 1-.25-.433l.001-2.755c0-.178.096-.344.25-.432l.738-.427-2.224-3.849H9.332l.002.851a.505.505 0 0 1-.25.435l-2.387 1.377a.5.5 0 0 1-.5 0L4.06 26.46l-.982.567a.5.5 0 0 1-.5-.867l.982-.567.001-2.465c0-.179.097-.344.25-.434l2.388-1.377a.497.497 0 0 1 .5 0l.736.426 2.221-3.848-2.222-3.849-.737.426a.51.51 0 0 1-.5 0l-2.386-1.377a.5.5 0 0 1-.25-.434l.002-2.464-.983-.567a.501.501 0 0 1-.184-.683.502.502 0 0 1 .684-.183l.983.568 2.134-1.233a.5.5 0 0 1 .5 0l2.385 1.379c.156.089.25.255.25.433v.85h4.443l2.223-3.846-.74-.427a.501.501 0 0 1-.25-.434l.002-2.755c0-.178.096-.343.25-.433l2.135-1.233V.5a.5.5 0 0 1 1 0v1.135l2.134 1.231c.154.089.25.254.25.434l-.002 2.755a.503.503 0 0 1-.25.433l-.733.425 2.224 3.849h4.44l-.002-.851c0-.179.096-.344.25-.434l2.388-1.378a.502.502 0 0 1 .5 0l2.136 1.233.982-.568a.5.5 0 1 1 .5.866l-.983.568v2.464a.503.503 0 0 1-.25.433l-2.388 1.378a.5.5 0 0 1-.5 0l-.735-.426-2.222 3.849 2.223 3.849.734-.425a.506.506 0 0 1 .5 0l2.389 1.375c.154.09.25.255.25.435l-.002 2.462.982.568c.24.137.321.444.182.682zm-2.165-1.828l.001-1.597-1.888-1.087-.734.424-.348.201-.301.173-.5.289v2.179l1.885 1.088 1.386-.802.498-.286.001-.582zm-3.736-11.467l-.531-.307-2.283 1.318-2.443 3.337 2.442 3.337 2.283 1.316.531-.306-2.514-4.348 2.515-4.347zm-7.712 16.478l-.762-.438-.339-.194-.283-.166-.5-.289-.5.289-.279.162-.349.2-.757.437-.001 2.177 1.386.797.501.289.499-.287 1.386-.798-.002-2.179zM16.008 5.767l.736.425.371.214.279.16.5.288.5-.289.281-.163.367-.212.732-.424.002-2.178-1.381-.797-.502-.289-.498.287-1.385.8-.002 2.178zm6.52 14.227l-1.535-2.099 1.535-2.098.732-1-1.232.134-2.585.281-1.048-2.379-.5-1.133-.5 1.134-1.049 2.379-2.585-.281-1.232-.134.732 1 1.536 2.097-1.536 2.098-.732 1 1.232-.134 2.585-.281 1.049 2.379.5 1.134.5-1.134 1.048-2.379 2.585.281 1.232.134-.732-.999zm8.2-10.084l-1.386-.8-1.887 1.089v1.279l.002.32v.577l.5.289.28.163.367.213.732.424 1.888-1.089v-2.178l-.496-.287zM18.927 7.413l-.532.307v2.637l1.667 3.784 4.111-.447 2.283-1.317-.002-.613h-5.02l-2.507-4.351zm-9.594 4.348v.614l2.283 1.318 4.111.447 1.668-3.785V7.719l-.531-.306-2.509 4.347-5.022.001zm-2.15 1.279l.37-.213.279-.162.5-.289V10.2L6.446 9.11l-1.384.8-.499.289v.578l-.002 1.599 1.885 1.088.737-.424zm1.119 9.205l.53.306 2.281-1.316 2.443-3.339-2.442-3.337-2.281-1.317-.531.307 2.511 4.348-2.511 4.348zm-1.115-.069l-.026.047a.493.493 0 0 0 .023.529l-.734-.424-1.887 1.089-.001 1.599v.578l.5.288 1.386.8 1.887-1.088v-1.278l-.002-.321v-.577l-.5-.289-.293-.169c.02.002.035.017.055.017a.5.5 0 0 0 .433-.25l.026-.047-.867-.504zm9.679 6.202l.529-.306v-2.637l-1.668-3.785-4.111.447-2.283 1.316.002.611 5.021.002 2.51 4.352zm9.591-4.349v-.612L24.174 22.1l-4.111-.447-1.667 3.783v2.639l.531.307 2.512-4.352h5.018v-.001z' fill='%23EDEDED'/%3E%3C/svg%3E\")",
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: '#aab4be',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: '#EDEDED',
    border: '1px solid #1F1F26',
    width: 32,
    height: 32,
    '&:before': {
      content: "''",
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: '15px',
      backgroundImage: 'url(./turn-off.svg)',
    },
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    backgroundColor: '#aab4be',
    borderRadius: 10,
  },
}));

const CustomDropDownIcon = () => (
  <Icon
    sx={{
      pointerEvents: 'none',
      position: 'absolute',
      right: '7px',
    }}
  >
    <img src='./chevron-bottom.svg' />
  </Icon>
);

const CurrencyMenu = () => {
  const pollingTimeout = 10000;
  const spaceBetween = 'space-between';

  const [selected, setSelected] = useState<'AR' | 'U'>('U');
  const { currentAddress, currentBalance, currentUBalance, updateBalance, updateUBalance } =
    useContext(WalletContext);

  const pollingFn = () => {
    if (selected === 'AR') {
      return updateBalance();
    } else {
      return updateUBalance();
    }
  };

  const [startPolling, stopPolling] = usePollingEffect(
    pollingFn,
    [currentAddress, selected],
    pollingTimeout,
  );

  const handleArClick = useCallback(() => {
    stopPolling();
    setSelected('AR');
    startPolling();
  }, [setSelected, startPolling, stopPolling]);

  const handleUClick = useCallback(() => {
    stopPolling();
    setSelected('U');
    startPolling();
  }, [setSelected, startPolling, stopPolling]);

  useEffect(() => {
    if (!currentAddress) {
      stopPolling();
    } else {
      // if address changes, restart polling
      startPolling();
    }
  }, [currentAddress]);

  return (
    <>
      <Select
        sx={{
          '& .MuiInputBase-input': {
            display: 'flex',
            alignItems: 'center',
            border: 'none',
            textTransform: 'none',
            padding: 0,
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
        }}
        IconComponent={CustomDropDownIcon}
        value={selected}
      >
        <MenuItem
          value={'AR'}
          onClick={handleArClick}
          sx={{ display: 'flex', justifyContent: spaceBetween }}
        >
          <Typography sx={{ paddingRight: '6px', paddingLeft: '23px', lineHeight: '1.7' }}>
            {currentBalance.toFixed(defaultDecimalPlaces)}
          </Typography>
          <img width='20px' height='20px' src='./arweave-logo-for-light.png' />
        </MenuItem>
        <MenuItem
          value={'U'}
          onClick={handleUClick}
          sx={{ display: 'flex', justifyContent: spaceBetween }}
        >
          <Typography sx={{ paddingRight: '6px', paddingLeft: '16px', lineHeight: '1.7' }}>
            {currentUBalance.toFixed(defaultDecimalPlaces)}
          </Typography>
          <img width='20px' height='20px' src={U_LOGO_SRC} />
        </MenuItem>
      </Select>
    </>
  );
};

const WalletState = () => {
  const theme = useTheme();
  const { currentAddress, isWalletVouched } = useContext(WalletContext);
  const navigate = useNavigate();

  const handleConnect = useCallback(() => navigate('sign-in'), [navigate]);
  const { enqueueSnackbar } = useSnackbar();

  const handleCopyClick = useCallback(async () => {
    if (currentAddress) {
      await navigator.clipboard.writeText(currentAddress);
      enqueueSnackbar('Address Copied to clipboard', { variant: 'info' });
    } else {
      // do nothing
    }
  }, [currentAddress, navigator]);

  if (!currentAddress || currentAddress === '') {
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
        >
          <Typography sx={{ lineHeight: '18.9px', fontSize: '14px' }}>Connect</Typography>
        </Button>
        <ProfileMenu />
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
          padding: 0,
          gap: '17px',
          border: 'solid',
          borderColor: theme.palette.terciary.main,
          borderWidth: '0.5px',
        }}
      >
        <Box display={'flex'}>
          <CurrencyMenu />
        </Box>
        <Box
          sx={{
            background: theme.palette.secondary.contrastText,
            borderRadius: '8px',
            padding: '7px 20px 7px 20px',
            alignItems: 'center',
          }}
          display={'flex'}
          gap={'8px'}
        >
          <Tooltip title={currentAddress} placement={'left-start'}>
            <Typography
              sx={{ color: theme.palette.text.primary, lineHeight: '20.25px', fontSize: '15px' }}
            >
              {currentAddress.slice(0, 10)}...{currentAddress.slice(-3)}
            </Typography>
          </Tooltip>
          {isWalletVouched && (
            <Tooltip title={'Wallet is Vouched'}>
              <img src='./vouch.svg' width={'15px'} height={'15px'} />
            </Tooltip>
          )}
          <Tooltip title='Copy Address'>
            <Typography sx={{ lineHeight: '20.25px', fontSize: '15px' }}>
              <IconButton onClick={handleCopyClick} sx={{ padding: 0 }} size='small'>
                <CopyIcon fontSize='inherit' />
              </IconButton>
            </Typography>
          </Tooltip>
        </Box>
        <ProfileMenu />
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
  const { toggleSnow } = useContext(SnowContext);
  const { pathname, state } = useLocation();
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
    (async () => {
      if (state) {
        const uCost = parseUBalance(state?.fee);
        const arPrice = await getArPriceUSD();
        const isImage = findTag(state.fullState, 'output') === 'image';
        const isStableDiffusion =
          findTag(state.fullState, 'outputConfiguration') === 'stable-diffusion';
        const defaultNImages = 4;
        const nImages = isStableDiffusion ? defaultNImages : 1;

        if (isStableDiffusion || isImage) {
          setTooltip(
            `Cost set by operator for each image: ${(uCost * arPrice).toFixed(
              nDigits,
            )}$\n Default number of images: ${nImages}`,
          );
        } else {
          setTooltip(
            `Cost set by operator for each generation: ${(uCost * arPrice).toFixed(nDigits)}`,
          );
        }
        setUsdFee(uCost * arPrice * nImages);
      }
    })();
  }, [state, parseUBalance, getArPriceUSD]);

  useEffect(() => {
    toggleSnow(true); // snow on by default
  }, []);

  const handleToggleSnow = useCallback(
    (_: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      toggleSnow(checked);
    },
    [toggleSnow],
  );

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
                <StampsMenu id={state.operatorRegistrationTx ?? ''} type='Operator'></StampsMenu>
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
                  <Typography display={'flex'} justifyContent={spaceBetween}>
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
                  sx={{ borderRadius: '8px', border: 'solid 0.5px', padding: '12px 16px' }}
                  startIcon={<img src='./chevron-bottom.svg' />}
                  onClick={() =>
                    navigate(`${pathname}/change-operator`, {
                      state: { ...state.fullState, ...state },
                    })
                  }
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
            <Box>
              <SnowSwitch onChange={handleToggleSnow} defaultChecked />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  );
};

export default Navbar;
