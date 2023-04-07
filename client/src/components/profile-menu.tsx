import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FundDialog from './fund-dialog';
import { useNavigate } from 'react-router-dom';
import { AppThemeContext } from '@/context/theme';
import { Tooltip, Typography } from '@mui/material';
import { GITHUB_LINK, WHITEPAPER_LINK } from '@/constants';

const options = [
  'Bundlr Settings',
  'My Models',
  'Toggle Theme',
  'Github',
  'Whitepaper'
  // 'Disconnect'
];

const ITEM_HEIGHT = 48;

export default function ProfileMenu() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [fundOpen, setFundOpen] = React.useState(false);
  const navigate = useNavigate();
  const { toggleTheme } = React.useContext(AppThemeContext);

  /* const {  } = React.useContext(WalletContext); */

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const HandleOptionClick = async (option: string) => {
    switch (option) {
      case 'Bundlr Settings':
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
      case 'Whitepaper':
        window.open(WHITEPAPER_LINK, '_blank');
        break;
      /* case 'Disconnect':
        await disconnect();
        setAnchorEl(null);
        return; */
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
        <img src='/icon-empty-wallet.svg' />
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
          option === 'Toggle Theme' ? (
            <MenuItem key={option} onClick={() => HandleOptionClick(option)} disabled>
              <Tooltip title='This Feature is not Available at the moment'>
                <Typography>{option}</Typography>
              </Tooltip>
            </MenuItem>
          ) : (
            <MenuItem key={option} onClick={() => HandleOptionClick(option)}>
              <Typography>{option}</Typography>
            </MenuItem>
          ),
        )}
      </Menu>
      <FundDialog open={fundOpen} setOpen={setFundOpen} />
    </div>
  );
}
