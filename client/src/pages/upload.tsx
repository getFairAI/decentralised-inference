import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  Icon,
  MenuItem,
  Snackbar,
  Typography,
} from '@mui/material';
import { useContext, useRef, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import TextControl from '@/components/text-control';
import SelectControl from '@/components/select-control';
import MarkdownControl from '@/components/md-control';
import FileControl from '@/components/file-control';
import AvatarControl from '@/components/avatar-control';
import FundDialog from '@/components/fund-dialog';
import CustomProgress from '@/components/progress';
import fileReaderStream from 'filereader-stream';
import {
  APP_VERSION,
  MARKETPLACE_FEE,
  NODE1_BUNDLR_URL,
  MARKETPLACE_ADDRESS,
  TAG_NAMES,
  APP_NAME,
  MODEL_CREATION,
  MODEL_CREATION_PAYMENT,
  MODEL_ATTACHMENT,
  AVATAR_ATTACHMENT,
  NOTES_ATTACHMENT,
} from '@/constants';
import { BundlrContext } from '@/context/bundlr';
import { useSnackbar } from 'notistack';
import arweave from '@/utils/arweave';
import NumberControl from '@/components/number-control';

export interface CreateForm extends FieldValues {
  name: string;
  fee: number;
  category: string;
  notes: string;
  file: File;
  description?: string;
  avatar?: File;
}
const Upload = () => {
  const { handleSubmit, reset, control } = useForm<FieldValues>({
    defaultValues: {
      name: '',
      fee: 0,
      description: '',
      notes: '',
      avatar: '',
      file: '',
      category: 'text',
    },
  });
  const [fundOpen, setFundOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, setMessage] = useState('');
  const [formData, setFormData] = useState<CreateForm | undefined>(undefined);
  const totalChunks = useRef(0);
  const bundlrContext = useContext(BundlrContext);
  const { enqueueSnackbar } = useSnackbar();

  const onSubmit = async (data: FieldValues) => {
    setFormData(data as CreateForm);

    if ((await getNodeBalance()) <= 0) {
      setFundOpen(true);
    } else {
      handleFundFinished(NODE1_BUNDLR_URL, data as CreateForm); // use default node
    }
  };

  const getNodeBalance = async () => {
    if (!bundlrContext || !bundlrContext.state) return 0;
    const atomicBalance = await bundlrContext.state.getLoadedBalance();

    // Convert balance to an easier to read format
    const convertedBalance = bundlrContext.state.utils.unitConverter(atomicBalance);
    return convertedBalance.toNumber();
  };

  const getFilePrice = async (fileSize: number) => {
    if (!bundlrContext || !bundlrContext.state) return 0;
    // Check the price to upload 1MB of data
    // The function accepts a number of bytes, so to check the price of
    // 1MB, check the price of 1,048,576 bytes.
    const atomicPrice = await bundlrContext.state.getPrice(fileSize);
    // To ensure accuracy when performing mathematical operations
    // on fractional numbers in JavaScript, it is common to use atomic units.
    // This is a way to represent a floating point (decimal) number using non-decimal notation.
    // Once we have the value in atomic units, we can convert it into something easier to read.
    const priceConverted = bundlrContext.state.utils.unitConverter(atomicPrice);
    return priceConverted.toNumber();
  };

  const uploadAvatarImage = async (modelTx: string, modelName: string, image: File) => {
    if (!bundlrContext || !bundlrContext.state) return;

    if ((await getFilePrice(image.size)) > (await getNodeBalance()))
      enqueueSnackbar('Not Enought Balance in Bundlr Node', { variant: 'error' });

    const uploader = bundlrContext.state.uploader.chunkedUploader;
    const chunkSize = 25 * (1024 * 1024); // default is

    // divide the total image size by the size of each chunk we'll upload
    if (image.size < chunkSize) totalChunks.current = 1;
    else {
      totalChunks.current = Math.floor(image.size / chunkSize);
    }
    /** Register Event Callbacks */
    // event callback: called for every chunk uploaded
    uploader.on('chunkUpload', (chunkInfo) => {
      console.log(chunkInfo);
      console.log(
        `Uploaded Chunk number ${chunkInfo.id}, offset of ${chunkInfo.offset}, size ${chunkInfo.size} Bytes, with a total of ${chunkInfo.totalUploaded} bytes uploaded.`,
      );
      const chunkNumber = chunkInfo.id + 1;
      // update the progress bar based on how much has been uploaded
      if (chunkNumber >= totalChunks.current) setProgress(100);
      else setProgress((chunkNumber / totalChunks.current) * 100);
    });
    // event callback: called if an error happens
    uploader.on('chunkError', (e) => {
      setSnackbarOpen(false);
      console.error(`Error uploading chunk number ${e.id} - ${e.res.statusText}`);
    });
    // event callback: called when file is fully uploaded
    uploader.on('done', (finishRes) => {
      console.log(`Upload completed with ID ${finishRes.id}`);
      // set the progress bar to 100
      setProgress(100);
      setSnackbarOpen(false);
    });
    // upload the file
    const readableStream = fileReaderStream(image);
    const tags = [];
    tags.push({ name: TAG_NAMES.appName, value: APP_NAME });
    tags.push({ name: TAG_NAMES.appVersion, value: APP_VERSION });
    tags.push({ name: TAG_NAMES.contentType, value: image.type });
    tags.push({ name: TAG_NAMES.modelTransaction, value: modelTx });
    tags.push({ name: TAG_NAMES.operationName, value: MODEL_ATTACHMENT });
    tags.push({ name: TAG_NAMES.attachmentName, value: image.name });
    tags.push({ name: TAG_NAMES.attachmentRole, value: AVATAR_ATTACHMENT });
    tags.push({ name: TAG_NAMES.unixTime, value: (Date.now() / 1000).toString() });
    setSnackbarOpen(true);
    try {
      const res = await uploader.uploadData(readableStream, { tags });
      if (res.status === 200) {
        enqueueSnackbar(
          <>
            Uploaded Avatat Image
            <br></br>
            <a
              href={`https://viewblock.io/arweave/tx/${res.data.id}`}
              target={'_blank'}
              rel='noreferrer'
            >
              <u>View Transaction in Explorer</u>
            </a>
          </>,
          { variant: 'success' },
        );
      } else {
        enqueueSnackbar(res.statusText, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('An Error Occured.', { variant: 'error' });
    }
  };

  const uploadUsageNotes = async (modelTx: string, modelName: string, usageNotes: string) => {
    if (!bundlrContext || !bundlrContext.state) return;
    const file = new File([usageNotes], `${modelName}-usage.md`, {
      type: 'text/markdown',
    });

    if ((await getFilePrice(file.size)) > (await getNodeBalance()))
      enqueueSnackbar('Not Enought Balance in Bundlr Node', { variant: 'error' });

    const uploader = bundlrContext.state.uploader.chunkedUploader;
    const chunkSize = 25 * (1024 * 1024); // default is

    // divide the total file size by the size of each chunk we'll upload
    if (file.size < chunkSize) totalChunks.current = 1;
    else {
      totalChunks.current = Math.floor(file.size / chunkSize);
    }
    /** Register Event Callbacks */
    // event callback: called for every chunk uploaded
    uploader.on('chunkUpload', (chunkInfo) => {
      console.log(chunkInfo);
      console.log(
        `Uploaded Chunk number ${chunkInfo.id}, offset of ${chunkInfo.offset}, size ${chunkInfo.size} Bytes, with a total of ${chunkInfo.totalUploaded} bytes uploaded.`,
      );
      const chunkNumber = chunkInfo.id + 1;
      // update the progress bar based on how much has been uploaded
      if (chunkNumber >= totalChunks.current) setProgress(100);
      else setProgress((chunkNumber / totalChunks.current) * 100);
    });
    // event callback: called if an error happens
    uploader.on('chunkError', (e) => {
      setSnackbarOpen(false);
      console.error(`Error uploading chunk number ${e.id} - ${e.res.statusText}`);
    });
    // event callback: called when file is fully uploaded
    uploader.on('done', (finishRes) => {
      console.log(`Upload completed with ID ${finishRes.id}`);
      // set the progress bar to 100
      setProgress(100);
      setSnackbarOpen(false);
    });
    // upload the file
    const readableStream = fileReaderStream(file);
    const tags = [];
    tags.push({ name: TAG_NAMES.appName, value: APP_NAME });
    tags.push({ name: TAG_NAMES.appVersion, value: APP_VERSION });
    tags.push({ name: TAG_NAMES.contentType, value: file.type });
    tags.push({ name: TAG_NAMES.modelTransaction, value: modelTx });
    tags.push({ name: TAG_NAMES.operationName, value: MODEL_ATTACHMENT });
    tags.push({ name: TAG_NAMES.attachmentName, value: file.name });
    tags.push({ name: TAG_NAMES.attachmentRole, value: NOTES_ATTACHMENT });
    tags.push({ name: TAG_NAMES.unixTime, value: (Date.now() / 1000).toString() });
    setSnackbarOpen(true);
    try {
      const res = await uploader.uploadData(readableStream, { tags });
      if (res.status === 200) {
        enqueueSnackbar(
          <>
            Uploaded Usage Notes File
            <br></br>
            <a
              href={`https://viewblock.io/arweave/tx/${res.data.id}`}
              target={'_blank'}
              rel='noreferrer'
            >
              <u>View Transaction in Explorer</u>
            </a>
          </>,
          { variant: 'success' },
        );
      } else {
        enqueueSnackbar(res.statusText, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('An Error Occured.', { variant: 'error' });
    }
  };

  const handleFundFinished = async (node: string, data?: CreateForm) => {
    setFundOpen(false);
    if (!bundlrContext || !bundlrContext.state) return;
    if (!data) {
      data = formData;
    }
    if (!data || !data.file) return;
    const file = data.file;

    if ((await getFilePrice(file.size)) > (await getNodeBalance()))
      enqueueSnackbar('Not Enought Balance in Bundlr Node', { variant: 'error' });

    const uploader = bundlrContext.state.uploader.chunkedUploader;
    const chunkSize = 25 * (1024 * 1024); // default is

    // divide the total file size by the size of each chunk we'll upload
    if (file.size < chunkSize) totalChunks.current = 1;
    else {
      totalChunks.current = Math.floor(file.size / chunkSize);
    }
    /** Register Event Callbacks */
    // event callback: called for every chunk uploaded
    uploader.on('chunkUpload', (chunkInfo) => {
      console.log(chunkInfo);
      console.log(
        `Uploaded Chunk number ${chunkInfo.id}, offset of ${chunkInfo.offset}, size ${chunkInfo.size} Bytes, with a total of ${chunkInfo.totalUploaded} bytes uploaded.`,
      );
      const chunkNumber = chunkInfo.id + 1;
      // update the progress bar based on how much has been uploaded
      if (chunkNumber >= totalChunks.current) setProgress(100);
      else setProgress((chunkNumber / totalChunks.current) * 100);
    });
    // event callback: called if an error happens
    uploader.on('chunkError', (e) => {
      setSnackbarOpen(false);
      console.error(`Error uploading chunk number ${e.id} - ${e.res.statusText}`);
    });
    // event callback: called when file is fully uploaded
    uploader.on('done', (finishRes) => {
      console.log(`Upload completed with ID ${finishRes.id}`);
      // set the progress bar to 100
      setProgress(100);
      setSnackbarOpen(false);
    });
    // upload the file
    const readableStream = fileReaderStream(file);
    const tags = [];
    tags.push({ name: TAG_NAMES.appName, value: APP_NAME });
    tags.push({ name: TAG_NAMES.appVersion, value: APP_VERSION });
    tags.push({ name: TAG_NAMES.contentType, value: file.type });
    tags.push({ name: TAG_NAMES.modelName, value: `${data.name}` });
    tags.push({ name: TAG_NAMES.operationName, value: MODEL_CREATION });
    tags.push({ name: TAG_NAMES.category, value: data.category });
    tags.push({ name: TAG_NAMES.modelFee, value: arweave.ar.arToWinston(`${data.fee}`) });
    if (data.description) tags.push({ name: TAG_NAMES.description, value: data.description });
    tags.push({ name: TAG_NAMES.unixTime, value: (Date.now() / 1000).toString() });
    setSnackbarOpen(true);
    try {
      const res = await uploader.uploadData(readableStream, { tags });
      console.log(`Upload Success: https://arweave.net/${res.data.id}`);
      try {
        const tx = await arweave.createTransaction({
          quantity: arweave.ar.arToWinston(MARKETPLACE_FEE),
          target: MARKETPLACE_ADDRESS,
        });
        tx.addTag(TAG_NAMES.appName, APP_NAME);
        tx.addTag(TAG_NAMES.appVersion, APP_VERSION);
        tx.addTag(TAG_NAMES.contentType, file.type);
        tx.addTag(TAG_NAMES.operationName, MODEL_CREATION_PAYMENT);
        tx.addTag(TAG_NAMES.modelName, data.name);
        tx.addTag(TAG_NAMES.category, data.category);
        tx.addTag(TAG_NAMES.modelFee, arweave.ar.arToWinston(`${data.fee}`));
        if (data.description) tx.addTag(TAG_NAMES.description, data.description);
        tx.addTag(TAG_NAMES.modelTransaction, res.data.id);
        tx.addTag(TAG_NAMES.unixTime, (Date.now() / 1000).toString());
        await arweave.transactions.sign(tx);
        const payRes = await arweave.transactions.post(tx);
        if (payRes.status === 200) {
          enqueueSnackbar(
            <>
              Paid Marketplace Fee {MARKETPLACE_FEE} AR.
              <br></br>
              <a
                href={`https://viewblock.io/arweave/tx/${tx.id}`}
                target={'_blank'}
                rel='noreferrer'
              >
                <u>View Transaction in Explorer</u>
              </a>
            </>,
            { variant: 'success' },
          );
          await uploadUsageNotes(res.data.id, data.name, data.notes);
          if (data.avatar && data.avatar instanceof File) {
            await uploadAvatarImage(res.data.id, data.name, data.avatar);
          }
          reset(); // reset form
        } else {
          enqueueSnackbar(payRes.statusText, { variant: 'error' });
        }
      } catch (error) {
        enqueueSnackbar('An Error Occured.', { variant: 'error' });
      }
    } catch (error) {
      setSnackbarOpen(false);
      setProgress(0);
      setMessage('Upload error ');
    }
  };

  return (
    <Container>
      <Box sx={{ marginTop: '8px' }}>
        <Card sx={{
          background: 'rgba(61, 61, 61, 0.98)',
          borderRadius: '30px',
        }}>
          <CardHeader title='Create Your Model' sx={{ paddingLeft: '48px', paddingTop: '32px'}}>
            {/* <Typography variant="h5" gutterBottom>Create Your Model</Typography> */}
          </CardHeader>
          <CardContent sx={{ paddingBottom: 0, gap: '32px', display: 'flex', flexDirection: 'column' }}>
            <Box display={'flex'} gap={'30px'} width={'100%'} padding='0px 32px'>
              <Box width={'22%'}>
                <AvatarControl name='avatar' control={control} />
              </Box>
              <Box display={'flex'} justifyContent={'space-between'} flexDirection='column' flexGrow={1} width={'30%'}>
                <TextControl
                  name='name'
                  control={control}
                  rules={{ required: true }}
                  mat={{
                    variant: 'outlined',
                    InputProps: {
                      sx: {
                        borderWidth: '1px',
                        borderColor: '#FFF',
                        borderRadius: '16px',
                      }
                    },
                  }}
                  style={{ width: '100%' }}
                />
                <SelectControl
                  name='category'
                  control={control}
                  rules={{ required: true }}
                  mat={{
                    sx: {
                      borderWidth: '1px',
                      borderColor: '#FFF',
                      borderRadius: '16px'
                    }
                  }}
                >
                  <MenuItem value={'text'}>Text</MenuItem>
                  <MenuItem value={'audio'}>Audio</MenuItem>
                  <MenuItem value={'video'}>Video</MenuItem>
                </SelectControl>
                <Box paddingLeft={'8px'}>
                  <Typography
                    sx={{
                      fontStyle: 'normal',
                      fontWeight: 700,
                      fontSize: '23px',
                      lineHeight: '31px',
                      display: 'flex',
                      alignItems: 'center',
                      textAlign: 'center',
                      color: '#FAFAFA',
                    }}
                  >
                    Cost
                  </Typography>
                  <Box
                    display={'flex'}
                    alignItems={'center'}
                    justifyContent='space-between'
                    width={'45%'}
                    height='60px'
                  >
                    <NumberControl
                      name='fee'
                      control={control}
                      mat={{
                        sx: {
                          fontStyle: 'normal',
                          fontWeight: 700,
                          fontSize: '23px',
                          lineHeight: '31px',
                          display: 'flex',
                          alignItems: 'center',
                          textAlign: 'center',
                          color: '#FAFAFA',
                          paddingRight: '8px'
                        }
                      }}
                    />
                    <Icon sx={{ height: '50px', width: '50px' }}>
                      <img src='/arweave-logo.svg' width={'50px'} height={'50px'} />
                    </Icon>
                  </Box>
                </Box>
              </Box>
              <TextControl
                name='description'
                control={control}
                mat={{
                  variant: 'outlined',
                  multiline: true,
                  margin: 'normal',
                  minRows: 6,
                  maxRows: 6,
                  InputProps: {
                    sx: {
                      borderWidth: '1px',
                      borderColor: '#FFF',
                      borderRadius: '23px',
                      height: '100%'
                    }
                  },
                }}
                style={{ width: '40%', marginTop: 0 }}
              />
            </Box>
            <Box padding='0px 32px'>
              <MarkdownControl name='notes' control={control} rules={{ required: true }} />
            </Box>
            <Box padding='0px 32px'>
              <FileControl name='file' control={control} rules={{ required: true }} />
            </Box>
          </CardContent>
          <CardActions sx={{ paddingBottom: '32px', justifyContent: 'center' }}>
            <Button
              onClick={() => reset()}
              sx={{
                border: '1px solid #F4F4F4',
                borderRadius: '7px',
                height: '39px',
                width: '204px'
              }}
            >
              <Typography
                sx={{
                  fontStyle: 'normal',
                  fontWeight: 500,
                  fontSize: '15px',
                  lineHeight: '20px',
                  color: '#F4F4F4',
                }}
              >Reset to Default</Typography>
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={control._formState.isValid}
              sx={{
                background: '#F4F4F4',
                borderRadius: '7px',
                height: '39px',
                width: '204px'
              }}
            >
              <Typography
                sx={{
                  fontStyle: 'normal',
                  fontWeight: 500,
                  fontSize: '15px',
                  lineHeight: '20px',
                  color: '#151515',
                }}
              >Submit</Typography>
            </Button>
          </CardActions>
        </Card>
      </Box>
      <FundDialog
        open={fundOpen}
        setOpen={setFundOpen}
        handleFundFinished={handleFundFinished}
      />
      <Snackbar
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        ClickAwayListenerProps={{ onClickAway: () => null }}
      >
        <Alert severity='info' sx={{ width: '100%', minWidth: '100px' }}>
          Uploading...
          <CustomProgress value={progress}></CustomProgress>
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Upload;
