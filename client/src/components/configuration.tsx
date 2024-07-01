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

import { MAX_MESSAGE_SIZE } from '@/constants';
import { displayShortTxOrAddr, findTag, printSize } from '@/utils/common';
import {
  Box,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  Slider,
  TextField,
  Typography,
  useTheme,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputAdornment,
  Checkbox,
  Tooltip,
} from '@mui/material';
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import { NumericFormat } from 'react-number-format';
import LicenseConfiguration from './license-configuration';
import {
  Control,
  FieldValues,
  UseFormReset,
  UseFormSetValue,
  useController,
} from 'react-hook-form';
import { IConfiguration, IMessage, OperatorData } from '@/interfaces/common';
import SelectControl from './select-control';
import { findByTagsQuery } from '@fairai/evm-sdk';
import TextControl from './text-control';
import { StyledMuiButton } from '@/styles/components';

// icons
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import ClearIcon from '@mui/icons-material/Clear';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { motion } from 'framer-motion';

const spaceBetween = 'space-between';

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
    <Box
      display={'flex'}
      alignItems={'center'}
      gap={'10px'}
      justifyContent={spaceBetween}
      sx={{
        width: '100%',
        maxWidth: '550px',
        borderRadius: '10px',
        backgroundColor: '#fff',
        padding: '15px',
      }}
    >
      <Box display={'flex'} overflow={'auto'} alignItems={'center'}>
        <Typography sx={{ fontWeight: 700 }}>{name}</Typography>
        <Typography sx={{ fontWeight: 700 }}>:</Typography>
        <Typography sx={{ marginLeft: '8px' }}>{value}</Typography>
      </Box>
      <StyledMuiButton
        onClick={handleClick}
        className='plausible-event-name=Custom+Tag+Removed outlined-secondary mini'
      >
        <RemoveIcon />
      </StyledMuiButton>
    </Box>
  );
};

const StableDiffusionConfigurations = ({
  control,
  fee,
}: {
  control: Control<IConfiguration, unknown>;
  fee: number;
}) => {
  const nDigits = 4;
  const defaultImages = 1;
  const portraitWidth = 960;
  const portraitHeight = 1280;
  const landscapeWidth = 1280;
  const landscapeHeight = 720;
  const squareWidth = 1024;
  const {
    state,
  }: {
    state: {
      defaultOperator?: OperatorData;
      solution: findByTagsQuery['transactions']['edges'][0];
      availableOperators: OperatorData[];
    };
  } = useLocation();

  const [usdCost, setUsdCost] = useState(0);
  const [showCustomAspectRatio, setShowCustomAspectRatio] = useState(false);

  const showOutputConfiguration = useMemo(
    () => findTag(state.solution, 'outputConfiguration') === 'stable-diffusion',
    [state],
  );

  const { field: negativePromptField } = useController({ control, name: 'negativePrompt' });
  const { field: nImagesField } = useController({ control, name: 'nImages' });
  const { field: widthField } = useController({ control, name: 'width' });
  const { field: heightField } = useController({ control, name: 'height' });

  useEffect(() => {
    setUsdCost(fee * defaultImages);
  }, [fee]);

  const handleSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      nImagesField.onChange(_event);
      setUsdCost(fee * (newValue as number));
    },
    [nImagesField, fee, setUsdCost],
  );

  const handleAspectRatioChange = useCallback((event: SelectChangeEvent) => {
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
  }, []);

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
            <MenuItem
              value={'Default'}
              className='plausible-event-name=Aspect+Ratio+Changed plausibe-event-value=Default'
            >
              {'Default'}
            </MenuItem>
            <MenuItem
              value={'Portrait'}
              className='plausible-event-name=Aspect+Ratio+Changed plausibe-event-value=Portrait'
            >
              {'Portrait (3:4)'}
            </MenuItem>
            <MenuItem
              value={'Landscape'}
              className='plausible-event-name=Aspect+Ratio+Changed plausibe-event-value=Landscape'
            >
              {'Landscape (16:9)'}
            </MenuItem>
            <MenuItem
              value={'Square'}
              className='plausible-event-name=Aspect+Ratio+Changed plausibe-event-value=Square'
            >
              {'Square (1:1)'}
            </MenuItem>
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
        <Box display={'flex'}>
          <Typography sx={{ marginBottom: '16px' }} variant='caption'>
            Estimated Total Cost: {usdCost.toPrecision(nDigits)} USDC
          </Typography>
        </Box>
      </Box>
    </>
  );
};

const TextConfiguration = ({
  messages,
  control,
}: {
  messages: IMessage[];
  control: Control<IConfiguration, unknown>;
}) => {
  const { field: contextFileUrlField } = useController({ control, name: 'contextFileUrl' });
  const [contextFileOn, setContextFileOn] = useState(false);
  const [contextFileDisabled, setContextFileDisabled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages && messages.length === 0) {
      // no messages yet, allow contextFile
      setContextFileDisabled(false);
    } else if (messages) {
      // current contextFile
      const lastMessage = [...messages].pop();

      const currentCtxFileUrl = lastMessage?.tags.find(
        (tag) => tag.name === 'Context-File-Url',
      )?.value;
      if (currentCtxFileUrl) {
        setContextFileOn(true);
        contextFileUrlField.onChange(currentCtxFileUrl);
      }

      setContextFileDisabled(true);
    } else {
      // ignore
    }
  }, [messages, contextFileUrlField, setContextFileOn, setContextFileDisabled]);

  const handleContextFileToggle = useCallback(() => {
    setContextFileOn((prev) => !prev);
  }, [setContextFileOn]);

  const handleUploadContextFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
        const newFile = event.target.files[0];
        contextFileUrlField.onChange(newFile);
      } else {
        // ignore
      }
    },
    [contextFileUrlField],
  );

  const handleRemoveFile = useCallback(() => {
    contextFileUrlField.onChange('');
    if (inputRef && inputRef.current) {
      inputRef.current.value = '';
    } else {
      // ignore,
    }
  }, [contextFileUrlField]);

  return (
    <>
      <FormControl component='fieldset' variant='standard'>
        <FormControlLabel
          control={
            <Checkbox
              value={contextFileOn}
              checked={contextFileOn}
              onChange={handleContextFileToggle}
              disabled={contextFileDisabled}
              color='primary'
            />
          }
          label={
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Context File
              <Tooltip
                title={
                  <Typography variant='caption' sx={{ whiteSpace: 'pre-line' }}>
                    {contextFileDisabled
                      ? 'The Context File can only be set at the beginning of a conversation.'
                      : 'Upload or provide an url for a context file. The context File is used as a database for the model to use when answering. This feature can only be used at the beginning of a new conversation.'}
                  </Typography>
                }
                placement='bottom'
              >
                <InfoOutlined fontSize='small' />
              </Tooltip>
            </Typography>
          }
        />
      </FormControl>
      {contextFileOn && (
        <motion.div
          initial={{ opacity: 0, y: '-40px' }}
          animate={{ opacity: 1, y: 0 }}
          className='flex flex-col'
        >
          {(!contextFileUrlField.value || !(contextFileUrlField.value as File)?.name) && (
            <>
              <TextControl
                mat={{
                  label: 'Context File Url',
                  placeholder: 'https://',
                  fullWidth: true,
                  disabled: contextFileDisabled,
                }}
                name={'contextFileUrl'}
                control={control}
              />
            </>
          )}
          {!contextFileDisabled && (
            <Typography variant='caption'>
              {'Alternatively, '}
              <u>
                <label htmlFor='inputUpload' style={{ cursor: 'pointer' }}>
                  Upload your file
                </label>
                <input
                  ref={inputRef}
                  id={'inputUpload'}
                  type='file'
                  hidden
                  multiple={false}
                  accept='text/*'
                  onChange={handleUploadContextFile}
                  onBlur={handleRemoveFile}
                />
              </u>
            </Typography>
          )}
          {contextFileUrlField.value && (contextFileUrlField.value as File)?.name && (
            <FormControl variant='outlined' fullWidth>
              <TextField
                value={(contextFileUrlField.value as File).name}
                disabled={true}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <IconButton
                        aria-label='Remove'
                        onClick={handleRemoveFile}
                        className='plausible-event-name=Remove+Contecxt+File+Click'
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position='start'>
                      {printSize(contextFileUrlField.value as File)}
                    </InputAdornment>
                  ),
                  readOnly: true,
                }}
                error={(contextFileUrlField.value as File).size > MAX_MESSAGE_SIZE}
                helperText={
                  (contextFileUrlField.value as File).size > MAX_MESSAGE_SIZE
                    ? `The selected file size cannot exceed ${MAX_MESSAGE_SIZE / 1024} KB.`
                    : ''
                }
              />
            </FormControl>
          )}
        </motion.div>
      )}
    </>
  );
};

const Configuration = ({
  control,
  currentOperator,
  messages,
  drawerOpen,
  setCurrentOperator,
  setConfigValue,
  reset,
  handleClose,
}: {
  control: Control<IConfiguration, unknown>;
  currentOperator?: OperatorData;
  messages: IMessage[];
  drawerOpen: boolean;
  setCurrentOperator: Dispatch<SetStateAction<OperatorData | undefined>>;
  setConfigValue: UseFormSetValue<IConfiguration>;
  reset: UseFormReset<IConfiguration>;
  handleClose: () => void;
}) => {
  const theme = useTheme();
  const {
    state,
    pathname,
  }: {
    state: {
      defaultOperator?: OperatorData;
      solution: findByTagsQuery['transactions']['edges'][0];
      availableOperators: OperatorData[];
    };
    pathname: string;
  } = useLocation();

  const [customTags, setCustomTags] = useState<{ name: string; value: string }[]>([]);

  const nameRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLTextAreaElement>(null);

  const isTextSolution = useMemo(() => findTag(state.solution, 'output') === 'text', [state]);
  const isArbitrumSolution = useMemo(() => pathname.includes('arbitrum'), [pathname]);

  const {
    field: assetNamesField,
    fieldState: { isDirty: isAssetNamesDirty },
  } = useController({ control, name: 'assetNames' });
  const { field: descriptionField } = useController({ control, name: 'description' });
  const { field: privateModeField } = useController({ control, name: 'privateMode' });

  const availableModels = useMemo(
    () =>
      JSON.parse(
        state.solution.node.tags.find((tag) => tag.name === 'Supported-Models')?.value ?? '[]',
      ),
    [state],
  );

  useEffect(() => {
    if (availableModels.length > 0) {
      setConfigValue('modelName', availableModels[0].name, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }, [availableModels]);

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

  const handleResetClick = useCallback(() => reset(), [reset]);

  const handleOperatorChange = useCallback(
    (event: SelectChangeEvent) => {
      const operator = state.availableOperators.find(
        (operator) => operator.evmWallet === event.target.value,
      );
      if (operator) {
        setCurrentOperator(operator);
      } else {
        // ifgnore
      }
    },
    [state, setCurrentOperator],
  );

  return (
    <Box
      sx={{
        display: 'flex',
        color: theme.palette.mode === 'dark' ? '#1A1A1A' : theme.palette.neutral.contrastText,
        width: '100%',
        height: '100%',
        padding: '0px 40px 0px 20px',
        flexDirection: 'column',
        gap: '16px',
        '*.MuiInputBase-root, .MuiInputBase-root': {
          backgroundColor: '#fff !important',
        },
      }}
    >
      <div className='flex w-full justify-center px-2 mb-3 mt-6'>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '23px',
            lineHeight: '31px',
            display: 'flex',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <SettingsRoundedIcon style={{ color: '#3aaaaa' }} />
          Advanced Configuration
        </Typography>
      </div>

      <div className='flex flex-col gap-5 h-full min-h-fit'>
        <Box display={'flex'} gap={'20px'} justifyContent={spaceBetween}>
          <FormControl fullWidth margin='none'>
            <InputLabel>{'Solution Operator (Provider)'}</InputLabel>
            <Select
              label={'Solution Operator (Provider)'}
              onChange={handleOperatorChange}
              defaultValue={currentOperator?.evmWallet ?? ''}
              renderValue={(value) => (
                <Typography>{displayShortTxOrAddr(value as string)}</Typography>
              )}
            >
              {state.availableOperators.map((operator: OperatorData) => (
                <MenuItem
                  key={operator.evmWallet}
                  value={operator.evmWallet}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: spaceBetween }}
                >
                  <Typography>{displayShortTxOrAddr(operator.evmWallet)}</Typography>
                  <Tooltip title={'Operator Fee'}>
                    <Box display={'flex'} alignItems={'center'} gap={'8px'}>
                      <Typography>{operator.operatorFee}</Typography>
                      <img width='20px' height='20px' src='./usdc-logo.svg' />
                    </Box>
                  </Tooltip>
                </MenuItem>
              ))}

              {!state.availableOperators?.length && (
                <MenuItem value={'none'} disabled={true}>
                  <Typography>No currently available operators</Typography>
                </MenuItem>
              )}
            </Select>
          </FormControl>
          <TextField
            disabled={true}
            value={currentOperator?.operatorFee ?? 0}
            label='Fee'
            sx={{
              '& .MuiInputBase-input': {
                display: 'flex',
                gap: '24px',
                justifyContent: spaceBetween,
              },
            }}
            InputProps={{
              endAdornment: <img width='20px' height='29px' src={'./usdc-logo.svg'} />,
            }}
          />
        </Box>
        {!isArbitrumSolution && (
          <Box>
            <SelectControl
              name={'modelName'}
              control={control}
              mat={{ placeholder: 'Model to Use' }}
            >
              {availableModels.map((model: { name: string; url: string }) => (
                <MenuItem
                  key={model.url}
                  value={model.name}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: spaceBetween }}
                >
                  <Typography>{model.name}</Typography>
                </MenuItem>
              ))}
            </SelectControl>
            {/* <img src='./arweave-logo-for-light.png' height={'18px'} width={'18px'}/> */}
          </Box>
        )}
        <StableDiffusionConfigurations control={control} fee={currentOperator?.operatorFee ?? 0} />
        {!isArbitrumSolution && (
          <Box>
            <Divider textAlign='left' variant='fullWidth'>
              <Typography variant='h4'>Transaction Configurations</Typography>
            </Divider>
          </Box>
        )}
        {!isArbitrumSolution && isTextSolution && (
          <TextConfiguration messages={messages} control={control} />
        )}
        <FormControl component='fieldset' variant='standard'>
          <FormControlLabel
            control={
              <Checkbox
                ref={privateModeField.ref}
                value={privateModeField.value}
                onChange={privateModeField.onChange}
              />
            }
            label={
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Private Mode
                <Tooltip
                  title={
                    <Typography variant='caption' sx={{ whiteSpace: 'pre-line' }}>
                      {
                        'When this is on, prompts and responses will be encrypted with your keys and will only be acessbile by you.'
                      }
                    </Typography>
                  }
                  placement='bottom'
                >
                  <InfoOutlined fontSize='small' />
                </Tooltip>
              </Typography>
            }
          />
        </FormControl>
        {!isArbitrumSolution && (
          <>
            <SelectControl
              name='generateAssets'
              control={control}
              mat={{
                label: 'Arweave Asset (NFT) Options',
                placeholder: 'Arweave Asset (NFT) Options',
              }}
              defaultValue={'none'}
            >
              <MenuItem value='none'>Do not mint</MenuItem>
              <MenuItem value='fair-protocol'>Fair Protocol NFT</MenuItem>
              <MenuItem value='rareweave'>Rareweave NFT</MenuItem>
            </SelectControl>
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
            <Box display={'flex'} gap={'20px'} alignItems={'center'}>
              <TextField inputRef={nameRef} label={'Tag Name'} />
              <TextField
                inputRef={valueRef}
                label={'Tag Value'}
                multiline
                minRows={1}
                maxRows={5}
              />
              <StyledMuiButton
                onClick={handleAdd}
                className='plausible-event-name=Custom+Tag+Added outlined-secondary mini'
              >
                <AddIcon />
              </StyledMuiButton>
            </Box>
            {customTags.map(({ name, value }) => (
              <motion.div
                initial={{ opacity: 0, y: '-60px' }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, type: 'spring', bounce: 0.4 },
                }}
                key={name}
              >
                <CustomTag key={name} name={name} value={value} handleRemove={handleRemove} />
              </motion.div>
            ))}
          </>
        )}

        <Box>
          <Divider textAlign='left' variant='fullWidth'></Divider>
        </Box>

        <div className='w-full flex justify-end'>
          <Tooltip title={'Reset every configuration on this page to its default state'}>
            <StyledMuiButton className='w-fit outlined-secondary' onClick={handleResetClick}>
              <DeleteRoundedIcon style={{ width: 20 }} />
              Reset all
            </StyledMuiButton>
          </Tooltip>
        </div>
      </div>

      {drawerOpen && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{
            opacity: 1,
            x: 0,
            transition: { delay: 0.3, duration: 0.5, type: 'spring' },
          }}
          className='py-8 w-full mb-4'
        >
          <Tooltip title={'Hide the advanced configurations drawer'}>
            <StyledMuiButton
              onClick={handleClose}
              className='plausible-event-name=Close+Configuration secondary'
            >
              Hide
              <ArrowForwardIosRoundedIcon style={{ width: 18 }} />
            </StyledMuiButton>
          </Tooltip>
        </motion.div>
      )}
    </Box>
  );
};

export default Configuration;
