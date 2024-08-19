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
import { useCallback, useContext, useState } from 'react';
import { Button, ButtonBase, IconButton, MenuList, Tooltip, useTheme } from '@mui/material';
import Logo from './logo';
import { EVMWalletContext } from '@/context/evm-wallet';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ChooseWalletContext } from '@/context/choose-wallet';
import { AnimatePresence, motion } from 'framer-motion';
import { StyledMuiButton } from '@/styles/components';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';

// icons
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddCommentRoundedIcon from '@mui/icons-material/AddCommentRounded';
import OpenInNew from '@mui/icons-material/OpenInNew';
import GetIcon from './get-icon';
import PowerOffRoundedIcon from '@mui/icons-material/PowerOffRounded';
import PowerSettingsNewRoundedIcon from '@mui/icons-material/PowerSettingsNewRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';

const WalletState = () => {
  const theme = useTheme();
  const { pathname } = useLocation();
  const { currentAddress, isWrongChain, switchChain, connect } = useContext(EVMWalletContext);
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
        navigate('sign-in', { state: { previousPath: pathname } });
      }
    }
  }, [hasOnboarded, navigate]);

  const handleSwitchChain = useCallback(() => switchChain(), [switchChain]);

  if (!isWrongChain && (!currentAddress || currentAddress === '')) {
    return (
      <>
        <StyledMuiButton
          onClick={handleConnect}
          className='plausible-event-name=Navbar+Connect+Wallet primary gradient-bg'
        >
          <img src='./arbitrum-logo.svg' width={'24px'} className='object-contain' />
          Connect Wallet
          <PlayArrowRoundedIcon />
        </StyledMuiButton>
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
          background: 'rgba(0,0,0,0.08)',
          borderRadius: '10px',
          padding: '3px 12px',
          alignItems: 'center',
          justifyContent: 'center',
          display: 'flex',
          gap: '10px',
        }}
      >
        <Box display={'flex'} padding={'6px 6px 6px 12px'}>
          <img width='25px' height='25px' src='./arbitrum-logo.svg' />
        </Box>
        <Box
          sx={{
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
          <div className='ml-2'>
            <ProfileMenu />
          </div>
        </Box>
      </Box>
    </>
  );
};

const Navbar = ({ userScrolledDown }: { userScrolledDown: boolean }) => {
  const { currentAddress, ethBalance, usdcBalance, disconnect } = useContext(EVMWalletContext);
  const { pathname } = useLocation();
  const theme = useTheme();
  const extraIndex = 10; // number to add to zIndex to make sure it's above the drawer
  const zIndex = theme.zIndex.drawer + extraIndex;
  const isGetFair = window.location.hostname.includes('getfair.ai');
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const appBarStyle = {
    zIndex: zIndex,
    alignContent: 'center',
    padding: '10px 20px 10px 20px',
    ...(!userScrolledDown && { boxShadow: 'none' }),
    transform: userScrolledDown ? 'translateY(-80px)' : 'translateY(0px)',
    transition: 'all 0.2s',
  };

  const handleMenuClick = useCallback(() => setIsExpanded((prev) => !prev), [setIsExpanded]);
  const handleBrowse = useCallback(() => {
    navigate('browse');
    setTimeout(() => {
      setIsExpanded(false);
    }, 400);
  }, [navigate]);
  const handleBrowseArbitrum = useCallback(() => {
    navigate('browse-arbitrum-requests');
    setTimeout(() => {
      setIsExpanded(false);
    }, 400);
  }, [navigate]);
  const handleRequest = useCallback(() => {
    navigate('request');
    setIsExpanded(false);
  }, [navigate]);
  const handleOpenOnArweave = useCallback(() => {
    // 'https://fairapp.ar-io.dev'
    const a = document.createElement('a');
    a.target = '_blank';
    a.onclick = () => window.open('https://fairapp.ar-io.dev', '_blank', 'noopener');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsExpanded(false);
    disconnect();
  }, [setIsExpanded, disconnect]);

  const handleViewInExplorer = useCallback(() => {
    window.open(`https://arbiscan.io/address/${currentAddress}`, '_blank');
  }, [currentAddress]);

  const { setOpen: setChooseWalletOpen } = useContext(ChooseWalletContext);
  const chooseWalletOpen = () => {
    setChooseWalletOpen(true);
  };

  return (
    <div style={appBarStyle}>
      <AppBar color='inherit'>
        <div className='flex-col w-full justify-start'>
          <Toolbar className='flex justify-between'>
            <Box display={'flex'} flexDirection={'row'} alignItems={'center'}>
              <Link to='/' style={{ width: '150px', height: '50px' }}>
                <Logo />
              </Link>
              <Typography
                sx={{
                  fontSize: '14px',
                  mt: '-18px',
                  ml: '8px',
                  padding: '0px 8px',
                  border: '1px solid',
                  borderRadius: '8px',
                  color: '#3aaaaa',
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
                <>
                  <StyledMuiButton className='outlined-secondary' onClick={handleBrowseArbitrum}>
                    <SettingsRoundedIcon style={{ width: '20px' }} />
                    Arbitrum LTIP/STIP
                  </StyledMuiButton>
                  <StyledMuiButton className='outlined-secondary' onClick={handleBrowse}>
                    <SearchRoundedIcon style={{ width: '20px' }} />
                    Browse Requests
                  </StyledMuiButton>
                  {currentAddress && (
                    <StyledMuiButton className='outlined-secondary' onClick={handleRequest}>
                      <AddCommentRoundedIcon style={{ width: '20px' }} />
                      Make a Request
                    </StyledMuiButton>
                  )}
                  {isGetFair && (
                    <StyledMuiButton
                      className='outlined-primary hidden lg:flex'
                      onClick={handleOpenOnArweave}
                    >
                      <img src='./arweave-small.svg' style={{ width: '20px' }} className='invert' />
                      Open On Arweave
                    </StyledMuiButton>
                  )}
                </>
              )}
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
              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                }}
              >
                <WalletState />
              </Box>
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                }}
              >
                <IconButton aria-haspopup='true' onClick={handleMenuClick}>
                  {isExpanded ? <CloseIcon color='action' /> : <MenuIcon color='action' />}
                </IconButton>
              </Box>
            </Box>
          </Toolbar>

          {/* MOBILE / SMALL SCREEN MENU */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: '-60px', x: '50px' }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{
                  opacity: 0,
                  y: '-60px',
                  x: '50px',
                  transition: {
                    duration: 0.2,
                  },
                }}
                className='flex justify-center bg-[#ededed] h-[100vh] absolute top-[0px] z-[1000] left-0 w-[100vw]'
              >
                <div className='absolute top-[15px] right-[15px] z-[1001]'>
                  <StyledMuiButton className='secondary fully-rounded' onClick={handleMenuClick}>
                    <CloseIcon />
                  </StyledMuiButton>
                </div>
                <div className='w-full overflow-y-auto pt-2 flex justify-center'>
                  <div className='w-full max-w-[400px] font-medium'>
                    <MenuList>
                      {/* <Option option='Links' setOpen={setIsExpanded} setLinksOpen={setLinksOpen} /> */}

                      <div className='w-full px-4'>
                        <img
                          src='./fair-ai-outline.svg'
                          alt='FairAI Logo'
                          style={{
                            width: '200px',
                            objectFit: 'contain',
                            opacity: 0.85,
                          }}
                        />
                      </div>

                      <div className='px-4 font-bold mt-5 flex justify-between gap-2  flex-wrap'>
                        <div className='flex flex-col'>
                          {currentAddress && <span>Wallet connected</span>}
                          {!currentAddress && (
                            <div className='flex items-center gap-1'>
                              <PowerOffRoundedIcon /> No wallet connected
                            </div>
                          )}
                          {currentAddress && (
                            <div
                              className='font-medium text-sm flex gap-1 flex-nowrap items-center'
                              onClick={handleViewInExplorer}
                            >
                              <span className='text-[#3aaaaa] cursor-pointer'>
                                {`${currentAddress.slice(0, 8)}...${currentAddress.slice(-6)}`}
                              </span>
                              <OpenInNew fontSize='inherit' />
                            </div>
                          )}
                        </div>

                        {currentAddress && (
                          <Tooltip title='Disconnect your wallet/account'>
                            <StyledMuiButton
                              className='secondary fully-rounded'
                              onClick={handleDisconnect}
                            >
                              <PowerSettingsNewRoundedIcon />
                            </StyledMuiButton>
                          </Tooltip>
                        )}
                      </div>

                      {!currentAddress && (
                        <div
                          className='bg-[rgb(70,70,70)] text-white rounded-xl m-3'
                          onClick={chooseWalletOpen}
                        >
                          <ButtonBase
                            component='div'
                            sx={{
                              padding: '12px 20px',
                              width: '100%',
                              display: 'flex',
                              justifyContent: 'flex-start',
                              borderRadius: '10px',
                              gap: 1,
                              '&:hover': {
                                backdropFilter: 'brightness(1.3)',
                              },
                            }}
                          >
                            <PowerSettingsNewRoundedIcon />
                            Connect Wallet
                          </ButtonBase>
                        </div>
                      )}

                      {currentAddress && (
                        <>
                          <div className='flex flex-col px-3 gap-3 mt-4'>
                            <div className='flex justify-between bg-white rounded-xl h-[50px] px-4 items-center flex-wrap'>
                              <div className='flex items-center gap-3'>
                                <img
                                  width='16px'
                                  className='ml-[5px] mr-[2px]'
                                  src='./eth-logo.svg'
                                />
                                <span className='font-bold'>ETH</span>
                              </div>
                              <span className='font-medium font-mono'>
                                {ethBalance.toPrecision(5)}
                              </span>
                            </div>
                            <div className='flex justify-between bg-white rounded-xl h-[50px] px-4 items-center flex-wrap'>
                              <div className='flex items-center gap-3'>
                                <img width='22px' className='ml-[2px]' src='./usdc-logo.svg' />
                                <span className='font-bold'>USDC</span>
                              </div>
                              <span className='font-medium font-mono'>
                                {usdcBalance.toPrecision(5)}
                              </span>
                            </div>
                          </div>

                          <div
                            className='bg-[rgb(70,70,70)] text-white rounded-xl m-3'
                            onClick={handleRequest}
                          >
                            <ButtonBase
                              component='div'
                              sx={{
                                padding: '12px 20px',
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'flex-start',
                                borderRadius: '10px',
                                gap: 1,
                                '&:hover': {
                                  backdropFilter: 'brightness(1.3)',
                                },
                              }}
                            >
                              <GetIcon input={'Top Up'}></GetIcon>
                              Top Up
                            </ButtonBase>
                          </div>

                          <div
                            className='bg-[rgb(70,70,70)] text-white rounded-xl m-3'
                            onClick={chooseWalletOpen}
                          >
                            <ButtonBase
                              component='div'
                              sx={{
                                padding: '12px 20px',
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'flex-start',
                                borderRadius: '10px',
                                gap: 1,
                                '&:hover': {
                                  backdropFilter: 'brightness(1.3)',
                                },
                              }}
                            >
                              <GetIcon input={'Change Wallet'}></GetIcon>
                              Change Wallet
                            </ButtonBase>
                          </div>
                        </>
                      )}

                      <div className='px-4 font-bold mt-5'>
                        <p>Menu</p>
                      </div>
                      <div
                        className='bg-[#3aaaaa] text-white rounded-xl m-3 scale(1) active:scale(0.9)'
                        onClick={handleBrowse}
                      >
                        <ButtonBase
                          component='div'
                          sx={{
                            padding: '12px 20px',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'flex-start',
                            borderRadius: '10px',
                            gap: 1,
                            '&:hover': {
                              backdropFilter: 'brightness(0.9)',
                            },
                          }}
                        >
                          <SearchRoundedIcon style={{ width: '20px' }} />
                          Browse Requests
                        </ButtonBase>
                      </div>

                      <div
                        className='bg-[#3aaaaa] text-white rounded-xl m-3'
                        onClick={handleRequest}
                      >
                        <ButtonBase
                          component='div'
                          sx={{
                            padding: '12px 20px',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'flex-start',
                            borderRadius: '10px',
                            gap: 1,
                            '&:hover': {
                              backdropFilter: 'brightness(0.9)',
                            },
                          }}
                        >
                          <AddCommentRoundedIcon style={{ width: '20px' }} />
                          Make a Request
                        </ButtonBase>
                      </div>

                      <div className='px-4 mt-5 font-bold'>
                        <p>Links</p>
                      </div>
                      <div className='bg-[#3aaaaa] text-white rounded-xl mx-3'>
                        <Option option='Studio' setOpen={setIsExpanded} />
                      </div>
                      <div className='bg-[#3aaaaa] text-white rounded-xl mx-3'>
                        <span className='brightness-[6]'>
                          <Option option='Discord' setOpen={setIsExpanded} />
                        </span>
                      </div>
                      <div className='bg-[#3aaaaa] text-white rounded-xl mx-3'>
                        <Option option='Twitter' setOpen={setIsExpanded} />
                      </div>
                      <div className='bg-[#3aaaaa] text-white rounded-xl mx-3'>
                        <Option option='Github' setOpen={setIsExpanded} />
                      </div>
                      <div className='bg-[#3aaaaa] text-white rounded-xl mx-3'>
                        <Option option='Whitepaper' setOpen={setIsExpanded} />
                      </div>
                      <div className='bg-[#3aaaaa] text-white rounded-xl mx-3'>
                        <Option option='Terms And Conditions' setOpen={setIsExpanded} />
                      </div>
                    </MenuList>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AppBar>
      <Toolbar />
    </div>
  );
};

export default Navbar;
