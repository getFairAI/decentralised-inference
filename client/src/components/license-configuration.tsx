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

import { useWatch, Control, useController, FieldValues } from 'react-hook-form';
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
import { useMemo, useCallback } from 'react';
import { NumberFormatValues } from 'react-number-format';

const LicenseField = ({
  show,
  configControl,
  isAllowed,
}: {
  show: boolean;
  configControl: Control<FieldValues>;
  isAllowed: (val: NumberFormatValues) => boolean;
}) => {
  if (!show) {
    return null;
  } else {
    return (
      <Box display={'flex'} gap={'16px'}>
        <NumericControl
          name='licenseConfig.licenseFee'
          control={configControl}
          mat={{ label: 'License Fee', placeholder: 'License Fee', sx: { flexGrow: 1 } }}
          isAllowed={isAllowed}
        />
        <SelectControl
          name='licenseConfig.currency'
          control={configControl}
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
  configControl,
}: {
  configControl: Control<FieldValues>;
}) => {

  const { field: licenseField } = useController({ name: 'license', control: configControl });
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

  const inputValue = useWatch({ control: configControl, name: 'license' });
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

  const derivationsValue = useWatch({ control: configControl, name: 'licenseConfig.derivations' });

  const showRevenueShare = useMemo(
    () => derivationsValue === 'With-Revenue-Share',
    [derivationsValue],
  );

  const handleRenderInput = useCallback(
    (params: AutocompleteRenderInputParams) => (
      <TextField
        {...params}
        value={licenseField.value}
        onBlur={licenseField.onBlur}
        inputRef={licenseField.ref}
        label='License'
        placeholder='Choose A license or add your own'
      />
    ),
    [licenseField],
  );

  const handleAutocompleteChange = useCallback(
    (_event: unknown, newValue: string) =>
      licenseField.onChange(newValue),
    [licenseField ]
  );

  const handleOnClose = useCallback((_event: React.SyntheticEvent, reason: string) => {
    if (reason === 'remove-option') {
      licenseField.onChange('');
    }
  }, [ licenseField ]);

  return (
    <Box gap='16px' display={'flex'} flexDirection={'column'}>
      <Autocomplete
        freeSolo
        options={groupedLicenseOptions}
        groupBy={(option) => option.group}
        getOptionLabel={(option) => (option as unknown as { label: string }).label}
        renderInput={handleRenderInput}
        onInputChange={handleAutocompleteChange}
        onClose={handleOnClose}
      />
      <LicenseField show={showLicenseFee} configControl={configControl} isAllowed={isAllowed} />
      {showLicenseConfig && (
        <Box display={'flex'} flexDirection={'column'} gap={'16px'}>
          <Box display={'flex'} gap={'16px'}>
            <SelectControl
              name='licenseConfig.derivations'
              control={configControl}
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
                name='licenseConfig.revenueShare'
                control={configControl}
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
              name='licenseConfig.licenseFeeInterval'
              control={configControl}
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
            <LicenseField show={true} configControl={configControl} isAllowed={isAllowed} />
          </Box>
          <Box display={'flex'} width={'100%'} gap={'16px'}>
            <SelectControl
              name='licenseConfig.commercialUse'
              control={configControl}
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
              name='licenseConfig.expires'
              control={configControl}
              mat={{ label: 'Expires (Years)', sx: { width: '40%', flexGrow: 0 } }}
              isAllowed={isAllowed}
            />
          </Box>

          <Box display={'flex'} gap={'16px'} width={'100%'}>
            <TextControl
              name='licenseConfig.paymentAddress'
              control={configControl}
              mat={{ label: 'Payment Address', sx: { flexGrow: 1 } }}
            />
            <SelectControl
              name='licenseConfig.paymentMode'
              control={configControl}
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
