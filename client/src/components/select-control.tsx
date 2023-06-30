import { FormControl, FormHelperText, InputLabel, Select, SelectProps } from '@mui/material';
import { CSSProperties, ReactNode } from 'react';
import { useController, UseControllerProps } from 'react-hook-form';

type SelectControlProps = UseControllerProps & {
  mat?: SelectProps;
  style?: CSSProperties;
  helperText?: string;
};

const SelectControl = (props: SelectControlProps & { children: ReactNode }) => {
  const { field, fieldState } = useController(props);

  const showHelperText = () => {
    if (fieldState.invalid) {
      return <FormHelperText>This Field is Required</FormHelperText>;
    } else if (props.helperText) {
      return <FormHelperText>{props.helperText}</FormHelperText>;
    }
  };

  return (
    <>
      <FormControl fullWidth margin='none' error={fieldState.invalid}>
        <InputLabel>{props.mat?.placeholder || field.name}</InputLabel>
        <Select
          label={props.mat?.placeholder || field.name}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          {...props.mat}
        >
          {props.children}
        </Select>
        {showHelperText()}
      </FormControl>
    </>
  );
};

export default SelectControl;
