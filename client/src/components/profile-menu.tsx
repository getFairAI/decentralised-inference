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
import { useNavigate } from 'react-router-dom';
import { AppThemeContext } from '@/context/theme';
import { Tooltip, Typography } from '@mui/material';
import { GITHUB_LINK, WHITEPAPER_LINK, TWITTER_LINK, DISCORD_LINK } from '@/constants';
import MenuIcon from '@mui/icons-material/Menu';
import { WalletContext } from '@/context/wallet';
import { FundContext } from '@/context/fund';
import GetIcon from './get-icon';
import Box from '@mui/material/Box';
import { ChooseWalletContext } from '@/context/choose-wallet';
import { useState, useContext, MouseEvent } from 'react';

const bundlrSettings = 'Bundlr Settings';
const changeWallet = 'Change Wallet';
const options = [
  bundlrSettings,
  'Whitepaper',
  'Github',
  'Discord',
  'Twitter',
  changeWallet,
  'Disconnect',
];
const disableableOptions = [bundlrSettings, 'My Models', changeWallet, 'Disconnect'];

const ITEM_HEIGHT = 64;

export default function ProfileMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { toggleTheme } = useContext(AppThemeContext);
  const { disconnectWallet, currentAddress } = useContext(WalletContext);
  const { setOpen: setFundOpen } = useContext(FundContext);
  const { setOpen: setChooseWalletOpen } = useContext(ChooseWalletContext);

  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const HandleOptionClick = async (option: string) => {
    switch (option) {
      case bundlrSettings:
        setFundOpen(true);
        setAnchorEl(null);
        break;
      case 'My Models':
        setAnchorEl(null);
        navigate('/history');
        break;
      case 'Toggle Theme':
        toggleTheme();
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
      default:
        setAnchorEl(null);
        return;
    }
  };

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
        <MenuIcon color='action' />
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
            maxHeight: ITEM_HEIGHT * 4.5,
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
            <MenuItem key={option} onClick={() => HandleOptionClick(option)}>
              <GetIcon input={option}></GetIcon>
              <Box sx={{ marginLeft: '10px' }}>
                <Typography>{option}</Typography>
              </Box>
            </MenuItem>
          ),
        )}
      </Menu>
    </div>
  );
}
