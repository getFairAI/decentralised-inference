import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FundDialog from './fund-dialog';
import useArweave from '@/context/arweave';

const options = [
  'Bundlr Settings',
  // 'Disconnect'
];

const ITEM_HEIGHT = 48;

export default function ProfileMenu() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [fundOpen, setFundOpen] = React.useState(false);
  const { disconnect } = useArweave();
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
      case 'Disconnect':
        await disconnect();
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
        <MoreVertIcon />
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
        {options.map((option) => (
          <MenuItem key={option} onClick={() => HandleOptionClick(option)}>
            {option}
          </MenuItem>
        ))}
      </Menu>
      <FundDialog open={fundOpen} setOpen={setFundOpen} />
    </div>
  );
}
