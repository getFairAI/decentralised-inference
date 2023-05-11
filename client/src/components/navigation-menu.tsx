import { Box, Button, Menu, MenuItem, SxProps, Typography, useTheme } from '@mui/material';
import { useState, MouseEvent } from 'react';
import { NavLink } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const NavigationMenu = ({ navStyles }: { navStyles: SxProps }) => {
  const theme = useTheme();
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <Box sx={{ display: { sm: 'flex', md: 'none' } }}>
      <Button
        onClick={handleOpenNavMenu}
        endIcon={<ExpandMoreIcon />}
        sx={{
          color: theme.palette.primary.contrastText,
          textTransform: 'none',
        }}
      >
        <Typography
          sx={{
            ...navStyles,
            display: { sm: 'flex', md: 'none' },
          }}
        >
          Navigate
        </Typography>
      </Button>

      <Menu
        id='menu-appbar'
        anchorEl={anchorElNav}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        open={Boolean(anchorElNav)}
        onClose={handleCloseNavMenu}
        sx={{
          display: { xs: 'block', md: 'none' },
        }}
      >
        <MenuItem key={'explore'} onClick={handleCloseNavMenu}>
          <Typography textAlign={'center'}>Explore</Typography>
        </MenuItem>
        <MenuItem key={'creators'} onClick={handleCloseNavMenu}>
          <Typography component={NavLink} to='/upload-creator'>
            Creators
          </Typography>
        </MenuItem>
        <MenuItem key={'curators'} onClick={handleCloseNavMenu}>
          <Typography component={NavLink} to='/upload-creator'>
            Curators
          </Typography>
        </MenuItem>
        <MenuItem key={'operators'} onClick={handleCloseNavMenu}>
          <Typography component={NavLink} to='/upload-creator'>
            Operators
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default NavigationMenu;
