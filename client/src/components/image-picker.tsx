import { Button } from '@mui/material';
import { ChangeEvent } from 'react';
import { useController, UseControllerProps } from 'react-hook-form';

const ImagePicker = (props: UseControllerProps) => {
  const { field } = useController(props);

  const handleFileChosen = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      field.onChange(event.target.files && event.target.files[0]);
    }
  };

  return (
    <>
      <Button variant='text' component='label'>
        Choose Image
        <input type='file' accept='image/*' hidden onChange={handleFileChosen} />
      </Button>
    </>
  );
};

export default ImagePicker;
