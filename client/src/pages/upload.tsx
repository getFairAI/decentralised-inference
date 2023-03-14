import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  Dialog,
  Divider,
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
import { useLazyQuery } from '@apollo/client';
import ImagePicker from '@/components/image-picker';
import AvatarControl from '@/components/avatar-control';
import FundDialog from '@/components/fund-dialog';
import CustomProgress from '@/components/progress';
import { GET_IMAGES_TXIDS } from '@/queries/graphql';
import fileReaderStream from 'filereader-stream';
import { APP_VERSION, MARKETPLACE_FEE, NODE1_BUNDLR_URL, MARKETPLACE_ADDRESS } from '@/constants';
import useArweave from '@/context/arweave';
import { BundlrContext } from '@/context/bundlr';
import { useSnackbar } from 'notistack';

export interface CreateForm extends FieldValues {
  name: string;
  fee: number;
  category: string;
  notes: string;
  file: File;
  description?: string;
  avatar?: string;
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
  const [open, setOpen] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, setMessage] = useState('');
  const [formData, setFormData] = useState<CreateForm | undefined>(undefined);
  const totalChunks = useRef(0);
  const { arweave } = useArweave();
  const bundlrContext = useContext(BundlrContext);
  const { enqueueSnackbar } = useSnackbar();

  const [getImageTxIds, { data, error, loading }] = useLazyQuery(GET_IMAGES_TXIDS);

  const handleClickOpen = () => {
    setOpen(true);
    getImageTxIds();
  };
  const handleClose = () => {
    setOpen(false);
  };

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

  const handleFundFinished = async (node: string, data?: CreateForm) => {
    setOpen(false);
    if (!bundlrContext || !bundlrContext.state) return;
    if (!data) {
      data = formData;
    }
    if (!data || !data.file) return;
    const file = data.file;

    if ((await getFilePrice(file.size)) > (await getNodeBalance())) return;

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
    tags.push({ name: 'App-Name', value: 'Fair Protocol' });
    tags.push({ name: 'APP-Version', value: `${APP_VERSION}` });
    tags.push({ name: 'Content-Type', value: file.type });
    tags.push({ name: 'Model-Name', value: `${data.name}` });
    tags.push({ name: 'Operation-Name', value: 'Model Creation' });
    tags.push({ name: 'Notes', value: data.notes });
    tags.push({ name: 'Category', value: data.category });
    tags.push({ name: 'Model-Fee', value: arweave.ar.arToWinston(`${data.fee}`) });
    if (data.avatar) tags.push({ name: 'AvatarUrl', value: data.avatar });
    if (data.description) tags.push({ name: 'Description', value: data.description });
    tags.push({ name: 'Unix-Time', value: (Date.now() / 1000).toString() });
    setSnackbarOpen(true);
    reset(); // reset form
    try {
      const res = await uploader.uploadData(readableStream, { tags });
      console.log(`Upload Success: https://arweave.net/${res.data.id}`);
      try {
        const tx = await arweave.createTransaction({
          quantity: arweave.ar.arToWinston(MARKETPLACE_FEE),
          target: MARKETPLACE_ADDRESS,
        });
        tx.addTag('App-Name', 'Fair Protocol');
        tx.addTag('App-Version', APP_VERSION);
        tx.addTag('Content-Type', file.type);
        tx.addTag('Operation-Name', 'Model Creation Payment');
        tx.addTag('Model-Name', data.name);
        tx.addTag('Notes', data.notes);
        tx.addTag('Category', data.category);
        tx.addTag('Model-Fee', arweave.ar.arToWinston(`${data.fee}`));
        if (data.avatar) tx.addTag('AvatarUrl', data.avatar);
        if (data.description) tx.addTag('Description', data.description);
        tx.addTag('Model-Transaction', res.data.id);
        tx.addTag('Unix-Time', (Date.now() / 1000).toString());
        await arweave.transactions.sign(tx);
        const payRes = await arweave.transactions.post(tx);
        if (payRes.status === 200) {
          enqueueSnackbar(
            `Paid Marketplace Fee ${MARKETPLACE_FEE} AR, TxId: https://arweave.net/${tx.id}`,
            { variant: 'success' },
          );
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
    <Container sx={{ top: '64px', position: 'relative' }}>
      <Box sx={{ marginTop: '8px' }}>
        <Card>
          <CardHeader title='Create Your Model'>
            {/* <Typography variant="h5" gutterBottom>Create Your Model</Typography> */}
          </CardHeader>
          <CardContent>
            <Divider textAlign='left' role='presentation'>
              <Typography variant='h6' gutterBottom>
                General Information
              </Typography>
            </Divider>

            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td colSpan={2} rowSpan={1} style={{ display: 'flex', justifyContent: 'center' }}>
                    <AvatarControl name='avatar' control={control} />
                  </td>
                  <td colSpan={8} rowSpan={2}>
                    <Box display={'flex'} justifyContent={'space-between'}>
                      <TextControl
                        name='name'
                        control={control}
                        rules={{ required: true }}
                        mat={{ variant: 'outlined' }}
                        style={{ width: '70%' }}
                      />
                      <TextControl
                        name='fee'
                        control={control}
                        rules={{ required: true }}
                        mat={{
                          variant: 'outlined',
                          type: 'number',
                          inputProps: {
                            step: 0.01,
                            inputMode: 'numeric',
                            min: 0.01 /* max: currentBalance */,
                          },
                        }}
                        style={{ width: '25%' }}
                      />
                    </Box>
                    <SelectControl name='category' control={control} rules={{ required: true }}>
                      <MenuItem value={'text'}>Text</MenuItem>
                      <MenuItem value={'audio'}>Audio</MenuItem>
                      <MenuItem value={'video'}>Video</MenuItem>
                    </SelectControl>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} rowSpan={1} style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button onClick={handleClickOpen}>Upload</Button>
                    <Dialog onClose={handleClose} open={open}>
                      <ImagePicker
                        data={data}
                        loading={loading}
                        error={error}
                        name='avatar'
                        control={control}
                        closeHandler={handleClose}
                      />
                    </Dialog>
                  </td>
                </tr>
                <tr>
                  <td colSpan={10}>
                    <TextControl
                      name='description'
                      control={control}
                      mat={{
                        variant: 'outlined',
                        multiline: true,
                        margin: 'normal',
                        minRows: 2,
                        maxRows: 3,
                      }}
                      style={{ width: '100%' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <Divider textAlign='left' role='presentation'>
              <Typography variant='h6' gutterBottom>
                Usage Notes
              </Typography>
            </Divider>

            <MarkdownControl name='notes' control={control} rules={{ required: true }} />
            <Divider textAlign='left' role='presentation'>
              <Typography variant='h6' gutterBottom>
                Files
              </Typography>
            </Divider>
            {/* <FileUpload ></FileUpload> */}
            <FileControl name='file' control={control} rules={{ required: true }} />
          </CardContent>
          <CardActions>
            <Button onClick={handleSubmit(onSubmit)} disabled={control._formState.isValid}>
              Submit
            </Button>
            <FundDialog
              open={fundOpen}
              setOpen={setFundOpen}
              handleFundFinished={handleFundFinished}
            />
            <Button onClick={() => reset()} variant={'outlined'}>
              Reset
            </Button>
          </CardActions>
        </Card>
      </Box>
      <Snackbar
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        open={snackbarOpen}
        onClose={handleClose}
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
