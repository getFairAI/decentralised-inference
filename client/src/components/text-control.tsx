/*
 * Fair Protocol, open source decentralised inference marketplace for artificial intelligence.
 * Copyright (C) 2023 Fair Protocol
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 */

import { TextField, TextFieldProps } from '@mui/material';
import { CSSProperties } from 'react';
import { useController, UseControllerProps } from 'react-hook-form';

type TextControlProps = UseControllerProps & { mat: TextFieldProps; style?: CSSProperties };

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
