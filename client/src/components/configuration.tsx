import { U_LOGO_SRC } from '@/constants';
import { displayShortTxOrAddr } from '@/utils/common';
import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  TextField,
  Typography,
  useTheme,
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

const Configuration = ({
  negativePromptRef,
  assetNamesRef,
  keepConfigRef,
  descriptionRef,
  customTagsRef,
  setConfigurationDraweOpen,
}: {
  negativePromptRef: RefObject<HTMLTextAreaElement>;
  assetNamesRef: RefObject<HTMLTextAreaElement>;
  keepConfigRef: RefObject<HTMLInputElement>;
  descriptionRef: RefObject<HTMLTextAreaElement>;
  customTagsRef: MutableRefObject<{ name: string; value: string }[]>;
  setConfigurationDraweOpen: (open: boolean) => void;
}) => {
  const theme = useTheme();
  const { state } = useLocation();
  const { address } = useParams();
  const [customTags, setCustomTags] = useState<{ name: string; value: string }[]>([]);

  const nameRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLTextAreaElement>(null);

  const fee = useMemo(() => (state?.fee ? parseUBalance(state?.fee) : 0), [state?.fee]);

  const handleClose = useCallback(
    () => setConfigurationDraweOpen(false),
    [setConfigurationDraweOpen],
  );

  const checkAssetNamesValidity = useCallback(() => {
    const assetNames = assetNamesRef?.current?.value;
    if (assetNames) {
      const assetNamesArray = assetNames.split(';');
      return assetNamesArray.every((assetName) => assetName.length > 0);
    } else {
      return true;
    }
  }, [assetNamesRef?.current?.value]);

  const [isAssetNamesDirty, setIsAssetNamesDirty] = useState(false);
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
      setCustomTags((prev) => [...prev, { name, value }]);
      nameRef.current.value = '';
      valueRef.current.value = '';
    }
  }, [nameRef?.current?.value, valueRef?.current?.value]);

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
        boxShadow:
          '0px 15px 50px rgba(0,0,0,0.4), 0px -15px 50px rgba(0,0,0,0.4), 15px 0px 50px rgba(0,0,0,0.4), -15px 0px 50px rgba(0,0,0,0.4)',
        background: theme.palette.background.default,
        borderRadius: '23px',
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
          {'Configuration'}
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
      <TextField
        label={'Description'}
        inputRef={descriptionRef}
        multiline
        minRows={1}
        maxRows={3}
        fullWidth
      />
      <TextField
        label={'Negative Prompt'}
        inputRef={negativePromptRef}
        multiline
        minRows={3}
        maxRows={5}
        fullWidth
      />
      <TextField
        inputRef={assetNamesRef}
        label={'Atomic Asset Name(s)'}
        multiline
        minRows={1}
        maxRows={3}
        error={isAssetNamesDirty && hasAssetNameError}
        onBlur={handleAssetNamesBlur}
      />
      <Box>
        <Divider textAlign='left'>
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
      {customTags.map(({ name, value }, index) => (
        <CustomTag key={index} name={name} value={value} handleRemove={handleRemove} />
      ))}
      <FormControlLabel
        control={<Checkbox inputRef={keepConfigRef} />}
        label='Keep Configuration Between Prompts'
      />
    </Box>
  );
};

export default Configuration;
