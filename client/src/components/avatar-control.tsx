import { Box, Button, Typography, useTheme } from '@mui/material';
import { ChangeEvent, useEffect, useState } from 'react';
import { Control, useController, UseControllerProps } from 'react-hook-form';

const AvatarControl = (props: UseControllerProps & { control: Control }) => {
  const { field } = useController(props);
  const [src, setSrc] = useState('');
  const theme = useTheme();

  const handleFileLoad = (reader: FileReader) => {
    return () => {
      setSrc(reader.result as string);
      reader.removeEventListener('load', handleFileLoad(reader));
    };
  };

  const handleFileChosen = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files && event.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', handleFileLoad(reader));
      reader.readAsDataURL(file);
      field.onChange(file);
    } else {
      setSrc('');
      field.onChange(undefined);
    }
  };

  useEffect(() => {
    if (!field.value) {
      setSrc('');
    }
  }, [field.value]);

  return (
    <Button
      sx={{
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(to bottom, #000000 10%, rgba(71, 71, 71, 0) 100%)'
            : theme.palette.secondary.main,
        borderRadius: '23px',
        backgroundPosition: 'center',
        height: '100%',
        width: '100%',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        '&:hover': {
          background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(to bottom, #000000 10%, rgba(71, 71, 71, 0) 100%)'
            : theme.palette.secondary.main,
          filter: 'drop-shadow(2px 4px 6px black)',
        }
      }}
      component='label'
    >
      {src && (
        <img
          src={src}
          width={'100%'}
          height={'100%'}
          style={{ borderTopLeftRadius: '23px', borderTopRightRadius: '23px' }}
        />
      )}
      <input type='file' accept='image/*' hidden onChange={handleFileChosen} />

      <Box
        sx={{
          background: 'rgba(253, 253, 253, 0.3)',
          backdropFilter: 'blur(2px)',
          width: '100%',
          borderBottomLeftRadius: '23px',
          borderBottomRightRadius: '23px',
          padding: '16px 0px',
        }}
      >
        <Typography sx={{ color: 'rgba(253, 253, 253, 1)' }} textAlign={'center'}>
          Upload Image
        </Typography>
      </Box>
    </Button>
  );
};

export default AvatarControl;
