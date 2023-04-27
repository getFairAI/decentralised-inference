import {
  Button,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputProps,
  LinearProgress,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { Box } from '@mui/system';
import { ChangeEvent, CSSProperties, DragEvent, useContext, useEffect, useState } from 'react';
import { useController, UseControllerProps } from 'react-hook-form';
import ClearIcon from '@mui/icons-material/Clear';
import { BundlrContext } from '@/context/bundlr';
import arweave from '@/utils/arweave';

type FileControlProps = UseControllerProps & { mat?: InputProps; style?: CSSProperties };

const FileControl = (props: FileControlProps) => {
  const { field, fieldState } = useController(props);
  const [file, setFile] = useState<File | undefined>(undefined);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filePrice, setFilePrice] = useState(0);
  const [hasFileDrag, setHasFileDrag] = useState(false);
  const theme = useTheme();
  const { getPrice } = useContext(BundlrContext);

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setHasFileDrag(true);
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setHasFileDrag(false);
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setHasFileDrag(true);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setHasFileDrag(false);
    // field.onChange(event.dataTransfer.files[0]);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      // field.onChange(JSON.stringify(file));
      const fr = new FileReader();
      fr.addEventListener('load', onFileLoad(fr, file));
      fr.addEventListener('error', onFileError(fr, file));
      fr.addEventListener('progress', onFileProgress());
      fr.addEventListener('loadstart', onFileLoadStart(fr, file));
      fr.readAsArrayBuffer(file);
    } else {
      setFile(undefined);
    }
  };

  const onFileLoad = (fr: FileReader, file: File) => {
    return (event: ProgressEvent) => {
      console.log(event.type, fr.result);
      // field.onChange(fr.result);
      setProgress(100);
      setLoading(false);
      fr.removeEventListener('error', onFileError(fr, file));
      fr.removeEventListener('load', onFileLoad(fr, file));
      fr.removeEventListener('progress', onFileProgress());
    };
  };
  const onFileError = (fr: FileReader, file: File) => {
    return (event: ProgressEvent) => {
      console.log(event.type, fr.error);
      field.onChange('');
      setLoading(false);
      setFile(undefined);
      setProgress(0);
      fr.removeEventListener('error', onFileError(fr, file));
      fr.removeEventListener('load', onFileLoad(fr, file));
      fr.removeEventListener('progress', onFileProgress());
    };
  };
  const onFileProgress = () => {
    return (event: ProgressEvent) => {
      console.log(event.type);
      console.log(event.loaded);
      console.log(event.total);
      setProgress(event.loaded);
    };
  };
  const onFileLoadStart = (fr: FileReader, file: File) => {
    return (event: ProgressEvent) => {
      console.log(event.type);
      field.onChange(file);
      setProgress(event.loaded);
      setFile(file);
      setLoading(true);
      fr.removeEventListener('loadstart', onFileError(fr, file));
    };
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      // field.onChange(JSON.stringify(file));
      const fr = new FileReader();
      fr.addEventListener('load', onFileLoad(fr, file));
      fr.addEventListener('error', onFileError(fr, file));
      fr.addEventListener('progress', onFileProgress());
      fr.addEventListener('loadstart', onFileLoadStart(fr, file));
      fr.readAsArrayBuffer(file);
    } else {
      setFile(undefined);
    }
  };

  const handleRemoveFile = () => {
    setFile(undefined);
    field.onChange('');
  };

  const printSize = (file: File) => {
    const size = file.size;
    if (size < 1024) {
      return `${size} bytes`;
    } else if (size < Math.pow(1024, 2)) {
      const kb = size / 1024;
      return `${Math.round((kb + Number.EPSILON) * 100) / 100} KB`;
    } else if (size < Math.pow(1024, 3)) {
      const mb = size / Math.pow(1024, 2);
      return `${Math.round((mb + Number.EPSILON) * 100) / 100} MB`;
    } else {
      const gb = size / Math.pow(1024, 3);
      return `${Math.round((gb + Number.EPSILON) * 100) / 100} GB`;
    }
  };

  const simulateFilePrice = async (fileSize: number) => {
    // Check the price to upload 1MB of data
    // The function accepts a number of bytes, so to check the price of
    // 1MB, check the price of 1,048,576 bytes.
    const atomicPrice = await getPrice(fileSize);
    // To ensure accuracy when performing mathematical operations
    // on fractional numbers in JavaScript, it is common to use atomic units.
    // This is a way to represent a floating point (decimal) number using non-decimal notation.
    // Once we have the value in atomic units, we can convert it into something easier to read.
    const priceConverted = arweave.ar.winstonToAr(atomicPrice.toString());
    setFilePrice(parseFloat(priceConverted));
    // setFilePriceAR(parseFloat(arweave.ar.winstonToAr(atomicPrice.toString())));
  };

  useEffect(() => {
    // create the preview
    if (!field.value) {
      setFile(undefined);
      return;
    }
    const getPrice = async () => await simulateFilePrice((file && file.size) || 0);
    getPrice();
  }, [field.value]);

  const showError = () => {
    if (fieldState.invalid) {
      return <FormHelperText>This Field is Required</FormHelperText>;
    }
  };

  if (file) {
    return (
      <>
        <Box>
          <FormControl variant='outlined' fullWidth>
            <TextField
              multiline
              minRows={1}
              value={file?.name}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <IconButton aria-label='Remove' onClick={handleRemoveFile}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
                endAdornment: <InputAdornment position='start'>{printSize(file)}</InputAdornment>,
                sx: {
                  borderWidth: '1px',
                  borderColor: theme.palette.text.primary,
                  borderRadius: '23px',
                },
                readOnly: true,
              }}
            />
            {loading && <LinearProgress variant='determinate' value={progress} />}
          </FormControl>
          <Typography variant='caption'>Estimated price {filePrice} AR</Typography>
        </Box>
      </>
    );
  }

  return (
    <Box>
      <FormControl error={fieldState.invalid} variant='outlined' fullWidth margin='normal'>
        <TextField
          multiline
          minRows={5}
          value={'Drag and Drop to Upload \n Or'}
          inputProps={{
            style: { textAlign: 'center' },
          }}
          InputProps={{
            readOnly: true,
            sx: {
              borderRadius: '20px',
              background: theme.palette.background.default,
              transform: hasFileDrag ? 'scale(1.02)' : 'scale(1)',
              filter: hasFileDrag
                ? `blur(2px)  ${
                    theme.palette.mode === 'dark' ? 'contrast(0.65)' : 'brightness(0.9)'
                  }`
                : theme.palette.mode === 'dark'
                ? 'contrast(0.65)'
                : 'brightness(0.9)',
              backdropFilter: 'blur(2px)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: hasFileDrag
                  ? theme.palette.text.primary
                  : fieldState.invalid
                  ? theme.palette.error.main
                  : theme.palette.text.secondary,
              },
            },
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
        {showError()}
      </FormControl>
      <Box
        display={'flex'}
        width={'100%'}
        sx={{
          position: 'relative',
          left: 0,
          right: 0,
          bottom: '70px',
          filter: hasFileDrag ? 'blur(2px)' : 'none',
        }}
        justifyContent={'center'}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Button variant='text' component='label' color={fieldState.invalid ? 'error' : 'primary'}>
          Browse Files to Upload
          <input type='file' hidden name={field.name} value={field.value} onChange={onFileChange} />
        </Button>
      </Box>
    </Box>
  );
};

export default FileControl;
