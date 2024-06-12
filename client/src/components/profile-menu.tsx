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

import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import {
  useState,
  useContext,
  useRef,
  SyntheticEvent,
  KeyboardEvent,
  useEffect,
  useCallback,
} from 'react';
import { EVMWalletContext } from '@/context/evm-wallet';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  ClickAwayListener,
  Divider,
  Grow,
  MenuList,
  Paper,
  Popper,
  Typography,
} from '@mui/material';
import OpenInNew from '@mui/icons-material/OpenInNew';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import Option from './option';
import { motion } from 'framer-motion';

export default function ProfileMenu() {
  /*  const [ trasnformPosition, setTransformPosition ] = useState(false); */
  const [open, setOpen] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
    setLinksOpen(false);
  };

  const { currentAddress, ethBalance, usdcBalance, disconnect } = useContext(EVMWalletContext);

  const handleListKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
      setLinksOpen(false);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setLinksOpen(false);
    }
  };

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current!.focus();
    }

    prevOpen.current = open;
  }, [open]);

  const prevLinksOpen = useRef(linksOpen);
  useEffect(() => {
    if (prevLinksOpen.current === true && open === false) {
      anchorRef.current!.focus();
    }

    prevLinksOpen.current = open;
  }, [open]);

  const handleClose = (event: Event | SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }

    setOpen(false);
  };

  const handleLinksClose = (event: Event | SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }

    setLinksOpen(false);
  };

  const showIcon = () => {
    if (!currentAddress) {
      return <>{open ? <CloseIcon color='action' /> : <MenuIcon color='action' />}</>;
    } else {
      return  <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
        <img src='./chevron-bottom.svg' />
      </motion.div>;
    }
  };

  const handleDisconnect = useCallback(() => {
    setOpen(false);
    disconnect();
  }, [setOpen, disconnect]);
  

  const handleViewInExplorer = useCallback(() => {
    window.open(`https://arbiscan.io/address/${currentAddress}`, '_blank');
  }, [currentAddress]);

  return (
    <div>
      <Box display={{xs: 'none', sm: 'flex'}}>
        <IconButton
          aria-label='more'
          id='long-button'
          aria-controls={open ? 'long-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup='true'
          onClick={handleToggle}
          ref={anchorRef}
          sx={
            {
              /* ...!!currentAddress && { paddingLeft: 0}, */
            }
          }
        >
          {showIcon()}
        </IconButton>
      </Box>
      
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        placement='bottom-end'
        disablePortal
        sx={{
          transform: 'translate(-22px, 64px) !important',
        }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <Card variant='outlined'>
                  {currentAddress !== '' && <>
                    <CardHeader
                      avatar={
                        <IconButton onClick={handleDisconnect}>
                          <PowerSettingsNewIcon />
                        </IconButton>
                      }
                      subheader={'Connected Account'}
                      title={
                        <Typography
                          fontWeight={500}
                          sx={{
                            textDecoration: 'underline',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            cursor: 'pointer',
                          }}
                          onClick={handleViewInExplorer}
                        >
                          {`${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}`}
                          <OpenInNew fontSize='inherit' />
                        </Typography>
                      }
                      sx={{
                        '&.MuiCardHeader-root': {
                          display: 'flex',
                          gap: '24px',
                          flexDirection: 'row-reverse',
                          justifyContent: 'space-between',
                        },
                        '& .MuiCardHeader-avatar': {
                          marginRight: 0,
                        },
                        '& .MuiCardHeader-content': {
                          display: 'flex',
                          flexDirection: 'column-reverse',
                        },
                      }}
                    />
                    <CardContent
                      sx={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: 0 }}
                    >
                      <Box display={'flex'} justifyContent={'space-between'}>
                        <Box display={'flex'} alignItems={'center'} gap={'8px'}>
                          <img width='20px' height='20px' src='./eth-logo.svg' />
                          <Typography fontWeight={600}>ETH</Typography>
                        </Box>
                        <Typography fontWeight={400}>{ethBalance.toPrecision(4)}</Typography>
                      </Box>
                      <Box display={'flex'} justifyContent={'space-between'}>
                        <Box display={'flex'} alignItems={'center'} gap={'8px'}>
                          <img width='20px' height='20px' src='./usdc-logo.svg' />
                          <Typography fontWeight={600}>USDC</Typography>
                        </Box>
                        <Typography fontWeight={400}>{usdcBalance.toPrecision(4)}</Typography>
                      </Box>
                    </CardContent>
                    <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.05)' }} />
                  </>}
                  <MenuList
                    autoFocusItem={open}
                    id='composition-menu'
                    aria-labelledby='composition-button'
                    onKeyDown={handleListKeyDown}
                  >
                    <Option option='Links' setOpen={setOpen} setLinksOpen={setLinksOpen} />
                    <Option option='Studio' setOpen={setOpen} />
                    <Option option='Top Up' setOpen={setOpen} />
                    <Option option='Change Wallet' setOpen={setOpen} />
                    <Option option='Terms And Conditions' setOpen={setOpen} />
                  </MenuList>
                </Card>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
      <Popper
        open={linksOpen}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        placement='bottom-end'
        disablePortal
        sx={{
          transform: 'translate(-22px, 64px) !important',
        }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper>
              <ClickAwayListener onClickAway={handleLinksClose}>
                <Card variant='outlined'>
                  <MenuList
                    autoFocusItem={linksOpen}
                    id='composition-menu'
                    aria-labelledby='composition-button'
                    onKeyDown={handleListKeyDown}
                  >
                    <Option option='Twitter' setOpen={setOpen} setLinksOpen={setLinksOpen} />
                    <Option option='Github' setOpen={setOpen} setLinksOpen={setLinksOpen} />
                    <Option option='Discord' setOpen={setOpen} setLinksOpen={setLinksOpen} />
                    <Option option='Whitepaper' setOpen={setOpen} setLinksOpen={setLinksOpen} />
                  </MenuList>
                </Card>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  );
}
