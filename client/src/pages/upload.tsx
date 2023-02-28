
import { Alert, Box, Button, Card, CardActions, CardContent, CardHeader, Container, Dialog, Divider, MenuItem, Snackbar, Typography } from "@mui/material";
import { useRef, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import TextControl from "@/components/text-control";
import SelectControl from "@/components/select-control";
import MarkdownControl from "@/components/md-control";
import FileControl from "@/components/file-control";
import { useLazyQuery } from "@apollo/client";
import ImagePicker from "@/components/image-picker";
import AvatarControl from "@/components/avatar-control";
import { WebBundlr } from "bundlr-custom";
import FundDialog from "@/components/fund-dialog";
import CustomProgress from "@/components/progress";
import { GET_IMAGES_TXIDS } from "@/queries/graphql";
import fileReaderStream from "filereader-stream";

export interface CreateForm extends FieldValues {
  name: string;
  category: string;
  notes: string;
  file: File;
  description?: string;
  avatar?: string;
}
const Upload = () => {
  const {
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      name: '',
      description: '',
      notes: '',
      avatar: '',
      file: '',
      category: 'text'
    }
  });
  const [ open, setOpen ] = useState(false);
  const [ fundOpen, setFundOpen ] = useState(false);
  const [ snackbarOpen, setSnackbarOpen ] = useState(false);
  const [ progress, setProgress ] = useState(0);
  const [ message, setMessage ] = useState('');
  const [ formData, setFormData ] = useState<CreateForm | undefined>(undefined); 
  const totalChunks = useRef(0);

  const [ getImageTxIds, {data, error, loading} ] = useLazyQuery(GET_IMAGES_TXIDS);


  const handleClickOpen = () => {
    setOpen(true);
    getImageTxIds();
  };
  const handleClose = () => {
    setOpen(false);
  };
 
  const onSubmit = async (data: FieldValues) => {
    setFormData(data as CreateForm);
  
    if (await getNodeBalance() <= 0) {
      setFundOpen(true);
    } else {
      handleFundFinished('https://node1.bundlr.network'); // use default node
    }
  };

  const getNodeBalance = async () => {
    const bundlr = new WebBundlr('https://node1.bundlr.network', "arweave", window.arweaveWallet);
    await bundlr.ready();
    let atomicBalance = await bundlr.getLoadedBalance();

    // Convert balance to an easier to read format
    let convertedBalance = bundlr.utils.unitConverter(atomicBalance);
    return convertedBalance.toNumber();
  }

  const getFilePrice = async (fileSize: number) => {
    // Check the price to upload 1MB of data
    // The function accepts a number of bytes, so to check the price of
    // 1MB, check the price of 1,048,576 bytes.
    const bundlr = new WebBundlr('https://node1.bundlr.network', "arweave", window.arweaveWallet);
    await bundlr.ready();
    
    const atomicPrice = await bundlr.getPrice(fileSize);
    // To ensure accuracy when performing mathematical operations
    // on fractional numbers in JavaScript, it is common to use atomic units.
    // This is a way to represent a floating point (decimal) number using non-decimal notation.
    // Once we have the value in atomic units, we can convert it into something easier to read.
    const priceConverted = bundlr.utils.unitConverter(atomicPrice);
    return priceConverted.toNumber();
  }

  const handleFundFinished = async (node: string) => {
    setOpen(false);

    if (!formData || !formData.file) return;
    const file = formData.file;

    if (await getFilePrice(file.size) > await getNodeBalance()) return;
    
    await window.arweaveWallet.connect(['ACCESS_ALL_ADDRESSES', 'ACCESS_PUBLIC_KEY', 'SIGNATURE', 'ACCESS_ADDRESS' ]);
    const bundlr = new WebBundlr(node, "arweave", { ...window.arweaveWallet });
    await bundlr.ready();
    console.log(bundlr.currencyConfig);
    console.log(bundlr.currency);
    console.log(bundlr.getSigner().publicKey);

    const uploader = bundlr.uploader.chunkedUploader;
    const chunkSize = 25 * (1024 * 1024); // default is

    // divide the total file size by the size of each chunk we'll upload
    if (file.size < chunkSize) totalChunks.current = 1;
    else {
      totalChunks.current = Math.floor(file.size / chunkSize);
    }
    /** Register Event Callbacks */
    // event callback: called for every chunk uploaded
    uploader.on("chunkUpload", (chunkInfo) => {
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
    uploader.on("chunkError", (e) => {
        setSnackbarOpen(false);
        console.error(
            `Error uploading chunk number ${e.id} - ${e.res.statusText}`,
        );
    });
    // event callback: called when file is fully uploaded
    uploader.on("done", (finishRes) => {
        console.log(`Upload completed with ID ${finishRes.id}`);
        // set the progress bar to 100
        setProgress(100);
        setSnackbarOpen(false);
    });
    // upload the file
    const readableStream = fileReaderStream(file);
    const tags = [];
    tags.push({ name: 'App-Name', value: 'Fair Protocol'});
    tags.push({ name: "Content-Type", value: file.type });
    tags.push({ name: 'Model-Transaction', value: formData.name });
    tags.push({ name: 'Operation-Name', value: 'Model Creation' });
    tags.push({ name: 'Notes', value: formData.notes });
    tags.push({ name: 'Category', value: formData.category });
    if (formData.avatar) tags.push({ name: 'AvatarUrl', value: formData.avatar });
    if (formData.description) tags.push({ name: 'Description', value: formData.description });
    setSnackbarOpen(true);
    reset(); // reset form
    await uploader
      .uploadData(readableStream, { tags })
      .then((res) => {
          console.log(`Upload Success: https://arweave.net/${res.data.id}`);
          // setUploadedURL("https://arweave.net/" + res.data.id);
      })
      .catch((e) => {
          setSnackbarOpen(false);
          setProgress(0);
          setMessage("Upload error "+ e.message);
          console.log("error on upload, ", e);
      });
  };

  return (
    <Container sx={{ top: '64px', position: 'relative' }}>
      <Box sx={{ marginTop: '8px' }}>
        <Card>
          <CardHeader title="Create Your Model">
            {/* <Typography variant="h5" gutterBottom>Create Your Model</Typography> */}
          </CardHeader>
          <CardContent>
            <Divider textAlign="left" role="presentation">
              <Typography variant="h6" gutterBottom>General Information</Typography>
            </Divider>

            <table style={ { width: "100%"}}>
              <tbody>
                <tr>
                  <td colSpan={2} rowSpan={1} style={{ display: 'flex', justifyContent: 'center' }}>
                    <AvatarControl name='avatar' control={control} />
                  </td>
                  <td colSpan={8} rowSpan={2}>
                    <TextControl name='name' control={control} rules={{ required: true }} mat={{variant: 'outlined'}} style={{ width: '100%' }}/>
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
                      <ImagePicker data={data} loading={loading} error={error} name='avatar' control={control} closeHandler={handleClose}/>
                    </Dialog>
                  </td>
                </tr>
                <tr>
                  <td colSpan={10}>
                    <TextControl name='description' control={control} mat={{variant: 'outlined', multiline: true, margin: 'normal', minRows: 2, maxRows: 3 }} style={{ width: '100%' }}/>
                  </td>
                </tr>
              </tbody>
            </table>
            <Divider textAlign="left" role="presentation">
              <Typography variant="h6" gutterBottom>Usage Notes</Typography>
            </Divider>
            
            <MarkdownControl name="notes" control={control} rules={{ required: true }}/>
            <Divider textAlign="left" role="presentation">
              <Typography variant="h6" gutterBottom>Files</Typography>
            </Divider>
            {/* <FileUpload ></FileUpload> */}
            <FileControl name="file" control={control} rules={{required: true }}/>
          </CardContent>
        <CardActions>
          <Button onClick={handleSubmit(onSubmit)} disabled={control._formState.isValid}>Submit</Button>
          <FundDialog open={fundOpen} setOpen={setFundOpen} handleFundFinished={handleFundFinished}/>
          <Button onClick={() => reset()} variant={"outlined"}>Reset</Button>
        </CardActions>
        </Card>
      </Box>
      <Snackbar
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        open={snackbarOpen}
        onClose={handleClose}
        ClickAwayListenerProps={{ onClickAway: () => null }}
      >
        <Alert severity='info'  sx={{ width: '100%', minWidth: '100px'}}>
          Uploading...
          <CustomProgress value={progress}></CustomProgress>
        </Alert>
        
      </Snackbar>
    </Container>
  )
};

export default Upload;