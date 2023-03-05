import { TextField, TextFieldProps } from '@mui/material';
import { CSSProperties } from 'react';
import { useController, UseControllerProps } from 'react-hook-form';

type TextControlProps = UseControllerProps & { mat: TextFieldProps, style: CSSProperties};

const TextControl = (props: TextControlProps) => {
  const { field, fieldState } = useController(props);

  const showError = () => {
    if (fieldState.invalid) {
      return 'This Field is Required';
    } else {
      return '';
    }
  };
  return (
    <TextField 
      onChange={field.onChange} // send value to hook form 
      onBlur={field.onBlur} // notify when input is touched/blur
      value={field.value}
      name={field.name} // send down the input name
      inputRef={field.ref} // send input ref, so we can focus on input when error appear
      label={field.name}
      {...props.mat}
      style={props.style}
      error={fieldState.invalid}
      helperText={showError()}
    />
  );
};

export default TextControl;