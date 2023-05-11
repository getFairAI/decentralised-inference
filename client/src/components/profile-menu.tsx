import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useNavigate } from 'react-router-dom';
import { AppThemeContext } from '@/context/theme';
import { Tooltip, Typography } from '@mui/material';
import { GITHUB_LINK, WHITEPAPER_LINK, TWITTER_LINK } from '@/constants';
import MenuIcon from '@mui/icons-material/Menu';
import { WalletContext } from '@/context/wallet';
import { FundContext } from '@/context/fund';
import GetIcon from './get-icon';
import Box from '@mui/material/Box';

const bundlrSettings = 'Bundlr Settings';
const options = [bundlrSettings, 'Whitepaper', 'Github', 'Twitter', 'Disconnect'];
const disableableOptions = [bundlrSettings, 'My Models', 'Disconnect'];

const ITEM_HEIGHT = 56;

export default function ProfileMenu() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { toggleTheme } = React.useContext(AppThemeContext);
  const { disconnectWallet, currentAddress } = React.useContext(WalletContext);
  const { setOpen: setFundOpen } = React.useContext(FundContext);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
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
      case 'Twitter':
        window.open(TWITTER_LINK, '_blank');
        break;
      case 'Whitepaper':
        window.open(WHITEPAPER_LINK, '_blank');
        break;
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
                <MenuItem onClick={() => HandleOptionClick(option)} disabled>
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
