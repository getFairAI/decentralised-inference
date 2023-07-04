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
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Tooltip, Typography } from '@mui/material';
import { GITHUB_LINK, WHITEPAPER_LINK, TWITTER_LINK, DISCORD_LINK, STUDIO_LINK } from '@/constants';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { WalletContext } from '@/context/wallet';
import GetIcon from './get-icon';
import Box from '@mui/material/Box';
import { ChooseWalletContext } from '@/context/choose-wallet';
import { useState, useContext, MouseEvent, useCallback, Dispatch } from 'react';
import { SwapContext } from '@/context/swap';

const changeWallet = 'Change Wallet';
const options = [
  'Studio',
  'U Swap',
  'Whitepaper',
  'Github',
  'Discord',
  'Twitter',
  changeWallet,
  'Disconnect',
];
const disableableOptions = [changeWallet, 'Disconnect'];

const ITEM_HEIGHT = 64;

const Option = ({
  option,
  setAnchorEl,
}: {
  option: string;
  setAnchorEl: Dispatch<React.SetStateAction<HTMLElement | null>>;
}) => {
  const { disconnectWallet } = useContext(WalletContext);
  const { setOpen: setChooseWalletOpen } = useContext(ChooseWalletContext);
  const { setOpen: setSwapOpen } = useContext(SwapContext);

  const handleOptionClick = useCallback(() => {
    (async () => {
      switch (option) {
        case 'Studio':
          window.open(STUDIO_LINK, '_blank');
          break;
        case 'Github':
          window.open(GITHUB_LINK, '_blank');
          break;
        case 'Discord':
          window.open(DISCORD_LINK, '_blank');
          break;
        case 'Twitter':
          window.open(TWITTER_LINK, '_blank');
          break;
        case 'Whitepaper':
          window.open(WHITEPAPER_LINK, '_blank');
          break;
        case changeWallet:
          setAnchorEl(null);
          setChooseWalletOpen(true);
          return;
        case 'Disconnect':
          await disconnectWallet();
          setAnchorEl(null);
          return;
        case 'U Swap':
          setAnchorEl(null);
          setSwapOpen(true);
          return;
        default:
          setAnchorEl(null);
          return;
      }
    })();
  }, [option]);

  return (
    <MenuItem onClick={handleOptionClick}>
      <GetIcon input={option}></GetIcon>
      <Box sx={{ marginLeft: '10px' }}>
        <Typography>{option}</Typography>
      </Box>
    </MenuItem>
  );
};

export default function ProfileMenu() {
  const itemHeight = 4.5;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { currentAddress } = useContext(WalletContext);

  const handleClick = useCallback((event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return (
    <div>
      <IconButton
        aria-label='more'
        id='long-button'
        aria-controls={open ? 'long-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup='true'
        onClick={handleClick}
      >
        {open ? <CloseIcon color='action' /> : <MenuIcon color='action' />}
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
            maxHeight: ITEM_HEIGHT * itemHeight,
            width: '20ch',
          },
        }}
      >
        {options.map((option) =>
          disableableOptions.includes(option) && !currentAddress ? (
            <Tooltip title='This Feature requires a wallet to be connected' key={option}>
              <span>
                <MenuItem disabled>
                  <Typography>{option}</Typography>
                </MenuItem>
              </span>
            </Tooltip>
          ) : (
            <Option option={option} key={option} setAnchorEl={setAnchorEl} />
          ),
        )}
      </Menu>
    </div>
  );
}
