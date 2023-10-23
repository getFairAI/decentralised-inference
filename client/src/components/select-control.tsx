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

import { FormControl, FormHelperText, InputLabel, Select, SelectProps } from '@mui/material';
import { CSSProperties, ReactNode } from 'react';
import { useController, UseControllerProps } from 'react-hook-form';

type SelectControlProps = UseControllerProps & {
  mat?: SelectProps;
  style?: CSSProperties;
  helperText?: string;
  disabled?: boolean;
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
      <FormControl fullWidth margin='none' error={fieldState.invalid} sx={props.mat?.sx}>
        <InputLabel>{props.mat?.placeholder || field.name}</InputLabel>
        <Select
          label={props.mat?.placeholder || field.name}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          {...props.mat}
          sx={{}}
          disabled={props.disabled}
        >
          {props.children}
        </Select>
        {showHelperText()}
      </FormControl>
    </>
  );
};

export default SelectControl;
