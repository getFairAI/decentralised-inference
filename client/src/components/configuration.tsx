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

import { U_LOGO_SRC } from '@/constants';
import { displayShortTxOrAddr, findTag, getUPriceUSD } from '@/utils/common';
import {
  Box,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Slider,
  TextField,
  Typography,
  useTheme,
  Radio,
  RadioGroup,
  Button,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputAdornment,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { parseUBalance } from '@/utils/u';
import { enqueueSnackbar } from 'notistack';
import { NumberFormatValues, NumericFormat } from 'react-number-format';
import LicenseConfiguration from './license-configuration';
import {
  Control,
  FieldValues,
  UseFormReset,
  UseFormSetValue,
  useController,
} from 'react-hook-form';
import { IConfiguration } from '@/interfaces/common';

const CustomTag = ({
  name,
  value,
  handleRemove,
}: {
  name: string;
  value: string;
  handleRemove: (name: string, value: string) => void;
}) => {
  const handleClick = useCallback(() => handleRemove(name, value), [name, value]);

  return (
    <Box display={'flex'} justifyContent={'space-between'}>
      <Box display={'flex'} overflow={'auto'}>
        <Typography sx={{ fontWeight: 700 }}>{name}</Typography>
        <Typography sx={{ fontWeight: 700 }}>:</Typography>
        <Typography sx={{ marginLeft: '8px' }}>{value}</Typography>
      </Box>
      <IconButton onClick={handleClick} className='plausible-event-name=Custom+Tag+Removed'>
        <RemoveIcon />
      </IconButton>
    </Box>
  );
};

const StableDiffusionConfigurations = ({
  control,
}: {
  control: Control<IConfiguration, unknown>;
}) => {
  const nDigits = 4;
  const defaultImages = 4;
  const portraitWidth = 960;
  const portraitHeight = 1280;
  const landscapeWidth = 1280;
  const landscapeHeight = 720;
  const squareWidth = 1024;
  const { state } = useLocation();

  const [cost, setCost] = useState(0);
  const [usdCost, setUsdCost] = useState(0);
  const [currentArPrice, setCurrentArPrice] = useState(0);
  const [showCustomAspectRatio, setShowCustomAspectRatio] = useState(false);

  const showOutputConfiguration = useMemo(
    () => findTag(state.fullState, 'outputConfiguration') === 'stable-diffusion',
    [state],
  );

  const { field: negativePromptField } = useController({ control, name: 'negativePrompt' });
  const { field: nImagesField } = useController({ control, name: 'nImages' });
  const { field: widthField } = useController({ control, name: 'width' });
  const { field: heightField } = useController({ control, name: 'height' });

  useEffect(() => {
    (async () => {
      const arPrice = await getUPriceUSD();
      setCurrentArPrice(arPrice);
    })();
  }, [getUPriceUSD, setCurrentArPrice]);

  useEffect(() => {
    const fee = state?.fee ? parseUBalance(state?.fee) : 0;
    setCost(fee * defaultImages);
    setUsdCost(currentArPrice * fee * defaultImages);
  }, [currentArPrice, state]);

  const handleSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      nImagesField.onChange(_event);
      const fee = state?.fee ? parseUBalance(state?.fee) : 0;
      setCost(fee * (newValue as number));
      setUsdCost(currentArPrice * fee * (newValue as number));
    },
    [nImagesField, state, currentArPrice, setCost, setUsdCost, parseUBalance],
  );

  const handleAspectRatioChange = useCallback(
    (event: SelectChangeEvent) => {
      switch (event.target.value) {
        case 'Portrait':
          setShowCustomAspectRatio(false);
          widthField.onChange(portraitWidth);
          heightField.onChange(portraitHeight);
          break;
        case 'Landscape':
          setShowCustomAspectRatio(false);
          widthField.onChange(landscapeWidth);
          heightField.onChange(landscapeHeight);
          break;
        case 'Square':
          setShowCustomAspectRatio(false);
          widthField.onChange(squareWidth);
          heightField.onChange(squareWidth);
          break;
        default:
          setShowCustomAspectRatio(false);
          widthField.onChange(0);
          heightField.onChange(0);
          break;
      }
    },
    [nImagesField, state, currentArPrice, setCost, setUsdCost, parseUBalance],
  );

  if (!showOutputConfiguration) {
    return null;
  }

  return (
    <>
      <Box>
        <Divider textAlign='left' variant='fullWidth'>
          <Typography variant='h4'>Stable Diffusion Configurations</Typography>
        </Divider>
      </Box>
      <TextField
        label={'Negative Prompt'}
        onChange={negativePromptField.onChange} // send value to hook form
        onBlur={negativePromptField.onBlur} // notify when input is touched/blur
        value={negativePromptField.value}
        inputRef={negativePromptField.ref} // send input ref, so we can focus on input when error appear
        multiline
        minRows={3}
        maxRows={5}
        fullWidth
        className='plausible-event-name=Negative+Prompt+Changed'
      />
      <Box display={'flex'} flexDirection={'column'} gap={'16px'}>
        <FormControl fullWidth margin='none'>
          <InputLabel>{'Aspect Ratio'}</InputLabel>
          <Select label={'Aspect Ratio'} onChange={handleAspectRatioChange} defaultValue='Default'>
            <MenuItem value={'Default'} className='plausible-event-name=Aspect+Ratio+Changed plausibe-event-value=Default'>{'Default'}</MenuItem>
            <MenuItem value={'Portrait'} className='plausible-event-name=Aspect+Ratio+Changed plausibe-event-value=Portrait'>{'Portrait (3:4)'}</MenuItem>
            <MenuItem value={'Landscape'} className='plausible-event-name=Aspect+Ratio+Changed plausibe-event-value=Landscape'>{'Landscape (16:9)'}</MenuItem>
            <MenuItem value={'Square'} className='plausible-event-name=Aspect+Ratio+Changed plausibe-event-value=Square'>{'Square (1:1)'}</MenuItem>
          </Select>
        </FormControl>
        {showCustomAspectRatio && (
          <Box display={'flex'} gap={'8px'}>
            <NumericFormat
              label={'Width'}
              customInput={TextField}
              allowNegative={false}
              decimalScale={0}
              onChange={widthField.onChange} // send value to hook form
              onBlur={widthField.onBlur} // notify when input is touched/blur
              value={widthField.value}
              inputRef={widthField.ref} // send input ref, so we can focus on input when error appear
              defaultValue={0}
              maxLength={4}
              type='text'
              InputProps={{
                endAdornment: <InputAdornment position='end'>px</InputAdornment>,
              }}
            />
            <NumericFormat
              label={'Height'}
              customInput={TextField}
              allowNegative={false}
              decimalScale={0}
              onChange={heightField.onChange} // send value to hook form
              onBlur={heightField.onBlur} // notify when input is touched/blur
              value={heightField.value}
              inputRef={heightField.ref} // send input ref, so we can focus on input when error appear
              defaultValue={0}
              maxLength={4}
              type='text'
              InputProps={{
                endAdornment: <InputAdornment position='end'>px</InputAdornment>,
              }}
            />
          </Box>
        )}
      </Box>
      <Box
        sx={{
          marginLeft: '16px',
        }}
      >
        <Typography sx={{ marginBottom: '16px' }} variant='caption'>
          Number of Images To Generate
        </Typography>
        <Slider
          value={nImagesField.value}
          onChange={handleSliderChange}
          defaultValue={4}
          disabled={false}
          marks
          max={10}
          step={1}
          min={1}
          valueLabelDisplay='auto'
          className='plausible-event-name=Number+of+Images+Changed'
        />
        <Box display={'flex'} gap={'8px'}>
          <Typography variant='caption'>
            Estimated Total Cost: {cost.toPrecision(nDigits)}
          </Typography>
          <img width='17px' height='17px' src={U_LOGO_SRC} />
        </Box>
        <Box display={'flex'}>
          <Typography sx={{ marginBottom: '16px' }} variant='caption'>
            Estimated Total USD Cost: ${usdCost.toPrecision(nDigits)}
          </Typography>
        </Box>
      </Box>
    </>
  );
};

const Configuration = ({
  control,
  setConfigValue,
  reset,
  handleClose,
}: {
  control: Control<IConfiguration, unknown>;
  setConfigValue: UseFormSetValue<IConfiguration>;
  reset: UseFormReset<IConfiguration>;
  handleClose: () => void;
}) => {
  const maxPercentage = 100;
  const theme = useTheme();
  const { state } = useLocation();
  const { address } = useParams();
  const [customTags, setCustomTags] = useState<{ name: string; value: string }[]>([]);
  const nameRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLTextAreaElement>(null);

  const {
    field: assetNamesField,
    fieldState: { isDirty: isAssetNamesDirty },
  } = useController({ control, name: 'assetNames' });
  const { field: generateAssetsField } = useController({ control, name: 'generateAssets' });
  const { field: descriptionField } = useController({ control, name: 'description' });
  const { field: royaltyField } = useController({ control, name: 'rareweaveConfig.royalty' });

  const fee = useMemo(() => (state?.fee ? parseUBalance(state?.fee) : 0), [state?.fee]);

  const checkAssetNamesValidity = useCallback(() => {
    const assetNames = assetNamesField.value;
    if (assetNames) {
      const assetNamesArray = assetNames.split(';');
      return assetNamesArray.every((assetName) => assetName.length > 0);
    } else {
      return true;
    }
  }, [assetNamesField.value]);

  const hasAssetNameError = useMemo(() => !checkAssetNamesValidity(), [assetNamesField.value]);

  const handleAdd = useCallback(() => {
    if (nameRef?.current?.value && valueRef?.current?.value) {
      const name = nameRef?.current?.value;
      const value = valueRef?.current?.value;
      if (customTags.findIndex((tag) => tag.name === name) >= 0) {
        enqueueSnackbar('Tag name already exists', { variant: 'error' });
      } else {
        setCustomTags((prev) => [...prev, { name, value }]);
        nameRef.current.value = '';
        valueRef.current.value = '';
      }
    }
  }, [nameRef?.current?.value, valueRef?.current?.value, customTags]);

  const handleRemove = useCallback(
    (name: string, value: string) => {
      setCustomTags((prev) => prev.filter((tag) => tag.name !== name && tag.value !== value));
    },
    [nameRef?.current?.value, valueRef?.current?.value],
  );

  useEffect(() => {
    setConfigValue('customTags', customTags);
  }, [customTags]);

  const isAllowedRoyalty = useCallback(
    (val: NumberFormatValues) => !val.floatValue || val?.floatValue <= maxPercentage,
    [],
  );

  const handleResetClick = useCallback(() => reset(), [reset]);

  return (
    <Box
      sx={{
        display: 'flex',
        color: theme.palette.mode === 'dark' ? '#1A1A1A' : theme.palette.neutral.contrastText,
        fontStyle: 'normal',
        fontWeight: 400,
        fontSize: '20px',
        lineHeight: '16px',
        width: '100%',
        background: theme.palette.background.default,
        padding: '0px 16px 16px 16px',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
        <IconButton onClick={handleClose} className='plausible-event-name=Close+Configuration'>
          <CloseIcon />
        </IconButton>
        <Typography sx={{ fontWeight: 700, fontSize: '23px', lineHeight: '31px' }}>
          {'Advanced Options'}
        </Typography>
      </Box>

      <Box display={'flex'} gap={'36px'} justifyContent={'space-between'}>
        <TextField
          disabled={true}
          value={address ? displayShortTxOrAddr(address) : ''}
          label='Script Operator'
          sx={{
            '& .MuiInputBase-input': {
              display: 'flex',
              gap: '24px',
              justifyContent: 'space-between',
            },
          }}
        />
        <TextField
          disabled={true}
          value={fee}
          label='Fee'
          sx={{
            '& .MuiInputBase-input': {
              display: 'flex',
              gap: '24px',
              justifyContent: 'space-between',
            },
          }}
          InputProps={{
            endAdornment: <img width='20px' height='29px' src={U_LOGO_SRC} />,
          }}
        />
      </Box>
      <StableDiffusionConfigurations control={control} />
      <Box>
        <Divider textAlign='left' variant='fullWidth'>
          <Typography variant='h4'>Transaction Configurations</Typography>
        </Divider>
      </Box>
      <FormControl sx={{ m: 3 }} component='fieldset' variant='standard'>
        <FormLabel>{'Arweave Asset (NFT) Options'}</FormLabel>
        <RadioGroup value={generateAssetsField.value} onChange={generateAssetsField.onChange}>
          <FormControlLabel control={<Radio />} value={'fair-protocol'} label='Fair Protocol NFT' />
          <FormControlLabel control={<Radio />} value={'rareweave'} label='Rareweave NFT' />
          <FormControlLabel control={<Radio />} value={'none'} label='Do Not Mint' />
        </RadioGroup>
      </FormControl>
      {generateAssetsField.value === 'rareweave' && (
        <NumericFormat
          customInput={TextField}
          allowNegative={false}
          decimalScale={0}
          inputRef={royaltyField.ref} // send input ref, so we can focus on input when error appear
          defaultValue={0}
          maxLength={3}
          max={100}
          label='Royalty (%)'
          placeholder='Royalty'
          isAllowed={isAllowedRoyalty}
        />
      )}
      <TextField
        value={assetNamesField.value}
        onChange={assetNamesField.onChange}
        inputRef={assetNamesField.ref}
        label={'Atomic Asset Name(s)'}
        multiline
        minRows={1}
        maxRows={3}
        error={isAssetNamesDirty && hasAssetNameError}
        onBlur={assetNamesField.onBlur}
        className='plausible-event-name=Atomic+Asset+Name+Changed'
      />
      <TextField
        label={'Description'}
        value={descriptionField.value}
        onChange={descriptionField.onChange}
        inputRef={descriptionField.ref}
        onBlur={descriptionField.onBlur}
        multiline
        minRows={1}
        maxRows={3}
        fullWidth
        className='plausible-event-name=Description+Changed'
      />
      <LicenseConfiguration configControl={control as unknown as Control<FieldValues>} />
      <Box>
        <Divider textAlign='left' variant='fullWidth'>
          <Typography variant='h4'>Custom Tags</Typography>
        </Divider>
      </Box>
      <Box display={'flex'} gap={'36px'} justifyContent={'space-between'}>
        <TextField inputRef={nameRef} label={'Tag Name'} />
        <TextField inputRef={valueRef} label={'Tag Value'} multiline minRows={1} maxRows={5} />
        <IconButton onClick={handleAdd} className='plausible-event-name=Custom+Tag+Added'>
          <AddIcon />
        </IconButton>
      </Box>
      {customTags.map(({ name, value }) => (
        <CustomTag key={name} name={name} value={value} handleRemove={handleRemove} />
      ))}
      <Button variant='outlined' onClick={handleResetClick}>
        <Typography>Reset</Typography>
      </Button>
    </Box>
  );
};

export default Configuration;
