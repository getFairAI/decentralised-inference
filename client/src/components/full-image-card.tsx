import {
  Card,
  CardActionArea,
  CardActionAreaProps,
  CardContent,
  CardContentProps,
  CardMedia,
  CardMediaProps,
  CardProps,
} from '@mui/material';
import { styled } from '@mui/system';

export const FiCard = styled((props: CardProps) => {
  return <Card {...props} />;
})(( { width, height }: { width?: string, height?: string }) => ({
  borderRadius: '23px',
  position: 'relative',
  width: width ?? '317px',
  height: height ?? '352px',
  boxShadow: 'none',
  '&:hover': {
    boxShadow:
      '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)',
    opacity: 0.8,
  },
}));

export const FiCardActionArea = styled((props: CardActionAreaProps) => {
  return <CardActionArea {...props} />;
})(() => ({
  position: 'relative',
  width: '317px',
  height: '352px',
}));

export const FiCardContent = styled((props: CardContentProps) => {
  return <CardContent {...props} />;
})(() => ({
  position: 'relative',
  width: '301px',
  height: '74.46px',
  top: '110px',
}));

export const FicardMedia = styled((props: CardMediaProps) => {
  return <CardMedia {...props} />;
})(() => ({
  position: 'absolute',
  top: 0,
  right: 0,
  height: '100%',
  width: '100%',
}));
