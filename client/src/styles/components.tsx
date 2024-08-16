import { ButtonProps, styled } from '@mui/material';
import { MaterialDesignContent } from 'notistack';

export const LoadingContainer = styled('div')(({ theme }) => ({
  '&.dot-pulse': {
    position: 'relative',
    left: '-9999px',
    width: '10px',
    height: '10px',
    borderRadius: '5px',
    backgroundColor: theme.palette.common.white,
    color: theme.palette.common.white,
    boxShadow: '9999px 0 0 -5px',
    animation: 'dot-pulse 1.5s infinite linear',
    animationDelay: '0.25s',
  },
  '&.dot-pulse::before': {
    content: '""',
    display: 'inline-block',
    position: 'absolute',
    top: 0,
    width: '10px',
    height: '10px',
    borderRadius: '5px',
    backgroundColor: theme.palette.common.white,
    color: theme.palette.common.white,
    boxShadow: '9984px 0 0 -5px',
    animation: 'dot-pulse-before 1.5s infinite linear',
    animationDelay: '0s',
  },
  '&.dot-pulse::after': {
    content: '""',
    display: 'inline-block',
    position: 'absolute',
    top: 0,
    width: '10px',
    height: '10px',
    borderRadius: '5px',
    backgroundColor: theme.palette.common.white,
    color: theme.palette.common.white,
    boxShadow: '10014px 0 0 -5px',
    animation: 'dot-pulse-after 1.5s infinite linear',
    animationDelay: '0.5s',
  },
}));

export const ArbitrumLoadingContainer = styled('div')(() => ({
  '&.dot-pulse': {
    position: 'relative',
    left: '-9999px',
    width: '10px',
    height: '10px',
    borderRadius: '5px',
    backgroundColor: '#9ecced',
    color: '#9ecced',
    boxShadow: '9999px 0 0 -5px',
    animation: 'dot-pulse 1.5s infinite linear',
    animationDelay: '0.25s',
  },
  '&.dot-pulse::before': {
    content: '""',
    display: 'inline-block',
    position: 'absolute',
    top: 0,
    width: '10px',
    height: '10px',
    borderRadius: '5px',
    backgroundColor: '#9ecced',
    color: '#9ecced',
    boxShadow: '9984px 0 0 -5px',
    animation: 'dot-pulse-before 1.5s infinite linear',
    animationDelay: '0s',
  },
  '&.dot-pulse::after': {
    content: '""',
    display: 'inline-block',
    position: 'absolute',
    top: 0,
    width: '10px',
    height: '10px',
    borderRadius: '5px',
    backgroundColor: '#9ecced',
    color: '#9ecced',
    boxShadow: '10014px 0 0 -5px',
    animation: 'dot-pulse-after 1.5s infinite linear',
    animationDelay: '0.5s',
  },
}));

export const StyledMaterialDesignContent = styled(MaterialDesignContent)(({ theme }) => ({
  '&.notistack-MuiContent-info': {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.primary.main,
  },
  '&.notistack-MuiContent-success': {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.success.main,
  },
  '&.notistack-MuiContent-error': {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.error.main,
  },
}));

export const StyledMuiButton = styled('button')<ButtonProps>(({ theme }) => ({
  // base button design
  borderRadius: '30px',
  height: 'min-content',
  minHeight: '42px',
  padding: '0px 18px',
  fontWeight: 600,
  scale: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: '0.2s all',

  '&:active': {
    scale: '0.98',
  },

  // style for each variant
  '&.primary': {
    backgroundColor: '#3aaaaa',
    color: '#ffffff',

    '&:hover': {
      backgroundColor: '#34baba',
    },
    '&:focus': {
      backgroundColor: '#34baba',
    },
  },

  '&.secondary': {
    backgroundColor: theme.palette.backdropContrast.main,
    color: '#ffffff',

    '&:hover': {
      backgroundColor: 'rgb(100,140,140)',
    },
    '&:focus': {
      backgroundColor: 'rgb(100,140,140)',
    },
  },

  '&.outlined-primary': {
    color: '#3aaaaa',
    backgroundColor: 'transparent',
    border: '2px solid #3aaaaa',

    '&:hover': {
      backgroundColor: '#3aaaaa',
      color: '#ffffff',
    },

    '&:focus': {
      backgroundColor: '#3aaaaa',
      color: '#ffffff',
    },
  },

  '&.outlined-secondary': {
    color: theme.palette.backdropContrast.main,
    backgroundColor: 'transparent',
    border: '2px solid rgb(70,70,70)',

    '&:hover': {
      backgroundColor: theme.palette.backdropContrast.main,
      color: '#ffffff',
    },

    '&:focus': {
      backgroundColor: theme.palette.backdropContrast.main,
      color: '#ffffff',
    },
  },

  '&.bg-white': {
    backgroundColor: '#ffffff',
  },

  '&.bigger': {
    minHeight: '54px',
    padding: '0px 25px',
    borderRadius: '30px',
    fontSize: '110%',
  },

  '&.mini': {
    minHeight: 'fit-content',
    borderRadius: '20px',
    padding: '2px 10px',
  },

  '&.fully-rounded': {
    minHeight: 'fit-content',
    borderRadius: '50%',
    width: '45px',
    height: '45px',
    padding: '0px',

    '&.smaller': {
      width: '34px',
      height: '34px',
    },

    '&.mini': {
      width: '30px',
      height: '30px',
    },
  },

  '&.gradient-bg': {
    background: 'linear-gradient(220deg, #00ddae, #b860d9, #3aaaaa)',
    backgroundSize: '400% 400%',
    animation: '10s backgroundGradientAnimation ease infinite',
    boxShadow: '0px 0px 8px rgba(0,0,0,0.05)',
    transition: '0.3s all',

    '&:hover': {
      boxShadow: '0px 0px 8px rgba(0,0,0,0.2)',
      transform: 'scale(1.02)',
    },
  },

  '&:disabled': {
    opacity: '0.5 !important',
    pointerEvents: 'none',
  },
}));
