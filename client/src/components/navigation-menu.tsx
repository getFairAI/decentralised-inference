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

import { Box, Button, Menu, MenuItem, SxProps, Typography, useTheme } from '@mui/material';
import { useState, MouseEvent, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const NavigationMenu = ({ navStyles }: { navStyles: SxProps }) => {
  const theme = useTheme();
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);

  const handleOpenNavMenu = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      setAnchorElNav(event.currentTarget);
    },
    [setAnchorElNav],
  );

  const handleCloseNavMenu = useCallback(() => {
    setAnchorElNav(null);
  }, [setAnchorElNav]);

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
          <Typography component={NavLink} to='/'>
            Explore
          </Typography>
        </MenuItem>
        <MenuItem key={'creators'} onClick={handleCloseNavMenu}>
          <Typography component={NavLink} to='/upload-creator'>
            Creators
          </Typography>
        </MenuItem>
        <MenuItem key={'curators'} onClick={handleCloseNavMenu}>
          <Typography component={NavLink} to='/upload'>
            Curators
          </Typography>
        </MenuItem>
        <MenuItem key={'operators'} onClick={handleCloseNavMenu}>
          <Typography component={NavLink} to='/operators'>
            Operators
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default NavigationMenu;
