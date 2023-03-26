import { Card, CardActionArea, CardActionAreaProps, CardContent, CardContentProps, CardMedia, CardMediaProps, CardProps } from '@mui/material';
import { styled } from '@mui/system';

export const FiCard = styled((props: CardProps) => {
  return <Card {...props} />;
})(() => ({
  borderRadius: '23px',
  position: 'relative',
  width: '317px',
  height: '352px'
}));

export const FiCardActionArea = styled((props: CardActionAreaProps) => {
  return <CardActionArea {...props} />;
})(() => ({
  position: 'relative',
  width: '317px',
  height: '352px'
}));

export const FiCardContent = styled((props: CardContentProps) => {
  return <CardContent {...props} />;
})(() => ({
  position: 'relative',
  width: '301px',
  height: '74.46px',
  top: '110px'
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