import { FormControl, FormHelperText, InputBase, InputBaseProps } from '@mui/material';
import { useController, UseControllerProps } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';

type NumberControlProps = UseControllerProps & { mat: InputBaseProps };

const NumberControl = (props: NumberControlProps) => {
  const { field, fieldState } = useController(props);

  const showError = () => {
    if (fieldState.invalid) {
      return <FormHelperText>This Field is Required</FormHelperText>;
    }
  };

  return (
    <FormControl error={fieldState.invalid}>
      <NumericFormat
        value={field.value}
        onChange={field.onChange}
        customInput={InputBase}
        decimalScale={3}
        decimalSeparator={'.'}
        sx={props.mat.sx}
        required={props.rules && !!props.rules.required}
      />
      {showError()}
    </FormControl>
  );
};

export default NumberControl;
