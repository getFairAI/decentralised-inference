import { Avatar } from '@mui/material';
import { useEffect, useState } from 'react';
import { Control, useController, UseControllerProps } from 'react-hook-form';

const AvatarControl = (props: UseControllerProps & { control: Control }) => {
  const { field } = useController(props);
  const [src, setSrc] = useState('');

  useEffect(() => {
    setSrc(`${field.value}?w=90&h=90&fit=crop&auto=format`);
  }, [field.value]);

  return <Avatar sx={{ width: 100, height: 100 }} src={src} variant='circular' />;
};

export default AvatarControl;
