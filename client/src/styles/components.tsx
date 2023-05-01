import { styled } from '@mui/material';
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

export const StyledMaterialDesignContent = styled(MaterialDesignContent)(({ theme }) => ({
  '&.notistack-MuiContent-success': {
    borderRadius: '23px',
    backgroundColor: theme.palette.success.main,
  },
  '&.notistack-MuiContent-error': {
    borderRadius: '23px',
    backgroundColor: theme.palette.error.main,
  },
}));
