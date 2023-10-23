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

import { useWatch, Control } from 'react-hook-form';
import {
  Box,
  Autocomplete,
  TextField,
  MenuItem,
  AutocompleteRenderInputParams,
} from '@mui/material';
import NumericControl from './numeric-control';
import SelectControl from './select-control';
import TextControl from './text-control';
import { useState, useMemo, useCallback, RefObject, SyntheticEvent } from 'react';
import { NumberFormatValues } from 'react-number-format';
import { LicenseForm } from '@/interfaces/common';

const LicenseField = ({
  show,
  licenseControl,
  isAllowed,
}: {
  show: boolean;
  licenseControl: Control<LicenseForm, unknown>;
  isAllowed: (val: NumberFormatValues) => boolean;
}) => {
  if (!show) {
    return null;
  } else {
    return (
      <Box display={'flex'} gap={'16px'}>
        <NumericControl
          name='licenseFee'
          control={licenseControl}
          mat={{ label: 'License Fee', placeholder: 'License Fee', sx: { flexGrow: 1 } }}
          isAllowed={isAllowed}
        />
        <SelectControl
          name='currency'
          control={licenseControl}
          mat={{ label: 'Currency', placeholder: 'Currency' }}
          defaultValue={'$U'}
        >
          <MenuItem value='AR'>AR</MenuItem>
          <MenuItem value='$U'>$U</MenuItem>
        </SelectControl>
      </Box>
    );
  }
};

const getLicenseGroup = (idx: number) => {
  if (idx < 4) {
    return 'UDL';
  } else if (idx < 6) {
    return 'General';
  } else {
    return 'Stable Diffusion';
  }
};

const LicenseConfiguration = ({
  licenseRef,
  licenseControl,
}: {
  licenseRef: RefObject<HTMLInputElement>;
  licenseControl: Control<LicenseForm, unknown>;
}) => {
  const maxPercentage = 100;
  const maxNumberDigits = 4;
  const commercialOnetimeIdx = 2;
  const derivationOneTimeidx = 3;
  const customDerivationIdx = 4;
  const licenseOptions = [
    'Default',
    'Universal Data License (UDL) Default Public Use',
    'Universal Data License (UDL) Commercial - One Time Payment',
    'Universal Data License (UDL) Derivative Works - One Time Payment',
    'Universal Data License (UDL) Custom',
    'APACHE 2.0',
    'MIT',
    'CreativeML Open RAIL-M',
    'CreativeML Open RAIL++-M',
  ];
  const groupedLicenseOptions = licenseOptions.map((license, idx) => ({
    label: license,
    group: getLicenseGroup(idx),
  }));

  const [inputValue, setInputValue] = useState('');
  const showLicenseConfig = useMemo(
    () => inputValue === licenseOptions[customDerivationIdx],
    [inputValue],
  );
  const showLicenseFee = useMemo(
    () =>
      inputValue === licenseOptions[commercialOnetimeIdx] ||
      inputValue === licenseOptions[derivationOneTimeidx],
    [inputValue],
  );

  const isAllowed = useCallback(
    (val: NumberFormatValues) =>
      !val.floatValue || val?.floatValue?.toString().length <= maxNumberDigits,
    [],
  );

  const isAllowedRevenue = useCallback(
    (val: NumberFormatValues) => !val.floatValue || val?.floatValue <= maxPercentage,
    [],
  );

  const derivationsValue = useWatch({ control: licenseControl, name: 'derivations' });

  const showRevenueShare = useMemo(
    () => derivationsValue === 'With-Revenue-Share',
    [derivationsValue],
  );

  const handleAutocompleteChange = useCallback(
    (_event: SyntheticEvent<Element, Event>, newValue: string | null) =>
      setInputValue(newValue ?? ''),
    [setInputValue],
  );

  const handleRenderInput = useCallback(
    (params: AutocompleteRenderInputParams) => (
      <TextField
        {...params}
        inputRef={licenseRef}
        label='License'
        placeholder='Choose A license or add your own'
      />
    ),
    [licenseRef],
  );

  return (
    <Box gap='16px' display={'flex'} flexDirection={'column'}>
      <Autocomplete
        freeSolo
        options={groupedLicenseOptions}
        groupBy={(option) => option.group}
        getOptionLabel={(option) => (option as unknown as { label: string }).label}
        renderInput={handleRenderInput}
        onInputChange={handleAutocompleteChange}
      />
      <LicenseField show={showLicenseFee} licenseControl={licenseControl} isAllowed={isAllowed} />
      {showLicenseConfig && (
        <Box display={'flex'} flexDirection={'column'} gap={'16px'}>
          <Box display={'flex'} gap={'16px'}>
            <SelectControl
              name='derivations'
              control={licenseControl}
              mat={{ label: 'Derivations', placeholder: 'Derivations' }}
            >
              <MenuItem value=''>Default</MenuItem>
              <MenuItem value='With-Credit'>With Credit</MenuItem>
              <MenuItem value='With-Indication'>With Indication</MenuItem>
              <MenuItem value='With-License-Passthrough'>With License Passthrough</MenuItem>
              <MenuItem value='With-Revenue-Share'>With Revenue Share</MenuItem>
            </SelectControl>
            {showRevenueShare && (
              <NumericControl
                name='revenueShare'
                control={licenseControl}
                mat={{
                  label: 'Revenue Share (%)',
                  placeholder: 'Revenue Share',
                  sx: { width: '25%' },
                }}
                isAllowed={isAllowedRevenue}
              />
            )}
          </Box>

          <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} gap={'16px'}>
            <SelectControl
              name='licenseFeeInterval'
              control={licenseControl}
              mat={{
                label: 'License Fee Payment Interval',
                placeholder: 'License Fee Payment Interval',
                sx: { width: '80%' },
              }}
            >
              <MenuItem value=''>None</MenuItem>
              <MenuItem value='Daily'>Daily</MenuItem>
              <MenuItem value='Weekly'>Weekly</MenuItem>
              <MenuItem value='Monthly'>Monthly</MenuItem>
              <MenuItem value='Yearly'>Yearly</MenuItem>
              <MenuItem value='One-Time'>One-Time</MenuItem>
            </SelectControl>
            <LicenseField show={true} licenseControl={licenseControl} isAllowed={isAllowed} />
          </Box>
          <Box display={'flex'} width={'100%'} gap={'16px'}>
            <SelectControl
              name='commercialUse'
              control={licenseControl}
              mat={{
                label: 'Commercial Use',
                placeholder: 'Commercial Use',
                sx: { flexGrow: 1 },
              }}
            >
              <MenuItem value=''>Default</MenuItem>
              <MenuItem value='Allowed'>Allowed</MenuItem>
              <MenuItem value='Allowed-With-Credit'>Allowed With Credit</MenuItem>
            </SelectControl>
            <NumericControl
              name='expires'
              control={licenseControl}
              mat={{ label: 'Expires (Years)', sx: { width: '40%', flexGrow: 0 } }}
              isAllowed={isAllowed}
            />
          </Box>

          <Box display={'flex'} gap={'16px'} width={'100%'}>
            <TextControl
              name='paymentAddress'
              control={licenseControl}
              mat={{ label: 'Payment Address', sx: { flexGrow: 1 } }}
            />
            <SelectControl
              name='paymentMode'
              control={licenseControl}
              mat={{
                label: 'Payment Mode',
                placeholder: 'Payment Mode',
                sx: { width: '30%', flexGrow: 0 },
              }}
            >
              <MenuItem value=''>Default</MenuItem>
              <MenuItem value='Random-Distribution'>Random Distribution</MenuItem>
              <MenuItem value='Global-Distribution'>Global Distribution</MenuItem>
            </SelectControl>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default LicenseConfiguration;
