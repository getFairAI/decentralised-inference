import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Icon,
  MenuItem,
  Snackbar,
  Typography,
  useTheme,
} from '@mui/material';
import { UIEvent, useContext, useEffect, useRef, useState } from 'react';
import { FieldValues, useController, useForm } from 'react-hook-form';
import TextControl from '@/components/text-control';
import SelectControl from '@/components/select-control';
import MarkdownControl from '@/components/md-control';
import FileControl from '@/components/file-control';
import AvatarControl from '@/components/avatar-control';
import CustomProgress from '@/components/progress';
import {
  APP_VERSION,
  MARKETPLACE_FEE,
  NODE1_BUNDLR_URL,
  TAG_NAMES,
  APP_NAME,
  MODEL_ATTACHMENT,
  AVATAR_ATTACHMENT,
  NOTES_ATTACHMENT,
  SCRIPT_CREATION,
  SCRIPT_CREATION_PAYMENT,
  DEFAULT_TAGS,
  MODEL_FEE_UPDATE,
} from '@/constants';
import { BundlrContext } from '@/context/bundlr';
import { useSnackbar } from 'notistack';
import arweave, { parseWinston } from '@/utils/arweave';
import NumberControl from '@/components/number-control';
import { WalletContext } from '@/context/wallet';
import { WorkerContext } from '@/context/worker';
import { ChunkError, ChunkInfo } from '@/interfaces/bundlr';
import { FundContext } from '@/context/fund';
import { useLazyQuery, useQuery } from '@apollo/client';
import { GET_LATEST_FEE_UPDATE, LIST_MODELS_QUERY } from '@/queries/graphql';
import { IEdge } from '@/interfaces/arweave';
import { findTag } from '@/utils/common';

export interface CreateForm extends FieldValues {
  name: string;
  fee: number;
  category: string;
  notes: string;
  file: File;
  model: string;
  description?: string;
  avatar?: File;
}
const Curators = () => {
  const elementsPerPage = 5;
  const { handleSubmit, reset, control } = useForm<FieldValues>({
    defaultValues: {
      name: '',
      fee: 0,
      category: 'text',
      description: '',
      notes: '',
      avatar: '',
      file: '',
      model: '',
    },
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, setMessage] = useState('');
  const [formData, setFormData] = useState<CreateForm | undefined>(undefined);
  const [hasModelsNextPage, setHasModelsNextPage] = useState(false);
  const totalChunks = useRef(0);
  const { nodeBalance, getPrice, chunkUpload, updateBalance } = useContext(BundlrContext);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const { currentAddress, currentBalance } = useContext(WalletContext);
  const { startJob } = useContext(WorkerContext);
  const { setOpen: setFundOpen } = useContext(FundContext);
  const { field: modelField } = useController({ name: 'model', control });
  const [selectedModelFee, setSelectedModelFee] = useState(0);

  const {
    data: modelsData,
    loading: modelsLoading,
    error: modelsError,
    fetchMore: modelsFetchMore,
  } = useQuery(LIST_MODELS_QUERY, {
    variables: {
      first: elementsPerPage,
    },
    notifyOnNetworkStatusChange: true,
  });

  const [getSelectedModelFeeUpdates, { data: updatedFeeData }] =
    useLazyQuery(GET_LATEST_FEE_UPDATE);

  useEffect(() => {
    if (modelsData) {
      setHasModelsNextPage(modelsData?.transactions?.pageInfo?.hasNextPage || false);
    }
  }, [modelsData]);

  useEffect(() => {
    if (modelField.value && (modelField.value as IEdge)) {
      const value = JSON.parse(modelField.value);
      const updateFeeTags = [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.operationName, values: [MODEL_FEE_UPDATE] },
        { name: TAG_NAMES.modelTransaction, values: [value.node.id] },
      ];
      getSelectedModelFeeUpdates({
        variables: {
          tags: updateFeeTags,
          owner: value.node.owner.address,
        },
      });
    } else {
      setSelectedModelFee(0);
    }
  }, [modelField.value]);

  useEffect(() => {
    if (modelField.value && updatedFeeData && updatedFeeData.transactions.edges.length > 0) {
      const updateFee = findTag(updatedFeeData.transactions.edges[0], 'modelFee');
      setSelectedModelFee(parseFloat(parseWinston(updateFee)));
    } else if (modelField.value) {
      const modelFee = findTag(JSON.parse(modelField.value), 'modelFee');
      setSelectedModelFee(parseFloat(parseWinston(modelFee)));
    }
  }, [updatedFeeData]);

  const onSubmit = async (data: FieldValues) => {
    await updateBalance();
    setFormData(data as CreateForm);

    if (nodeBalance <= 0) {
      setFundOpen(true);
    } else {
      await handleFundFinished(NODE1_BUNDLR_URL, data as CreateForm); // use default node
    }
  };

  const uploadAvatarImage = async (scriptTx: string, image: File) => {
    if ((await getPrice(image.size)).toNumber() > nodeBalance)
      enqueueSnackbar('Not Enought Balance in Bundlr Node', { variant: 'error' });

    /** Register Event Callbacks */
    // event callback: called for every chunk uploaded
    const handleUpload = (chunkInfo: ChunkInfo) => {
      console.log(chunkInfo);
      console.log(
        `Uploaded Chunk number ${chunkInfo.id}, offset of ${chunkInfo.offset}, size ${chunkInfo.size} Bytes, with a total of ${chunkInfo.totalUploaded} bytes uploaded.`,
      );
      const chunkNumber = chunkInfo.id + 1;
      // update the progress bar based on how much has been uploaded
      if (chunkNumber >= totalChunks.current) setProgress(100);
      else setProgress((chunkNumber / totalChunks.current) * 100);
    };
    // event callback: called if an error happens
    const handleError = (e: ChunkError) => {
      setSnackbarOpen(false);
      console.error(
        `Error uploading chunk number ${e.id} - ${(e.res as { statusText: string }).statusText}`,
      );
    };
    // event callback: called when file is fully uploaded
    const handleDone = (finishRes: unknown) => {
      console.log(`Upload completed with ID ${(finishRes as { id: string }).id}`);
      // set the progress bar to 100
      setProgress(100);
      setSnackbarOpen(false);
    };
    // upload the file
    const tags = [];
    tags.push({ name: TAG_NAMES.appName, value: APP_NAME });
    tags.push({ name: TAG_NAMES.appVersion, value: APP_VERSION });
    tags.push({ name: TAG_NAMES.contentType, value: image.type });
    tags.push({ name: TAG_NAMES.scriptTransaction, value: scriptTx });
    tags.push({ name: TAG_NAMES.operationName, value: MODEL_ATTACHMENT });
    tags.push({ name: TAG_NAMES.attachmentName, value: image.name });
    tags.push({ name: TAG_NAMES.attachmentRole, value: AVATAR_ATTACHMENT });
    tags.push({ name: TAG_NAMES.unixTime, value: (Date.now() / 1000).toString() });
    setSnackbarOpen(true);
    try {
      // const res = await uploader.uploadData(readableStream, { tags });
      const res = await chunkUpload(
        image,
        tags,
        totalChunks,
        handleUpload,
        handleError,
        handleDone,
      );
      if (res.status === 200) {
        enqueueSnackbar(
          <>
            Uploaded Avatar Image
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

  const uploadUsageNotes = async (scriptTx: string, scriptName: string, usageNotes: string) => {
    const file = new File([usageNotes], `${scriptName}-usage.md`, {
      type: 'text/markdown',
    });

    if ((await getPrice(file.size)).toNumber() > nodeBalance)
      enqueueSnackbar('Not Enought Balance in Bundlr Node', { variant: 'error' });

    /** Register Event Callbacks */
    // event callback: called for every chunk uploaded
    const handleUpload = (chunkInfo: ChunkInfo) => {
      console.log(chunkInfo);
      console.log(
        `Uploaded Chunk number ${chunkInfo.id}, offset of ${chunkInfo.offset}, size ${chunkInfo.size} Bytes, with a total of ${chunkInfo.totalUploaded} bytes uploaded.`,
      );
      const chunkNumber = chunkInfo.id + 1;
      // update the progress bar based on how much has been uploaded
      if (chunkNumber >= totalChunks.current) setProgress(100);
      else setProgress((chunkNumber / totalChunks.current) * 100);
    };
    // event callback: called if an error happens
    const handleError = (e: ChunkError) => {
      setSnackbarOpen(false);
      console.error(
        `Error uploading chunk number ${e.id} - ${(e.res as { statusText: string }).statusText}`,
      );
    };
    // event callback: called when file is fully uploaded
    const handleDone = (finishRes: unknown) => {
      console.log(`Upload completed with ID ${(finishRes as { id: string }).id}`);
      // set the progress bar to 100
      setProgress(100);
      setSnackbarOpen(false);
    };
    // upload the file
    const tags = [];
    tags.push({ name: TAG_NAMES.appName, value: APP_NAME });
    tags.push({ name: TAG_NAMES.appVersion, value: APP_VERSION });
    tags.push({ name: TAG_NAMES.contentType, value: file.type });
    tags.push({ name: TAG_NAMES.scriptTransaction, value: scriptTx });
    tags.push({ name: TAG_NAMES.operationName, value: MODEL_ATTACHMENT });
    tags.push({ name: TAG_NAMES.attachmentName, value: file.name });
    tags.push({ name: TAG_NAMES.attachmentRole, value: NOTES_ATTACHMENT });
    tags.push({ name: TAG_NAMES.unixTime, value: (Date.now() / 1000).toString() });
    setSnackbarOpen(true);
    try {
      const res = await chunkUpload(file, tags, totalChunks, handleUpload, handleError, handleDone);
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
    if (!data) {
      data = formData;
    }
    if (!data || !data.file) return;
    const file = data.file;

    if ((await getPrice(file.size)).toNumber() > nodeBalance)
      enqueueSnackbar('Not Enought Balance in Bundlr Node', { variant: 'error' });

    /** Register Event Callbacks */
    // event callback: called for every chunk uploaded
    const handleUpload = (chunkInfo: ChunkInfo) => {
      console.log(chunkInfo);
      console.log(
        `Uploaded Chunk number ${chunkInfo.id}, offset of ${chunkInfo.offset}, size ${chunkInfo.size} Bytes, with a total of ${chunkInfo.totalUploaded} bytes uploaded.`,
      );
      const chunkNumber = chunkInfo.id + 1;
      // update the progress bar based on how much has been uploaded
      if (chunkNumber >= totalChunks.current) setProgress(100);
      else setProgress((chunkNumber / totalChunks.current) * 100);
    };
    // event callback: called if an error happens
    const handleError = (e: ChunkError) => {
      setSnackbarOpen(false);
      console.error(
        `Error uploading chunk number ${e.id} - ${(e.res as { statusText: string }).statusText}`,
      );
    };
    // event callback: called when file is fully uploaded
    const handleDone = (finishRes: unknown) => {
      console.log(`Upload completed with ID ${(finishRes as { id: string }).id}`);
      // set the progress bar to 100
      setProgress(100);
      setSnackbarOpen(false);
    };
    // upload the file
    const tags = [];
    const modelData = JSON.parse(data.model) as IEdge;
    const winstonFee = arweave.ar.arToWinston(selectedModelFee.toString());

    if (currentBalance < selectedModelFee) {
      enqueueSnackbar(
        `Not Enought Balance in your Wallet to pay Model Fee (${selectedModelFee} AR)`,
        { variant: 'error' },
      );
      return;
    }

    tags.push({ name: TAG_NAMES.appName, value: APP_NAME });
    tags.push({ name: TAG_NAMES.appVersion, value: APP_VERSION });
    tags.push({ name: TAG_NAMES.contentType, value: file.type });
    tags.push({ name: TAG_NAMES.scriptName, value: `${data.name}` });
    tags.push({ name: TAG_NAMES.category, value: data.category });
    tags.push({ name: TAG_NAMES.modelName, value: findTag(modelData, 'modelName') as string });
    tags.push({ name: TAG_NAMES.modelCreator, value: modelData.node.owner.address });
    tags.push({
      name: TAG_NAMES.modelTransaction,
      value: findTag(modelData, 'modelTransaction') as string,
    });
    tags.push({ name: TAG_NAMES.operationName, value: SCRIPT_CREATION });
    tags.push({ name: TAG_NAMES.scriptFee, value: arweave.ar.arToWinston(`${data.fee}`) });
    tags.push({ name: TAG_NAMES.paymentQuantity, value: winstonFee });
    tags.push({ name: TAG_NAMES.paymentTarget, value: modelData.node.owner.address });
    if (data.description) tags.push({ name: TAG_NAMES.description, value: data.description });
    tags.push({ name: TAG_NAMES.unixTime, value: (Date.now() / 1000).toString() });
    setSnackbarOpen(true);
    try {
      const res = await chunkUpload(file, tags, totalChunks, handleUpload, handleError, handleDone);
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
        return;
      }
      try {
        const tx = await arweave.createTransaction({
          quantity: winstonFee,
          target: modelData.node.owner.address,
        });
        tx.addTag(TAG_NAMES.appName, APP_NAME);
        tx.addTag(TAG_NAMES.appVersion, APP_VERSION);
        tx.addTag(TAG_NAMES.contentType, file.type);
        tx.addTag(TAG_NAMES.operationName, SCRIPT_CREATION_PAYMENT);
        tx.addTag(TAG_NAMES.scriptName, `${data.name}`);
        tx.addTag(TAG_NAMES.category, data.category);
        tx.addTag(TAG_NAMES.modelName, findTag(modelData, 'modelName') as string);
        tx.addTag(TAG_NAMES.modelCreator, modelData.node.owner.address);
        tx.addTag(TAG_NAMES.modelTransaction, findTag(modelData, 'modelTransaction') as string);
        tx.addTag(TAG_NAMES.scriptFee, arweave.ar.arToWinston(`${data.fee}`));
        tx.addTag(TAG_NAMES.scriptTransaction, res.data.id);
        if (data.description) tx.addTag(TAG_NAMES.description, data.description);
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
          startJob({
            address: currentAddress,
            operationName: SCRIPT_CREATION,
            tags,
            txid: res.data.id,
            encodedTags: false,
          });
          await uploadUsageNotes(res.data.id, data.name, data.notes);
          if (data.avatar && data.avatar instanceof File) {
            await uploadAvatarImage(res.data.id, data.avatar);
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
      enqueueSnackbar('An Error Occured.', { variant: 'error' });
    }
  };

  const selectLoadMore = (event: UIEvent<HTMLDivElement>) => {
    const bottom =
      event.currentTarget.scrollHeight - event.currentTarget.scrollTop <=
      event.currentTarget.clientHeight + 100;
    if (bottom && hasModelsNextPage) {
      // user is at the end of the list so load more items
      modelsFetchMore({
        variables: {
          after:
            modelsData && modelsData.transactions.edges.length > 0
              ? modelsData.transactions.edges[modelsData.transactions.edges.length - 1].cursor
              : undefined,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          const newData = fetchMoreResult.transactions.edges;

          const merged: IEdge[] =
            prev && prev.transactions?.edges ? prev.transactions.edges.slice(0) : [];
          for (let i = 0; i < newData.length; ++i) {
            if (!merged.find((el: IEdge) => el.node.id === newData[i].node.id)) {
              merged.push(newData[i]);
            }
          }
          const newResult = Object.assign({}, prev, {
            transactions: {
              edges: merged,
              pageInfo: fetchMoreResult.transactions.pageInfo,
            },
          });
          return newResult;
        },
      });
    }
  };

  return (
    <Container
      sx={{
        padding: 0,
        margin: 0,
        height: '100%',
        '@media all': {
          maxWidth: '100%',
          padding: 0,
          blockSize: 'auto',
        },
      }}
    >
      <Backdrop
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          position: 'relative',
          height: '100%',
          width: '100%',
        }}
        open={true}
      >
        <Container maxWidth={'lg'}>
          <Box sx={{ marginTop: '8px' }}>
            <Card
              sx={{
                background:
                  theme.palette.mode === 'dark'
                    ? theme.palette.neutral.main
                    : theme.palette.background.default,
                borderRadius: '30px',
              }}
            >
              <CardHeader title='Upload Script' sx={{ paddingLeft: '48px', paddingTop: '32px' }}>
                {/* <Typography variant="h5" gutterBottom>Create Your Model</Typography> */}
              </CardHeader>
              <CardContent
                sx={{ paddingBottom: 0, gap: '32px', display: 'flex', flexDirection: 'column' }}
              >
                <Box display={'flex'} gap={'30px'} width={'100%'} padding='0px 32px'>
                  <Box width={'22%'}>
                    <AvatarControl name='avatar' control={control} />
                  </Box>
                  <Box
                    display={'flex'}
                    justifyContent={'space-between'}
                    flexDirection='column'
                    flexGrow={1}
                    width={'30%'}
                  >
                    <TextControl
                      name='name'
                      control={control}
                      rules={{ required: true }}
                      mat={{
                        variant: 'outlined',
                        InputProps: {
                          sx: {
                            borderWidth: '1px',
                            borderColor: theme.palette.text.primary,
                            borderRadius: '16px',
                          },
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
                          borderColor: theme.palette.text.primary,
                          borderRadius: '16px',
                        },
                        placeholder: 'Select a Category',
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
                          rules={{ required: true, min: 0.001 }}
                          mat={{
                            sx: {
                              fontStyle: 'normal',
                              fontWeight: 700,
                              fontSize: '23px',
                              lineHeight: '31px',
                              display: 'flex',
                              alignItems: 'center',
                              textAlign: 'center',
                              paddingRight: '8px',
                            },
                          }}
                        />
                        <Icon sx={{ height: '50px', width: '50px' }}>
                          <img
                            src={
                              theme.palette.mode === 'dark'
                                ? './arweave-logo.svg'
                                : './arweave-logo-for-light.png'
                            }
                            width={'50px'}
                            height={'50px'}
                          />
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
                          borderColor: theme.palette.text.primary,
                          borderRadius: '23px',
                          height: '100%',
                        },
                      },
                    }}
                    style={{ width: '40%', marginTop: 0 }}
                  />
                </Box>
                <Box padding='0px 32px'>
                  <SelectControl
                    name='model'
                    control={control}
                    rules={{ required: true }}
                    helperText={
                      selectedModelFee ? `Selected Model Fee is ${selectedModelFee} AR` : ''
                    }
                    mat={{
                      placeholder: 'Choose a Model',
                      sx: {
                        borderWidth: '1px',
                        borderColor: theme.palette.text.primary,
                        borderRadius: '16px',
                      },
                      renderValue: (selected) => (
                        <Box
                          sx={{
                            display: 'flex',
                            gap: '16px',
                          }}
                        >
                          <Typography>
                            {findTag(JSON.parse(selected as string), 'modelName')}
                          </Typography>
                          <Typography sx={{ opacity: '0.5' }}>
                            {JSON.parse(selected as string).node.owner.address}
                            {` (Creator: ${JSON.parse(selected as string).node.owner.address.slice(
                              0,
                              10,
                            )}...${JSON.parse(selected as string).node.owner.address.slice(-3)})`}
                          </Typography>
                        </Box>
                      ),
                      MenuProps: {
                        PaperProps: {
                          onScroll: selectLoadMore,
                          sx: {
                            maxHeight: '144px',
                            overflowY: modelsLoading ? 'hidden' : 'auto',
                          },
                        },
                      },
                    }}
                  >
                    {modelsLoading && (
                      <Backdrop
                        sx={{
                          zIndex: (theme) => theme.zIndex.drawer + 1,
                          borderRadius: '23px',
                          backdropFilter: 'blur(1px)',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'absolute',
                          height: '144px',
                        }}
                        open={true}
                      >
                        <CircularProgress color='primary'></CircularProgress>
                      </Backdrop>
                    )}
                    {modelsError ? (
                      <Box>
                        <Typography>Could Not Fetch Available Models</Typography>
                      </Box>
                    ) : modelsData && modelsData.transactions.edges.length > 0 ? (
                      modelsData.transactions.edges.map((el: IEdge) => (
                        <MenuItem
                          key={el.node.id}
                          value={JSON.stringify(el)}
                          sx={{
                            display: 'flex',
                            gap: '16px',
                          }}
                        >
                          <Typography>{findTag(el, 'modelName')}</Typography>
                          <Typography sx={{ opacity: '0.5' }}>
                            {el.node.id}
                            {` (Creator: ${el.node.owner.address.slice(
                              0,
                              10,
                            )}...${el.node.owner.address.slice(-3)})`}
                          </Typography>
                        </MenuItem>
                      ))
                    ) : (
                      <Box>
                        <Typography>There Are no Available Models</Typography>
                      </Box>
                    )}
                  </SelectControl>
                </Box>
                <Box padding='0px 32px'>
                  <MarkdownControl props={{ name: 'notes', control, rules: { required: true } }} />
                </Box>
                <Box padding='0px 32px'>
                  <FileControl name='file' control={control} rules={{ required: true }} />
                </Box>
              </CardContent>
              <CardActions sx={{ paddingBottom: '32px', justifyContent: 'center' }}>
                <Button
                  onClick={() => reset()}
                  sx={{
                    // border: `1px solid ${theme.palette.text.primary}`,
                    borderRadius: '7px',
                    height: '39px',
                    width: '204px',
                  }}
                  variant='outlined'
                >
                  <Typography
                    sx={{
                      fontStyle: 'normal',
                      fontWeight: 500,
                      fontSize: '15px',
                      lineHeight: '20px',
                    }}
                  >
                    Reset to Default
                  </Typography>
                </Button>
                <Button
                  onClick={handleSubmit(onSubmit)}
                  disabled={
                    (!control._formState.isValid && control._formState.isDirty) ||
                    !currentAddress ||
                    !selectedModelFee
                  }
                  sx={{
                    borderRadius: '7px',
                    height: '39px',
                    width: '204px',
                  }}
                  variant='contained'
                >
                  <Typography
                    sx={{
                      fontStyle: 'normal',
                      fontWeight: 500,
                      fontSize: '15px',
                      lineHeight: '20px',
                    }}
                  >
                    Submit
                  </Typography>
                </Button>
              </CardActions>
            </Card>
          </Box>
          <Snackbar
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            open={snackbarOpen}
            onClose={() => setSnackbarOpen(false)}
            ClickAwayListenerProps={{ onClickAway: () => null }}
          >
            <Alert severity='info' sx={{ width: '100%', minWidth: '300px' }}>
              Uploading...
              <CustomProgress value={progress}></CustomProgress>
            </Alert>
          </Snackbar>
        </Container>
      </Backdrop>
    </Container>
  );
};

export default Curators;
