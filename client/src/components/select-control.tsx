import { FormControl, FormHelperText, InputLabel, Select, SelectProps } from '@mui/material';
import { CSSProperties, ReactElement } from 'react';
import { useController, UseControllerProps } from 'react-hook-form';

type SelectControlProps = UseControllerProps & { mat?: SelectProps; style?: CSSProperties };

const SelectControl = (props: SelectControlProps & { children: ReactElement[] }) => {
  const { field, fieldState } = useController(props);

  const showError = () => {
    if (fieldState.invalid) {
      return <FormHelperText>This Field is Required</FormHelperText>;
    }
  };

  return (
    <>
      <FormControl fullWidth margin='normal' error={fieldState.invalid}>
        <InputLabel>{field.name}</InputLabel>
        <Select
          label={field.name}
          value={field.value}
          defaultValue={props.children[0].props.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          {...props.mat}
        >
          {props.children}
        </Select>
        {showError()}
      </FormControl>
    </>
  );
};

export default SelectControl;
