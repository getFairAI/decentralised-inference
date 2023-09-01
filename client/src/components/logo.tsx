import { Icon } from '@mui/material';

const Logo = () => {
  return <Icon sx={{ height: '100%', width: '100%', display: 'flex' }}>
    <img src={'./fair-protocol-outline.svg'} style={{ color: '#1F1F26' }}/>
  </Icon>;
};

export default Logo;