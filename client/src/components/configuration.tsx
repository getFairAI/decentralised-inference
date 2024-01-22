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
  Checkbox,
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
} from '@mui/material';
import {
  MutableRefObject,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useParams } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { parseUBalance } from '@/utils/u';
import { enqueueSnackbar } from 'notistack';
import { NumberFormatValues, NumericFormat } from 'react-number-format';
import LicenseConfiguration from './license-configuration';
import { Control } from 'react-hook-form';
import { LicenseForm } from '@/interfaces/common';

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
      <IconButton onClick={handleClick}>
        <RemoveIcon />
      </IconButton>
    </Box>
  );
};

const StableDiffusionConfigurations = ({
  negativePromptRef,
  nImagesRef,
}: {
  negativePromptRef: RefObject<HTMLTextAreaElement>;
  nImagesRef: MutableRefObject<number>;
}) => {
  const nDigits = 4;
  const { state } = useLocation();

  const [cost, setCost] = useState(0);
  const [usdCost, setUsdCost] = useState(0);
  const [currentArPrice, setCurrentArPrice] = useState(0);
  const showOutputConfiguration = useMemo(
    () => findTag(state.fullState, 'outputConfiguration') === 'stable-diffusion',
    [state],
  );
  const sliderValue = useMemo(() => nImagesRef.current, [nImagesRef.current]);

  useEffect(() => {
    (async () => {
      const arPrice = await getUPriceUSD();
      setCurrentArPrice(arPrice);
    })();
  }, [getUPriceUSD, setCurrentArPrice]);

  useEffect(() => {
    const defaultImages = 4;
    const fee = state?.fee ? parseUBalance(state?.fee) : 0;
    setCost(fee * defaultImages);
    setUsdCost(currentArPrice * fee * defaultImages);
  }, [currentArPrice, state]);

  const handleSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      if (nImagesRef.current !== newValue) {
        nImagesRef.current = newValue as number;
        const fee = state?.fee ? parseUBalance(state?.fee) : 0;
        setCost(fee * (newValue as number));
        setUsdCost(currentArPrice * fee * (newValue as number));
      }
    },
    [nImagesRef, state, currentArPrice, setCost, setUsdCost, parseUBalance],
  );

  if (!showOutputConfiguration) {
    // force negative prompt and nImages to be null
    if (negativePromptRef.current) {
      negativePromptRef.current.value = '';
    }
    nImagesRef.current = 4;
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
        inputRef={negativePromptRef}
        multiline
        minRows={3}
        maxRows={5}
        fullWidth
      />
      <Box
        sx={{
          marginLeft: '16px',
        }}
      >
        <Typography sx={{ marginBottom: '16px' }} variant='caption'>
          Number of Images To Generate
        </Typography>
        <Slider
          value={sliderValue}
          onChange={handleSliderChange}
          defaultValue={4}
          disabled={false}
          marks
          max={10}
          step={1}
          min={1}
          valueLabelDisplay='auto'
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
  negativePromptRef,
  assetNamesRef,
  keepConfigRef,
  descriptionRef,
  nImagesRef,
  customTagsRef,
  generateAssetsRef,
  royaltyRef,
  licenseRef,
  licenseControl,
  handleClose,
}: {
  negativePromptRef: RefObject<HTMLTextAreaElement>;
  assetNamesRef: RefObject<HTMLTextAreaElement>;
  keepConfigRef: RefObject<HTMLInputElement>;
  descriptionRef: RefObject<HTMLTextAreaElement>;
  nImagesRef: MutableRefObject<number>;
  customTagsRef: MutableRefObject<{ name: string; value: string }[]>;
  generateAssetsRef: MutableRefObject<'fair-protocol' | 'rareweave' | 'none'>;
  royaltyRef: RefObject<HTMLInputElement>;
  licenseRef: RefObject<HTMLInputElement>;
  licenseControl: Control<LicenseForm, unknown>;
  handleClose: () => void;
}) => {
  const maxPercentage = 100;
  const theme = useTheme();
  const { state } = useLocation();
  const { address } = useParams();
  const [isAssetNamesDirty, setIsAssetNamesDirty] = useState(false);
  const [customTags, setCustomTags] = useState<{ name: string; value: string }[]>([]);
  const [generateAsset, setGenerateAsset] = useState('fair-protocol');
  const nameRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLTextAreaElement>(null);

  const fee = useMemo(() => (state?.fee ? parseUBalance(state?.fee) : 0), [state?.fee]);

  const checkAssetNamesValidity = useCallback(() => {
    const assetNames = assetNamesRef?.current?.value;
    if (assetNames) {
      const assetNamesArray = assetNames.split(';');
      return assetNamesArray.every((assetName) => assetName.length > 0);
    } else {
      return true;
    }
  }, [assetNamesRef?.current?.value]);

  const hasAssetNameError = useMemo(
    () => !checkAssetNamesValidity(),
    [assetNamesRef?.current?.value],
  );

  const handleAssetNamesBlur = useCallback(
    () => setIsAssetNamesDirty(true),
    [setIsAssetNamesDirty],
  );

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
    if (customTagsRef.current) {
      customTagsRef.current = customTags;
    }
  }, [customTags]);

  useEffect(() => setGenerateAsset(generateAssetsRef.current), [generateAssetsRef.current]);

  const handleGenerateAssetChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setGenerateAsset((event.target as HTMLInputElement).value);
      generateAssetsRef.current = (event.target as HTMLInputElement).value as
        | 'fair-protocol'
        | 'rareweave'
        | 'none';
    },
    [generateAssetsRef, setGenerateAsset],
  );

  const isAllowedRoyalty = useCallback(
    (val: NumberFormatValues) => !val.floatValue || val?.floatValue <= maxPercentage,
    [],
  );

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
        padding: '16px',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
        <IconButton onClick={handleClose}>
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
      <StableDiffusionConfigurations
        negativePromptRef={negativePromptRef}
        nImagesRef={nImagesRef}
      />
      <Box>
        <Divider textAlign='left' variant='fullWidth'>
          <Typography variant='h4'>Transaction Configurations</Typography>
        </Divider>
      </Box>
      <FormControl sx={{ m: 3 }} component='fieldset' variant='standard'>
        <FormLabel>{'Arweave Asset (NFT) Options'}</FormLabel>
        <RadioGroup value={generateAsset} onChange={handleGenerateAssetChange}>
          <FormControlLabel
            control={<Radio />}
            value={'fair-protocol'}
            label='Fair Protocol NFT'
          />
          <FormControlLabel
            control={<Radio />}
            value={'rareweave'}
            label='Rareweave NFT'
          />
          <FormControlLabel control={<Radio />} value={'none'} label='Do Not Mint' />
        </RadioGroup>
      </FormControl>
      {generateAsset === 'rareweave' && (
        <NumericFormat
          customInput={TextField}
          allowNegative={false}
          decimalScale={0}
          inputRef={royaltyRef} // send input ref, so we can focus on input when error appear
          defaultValue={0}
          maxLength={3}
          max={100}
          label='Royalty (%)'
          placeholder='Royalty'
          isAllowed={isAllowedRoyalty}
        />
      )}
      <TextField
        inputRef={assetNamesRef}
        label={'Atomic Asset Name(s)'}
        multiline
        minRows={1}
        maxRows={3}
        error={isAssetNamesDirty && hasAssetNameError}
        onBlur={handleAssetNamesBlur}
      />
      <TextField
        label={'Description'}
        inputRef={descriptionRef}
        multiline
        minRows={1}
        maxRows={3}
        fullWidth
      />
      <LicenseConfiguration licenseControl={licenseControl} licenseRef={licenseRef} />
      <Box>
        <Divider textAlign='left' variant='fullWidth'>
          <Typography variant='h4'>Custom Tags</Typography>
        </Divider>
      </Box>
      <Box display={'flex'} gap={'36px'} justifyContent={'space-between'}>
        <TextField inputRef={nameRef} label={'Tag Name'} />
        <TextField inputRef={valueRef} label={'Tag Value'} multiline minRows={1} maxRows={5} />
        <IconButton onClick={handleAdd}>
          <AddIcon />
        </IconButton>
      </Box>
      {customTags.map(({ name, value }) => (
        <CustomTag key={name} name={name} value={value} handleRemove={handleRemove} />
      ))}
      <FormControlLabel
        control={<Checkbox inputRef={keepConfigRef} />}
        label='Keep Configuration Between Prompts'
      />
    </Box>
  );
};

export default Configuration;
