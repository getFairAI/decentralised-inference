import { Avatar } from '@mui/material';
import { useEffect, useState } from 'react';
import { Control, useController, UseControllerProps } from 'react-hook-form';

const AvatarControl = (props: UseControllerProps & { control: Control }) => {
  const { field } = useController(props);
  const [src, setSrc] = useState('');

  const handleFileLoad = (reader: FileReader) => {
    return () => {
      setSrc(reader.result as string);
      reader.removeEventListener('load', handleFileLoad(reader));
    };
  };

  useEffect(() => {
    if ( field.value instanceof File) {
      const file = field.value;
      const reader = new FileReader();
      reader.addEventListener('load', handleFileLoad(reader));
      reader.readAsDataURL(file);
    } else {
      // reset
      setSrc('');
    }
  }, [field.value]);

  return <Avatar sx={{ width: 100, height: 100 }} src={src} variant='circular' />;
};

export default AvatarControl;
