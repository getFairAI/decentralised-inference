import {
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputProps,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material';
import { Box } from '@mui/system';
import { ChangeEvent, CSSProperties, DragEvent, useEffect, useState } from 'react';
import { useController, UseControllerProps } from 'react-hook-form';
import ClearIcon from '@mui/icons-material/Clear';
import { WebBundlr } from 'bundlr-custom';
import { NODE1_BUNDLR_URL } from '@/constants';

type FileControlProps = UseControllerProps & { mat?: InputProps; style?: CSSProperties };

const FileControl = (props: FileControlProps) => {
  const { field, fieldState } = useController(props);
  const [file, setFile] = useState<File | undefined>(undefined);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filePrice, setFilePrice] = useState(0);

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    field.onChange(event.dataTransfer.files[0]);
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
    const bundlr = new WebBundlr(NODE1_BUNDLR_URL, 'arweave', window.arweaveWallet);
    await bundlr.ready();
    console.log(bundlr);
    const atomicPrice = await bundlr.getPrice(fileSize);
    // To ensure accuracy when performing mathematical operations
    // on fractional numbers in JavaScript, it is common to use atomic units.
    // This is a way to represent a floating point (decimal) number using non-decimal notation.
    // Once we have the value in atomic units, we can convert it into something easier to read.
    const priceConverted = bundlr.utils.unitConverter(atomicPrice);
    setFilePrice(priceConverted.toNumber());
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

  if (file) {
    return (
      <>
        <Box>
          <FormControl variant='outlined' fullWidth>
            <TextField
              multiline
              disabled
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
              }}
            />
            {loading && <LinearProgress variant='determinate' value={progress} />}
          </FormControl>
          <Typography variant='caption'>
            Estimated price ${filePrice} {/* / {filePriceAR} AR */}
          </Typography>
        </Box>
      </>
    );
  }

  return (
    <Box>
      <FormControl error={fieldState.invalid} variant='outlined' fullWidth>
        <TextField
          multiline
          disabled
          minRows={5}
          value={'Drag and Drop to Upload \n Or'}
          inputProps={{
            style: { textAlign: 'center' },
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      </FormControl>
      <Box
        display={'flex'}
        width={'100%'}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        }}
        justifyContent={'center'}
      >
        <Button variant='text' component='label'>
          Upload Model
          <input type='file' hidden name={field.name} value={field.value} onChange={onFileChange} />
        </Button>
      </Box>
    </Box>
  );
};

export default FileControl;
