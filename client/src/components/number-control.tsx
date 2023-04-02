import { InputBase, InputBaseProps } from '@mui/material';
import { useController, UseControllerProps } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';

type NumberControlProps = UseControllerProps & { mat: InputBaseProps };

const NumberControl = (props: NumberControlProps) => {
  const { field } = useController(props);

  return (
    <NumericFormat
      value={field.value}
      onChange={field.onChange}
      customInput={InputBase}
      decimalScale={3}
      decimalSeparator={'.'}
      sx={props.mat.sx}
    />
  );
};

export default NumberControl;
