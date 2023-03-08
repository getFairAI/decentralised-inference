import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import useArweave from '../context/arweave';
import { Link } from 'react-router-dom';
import ProfileMenu from './profile-menu';
import { Tooltip } from '@mui/material';

const Navbar = () => {
  const { connect, addresses, isConnected } = useArweave();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position='fixed'>
        <Toolbar>
          {/* <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton> */}
          <Link to='/'>
            <Typography
              variant='h4'
              component='div'
              sx={{
                mr: 2,
                display: { md: 'flex' },
                color: 'inherit',
              }}
            >
              Fair protocol
            </Typography>
          </Link>
          <Box sx={{ flexGrow: 1, display: { md: 'flex', justifyContent: 'flex-start' } }}>
            <Link to='/explore'>
              <Button variant='text' color='secondary'>
                Explore
              </Button>
            </Link>
            <Link to='/upload'>
              <Button variant='text' color='secondary'>
                Create
              </Button>
            </Link>
            <Link to='/operators'>
              <Button variant='text' color='secondary'>
                Operators
              </Button>
            </Link>
          </Box>
          <Box sx={{ flexGrow: 0 }}>
            {isConnected ? (
              <Box display={'flex'} alignItems={'center'}>
                <Tooltip title={addresses[0]} placement={'left-start'}>
                  <Typography>
                    {addresses[0].slice(0, 10)}...{addresses[0].slice(-3)}
                  </Typography>
                </Tooltip>
                <ProfileMenu />
              </Box>
            ) : (
              <Button color='inherit' onClick={connect}>
                Connect
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navbar;
