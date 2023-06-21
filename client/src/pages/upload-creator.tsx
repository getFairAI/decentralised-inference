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

import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  Snackbar,
  Typography,
  useTheme,
} from '@mui/material';
import { useCallback, useContext, useRef, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import TextControl from '@/components/text-control';
import MarkdownControl from '@/components/md-control';
import FileControl from '@/components/file-control';
import AvatarControl from '@/components/avatar-control';
import CustomProgress from '@/components/progress';
import {
  APP_VERSION,
  MARKETPLACE_FEE,
  VAULT_ADDRESS,
  TAG_NAMES,
  APP_NAME,
  MODEL_CREATION,
  MODEL_CREATION_PAYMENT,
  MODEL_ATTACHMENT,
  AVATAR_ATTACHMENT,
  NOTES_ATTACHMENT,
  secondInMS,
  successStatusCode,
  U_DIVIDER,
} from '@/constants';
import { BundlrContext } from '@/context/bundlr';
import { useSnackbar } from 'notistack';
import { WalletContext } from '@/context/wallet';
import { ChunkError, ChunkInfo } from '@/interfaces/bundlr';
import { FundContext } from '@/context/fund';
import { ITag } from '@/interfaces/arweave';
import DebounceButton from '@/components/debounce-button';
import { sendU } from '@/utils/u';

export interface CreateForm extends FieldValues {
  name: string;
  notes: string;
  file: File;
  description?: string;
  avatar?: File;
}
const UploadCreator = () => {
  const { handleSubmit, reset, control } = useForm({
    defaultValues: {
      name: '',
      description: '',
      notes: '',
      avatar: '',
      file: '',
    },
  } as FieldValues);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, setMessage] = useState('');
  const [formData, setFormData] = useState<CreateForm | undefined>(undefined);
  const totalChunks = useRef(0);
  const { nodeBalance, getPrice, chunkUpload, updateBalance } = useContext(BundlrContext);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const { currentAddress, currentUBalance, updateUBalance } = useContext(WalletContext);
  const { setOpen: setFundOpen } = useContext(FundContext);

  const onSubmit = async (data: FieldValues) => {
    await updateBalance();
    setFormData(data as CreateForm);

    if (nodeBalance <= 0) {
      setFundOpen(true);
    } else {
      await handleFundFinished(data as CreateForm);
    }
  };

  const bundlrUpload = async (fileToUpload: File, tags: ITag[], successMessage: string) => {
    const filePrice = await getPrice(fileToUpload.size);
    if (filePrice.toNumber() > nodeBalance) {
      enqueueSnackbar('Not Enought Balance in Bundlr Node', { variant: 'error' });
    }
    const finishedPercentage = 100;

    /** Register Event Callbacks */
    // event callback: called for every chunk uploaded
    const handleUpload = (chunkInfo: ChunkInfo) => {
      const chunkNumber = chunkInfo.id + 1;
      // update the progress bar based on how much has been uploaded
      if (chunkNumber >= totalChunks.current) {
        setProgress(finishedPercentage);
      } else {
        setProgress((chunkNumber / totalChunks.current) * finishedPercentage);
      }
    };

    // event callback: called if an error happens
    const handleError = (e: ChunkError) => {
      setSnackbarOpen(false);
      enqueueSnackbar(
        `Error uploading chunk number ${e.id} - ${(e.res as { statusText: string }).statusText}`,
        { variant: 'error' },
      );
    };

    // event callback: called when file is fully uploaded
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleDone = (_finishRes: unknown) => {
      // set the progress bar to 100
      setProgress(finishedPercentage);
      setSnackbarOpen(false);
    };

    const res = await chunkUpload(
      fileToUpload,
      tags,
      totalChunks,
      handleUpload,
      handleError,
      handleDone,
    );
    if (res.status === successStatusCode) {
      enqueueSnackbar(
        <>
          {successMessage} <br></br>
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
      throw new Error(res.statusText);
    }

    return res;
  };

  const uploadAvatarImage = async (modelTx: string, image?: File) => {
    if (!image || !(image instanceof File)) {
      return;
    }

    // upload the file
    const tags = [];
    tags.push({ name: TAG_NAMES.appName, value: APP_NAME });
    tags.push({ name: TAG_NAMES.appVersion, value: APP_VERSION });
    tags.push({ name: TAG_NAMES.contentType, value: image.type });
    tags.push({ name: TAG_NAMES.modelTransaction, value: modelTx });
    tags.push({ name: TAG_NAMES.operationName, value: MODEL_ATTACHMENT });
    tags.push({ name: TAG_NAMES.attachmentName, value: image.name });
    tags.push({ name: TAG_NAMES.attachmentRole, value: AVATAR_ATTACHMENT });
    tags.push({ name: TAG_NAMES.unixTime, value: (Date.now() / secondInMS).toString() });
    setSnackbarOpen(true);

    await bundlrUpload(image, tags, 'Avatar Uploaded Successfully');
  };

  const uploadUsageNotes = async (modelTx: string, modelName: string, usageNotes: string) => {
    const file = new File([usageNotes], `${modelName}-usage.md`, {
      type: 'text/markdown',
    });

    // upload the file
    const tags = [];
    tags.push({ name: TAG_NAMES.appName, value: APP_NAME });
    tags.push({ name: TAG_NAMES.appVersion, value: APP_VERSION });
    tags.push({ name: TAG_NAMES.contentType, value: file.type });
    tags.push({ name: TAG_NAMES.modelTransaction, value: modelTx });
    tags.push({ name: TAG_NAMES.operationName, value: MODEL_ATTACHMENT });
    tags.push({ name: TAG_NAMES.attachmentName, value: file.name });
    tags.push({ name: TAG_NAMES.attachmentRole, value: NOTES_ATTACHMENT });
    tags.push({ name: TAG_NAMES.unixTime, value: (Date.now() / secondInMS).toString() });
    setSnackbarOpen(true);

    await bundlrUpload(file, tags, 'Usage Notes Uploaded Successfully');
  };

  const handleFundFinished = async (data?: CreateForm) => {
    setFundOpen(false);
    if (!data) {
      data = formData;
    }

    if (!data?.file) {
      enqueueSnackbar('No File Selected', { variant: 'error' });
      return;
    }

    const file = data.file;

    // upload the file
    const tags = [];
    const parsedUFee = parseFloat(MARKETPLACE_FEE) * U_DIVIDER;

    if (currentUBalance < parseInt(MARKETPLACE_FEE, 10)) {
      enqueueSnackbar('Not Enough Balance in your Wallet to pay MarketPlace Fee', {
        variant: 'error',
      });
      return;
    }

    tags.push({ name: TAG_NAMES.appName, value: APP_NAME });
    tags.push({ name: TAG_NAMES.appVersion, value: APP_VERSION });
    tags.push({ name: TAG_NAMES.contentType, value: file.type });
    tags.push({ name: TAG_NAMES.modelName, value: `${data.name}` });
    tags.push({ name: TAG_NAMES.operationName, value: MODEL_CREATION });
    tags.push({ name: TAG_NAMES.paymentQuantity, value: parsedUFee.toString() });
    tags.push({ name: TAG_NAMES.paymentTarget, value: VAULT_ADDRESS });
    if (data.description) {
      tags.push({ name: TAG_NAMES.description, value: data.description });
    }
    tags.push({ name: TAG_NAMES.unixTime, value: (Date.now() / secondInMS).toString() });
    setSnackbarOpen(true);
    try {
      const res = await bundlrUpload(file, tags, 'Model Uploaded Successfully');

      const paymentTags = [
        { name: TAG_NAMES.appName, value: APP_NAME },
        { name: TAG_NAMES.appVersion, value: APP_VERSION },
        { name: TAG_NAMES.contentType, value: file.type },
        { name: TAG_NAMES.operationName, value: MODEL_CREATION_PAYMENT },
        { name: TAG_NAMES.modelName, value: data.name },
        { name: TAG_NAMES.modelTransaction, value: res.data.id },
        { name: TAG_NAMES.unixTime, value: (Date.now() / secondInMS).toString() },
      ];

      if (data.description) {
        paymentTags.push({ name: TAG_NAMES.description, value: data.description });
      }

      const paymentId = await sendU(VAULT_ADDRESS, parsedUFee.toString(), paymentTags);
      await updateUBalance();
      enqueueSnackbar(
        <>
          Paid Marketplace Fee: {MARKETPLACE_FEE} U Tokens.
          <br></br>
          <a
            href={`https://viewblock.io/arweave/tx/${paymentId}`}
            target={'_blank'}
            rel='noreferrer'
          >
            <u>View Transaction in Explorer</u>
          </a>
        </>,
        { variant: 'success' },
      );

      try {
        await uploadUsageNotes(res.data.id, data.name, data.notes);
        await uploadAvatarImage(res.data.id, data.avatar);
      } catch (error) {
        enqueueSnackbar('Error Uploading An Attchment', { variant: 'error' });
        // error uploading attachments
      }
      reset(); // reset form
    } catch (error) {
      setSnackbarOpen(false);
      setProgress(0);
      setMessage('Upload error ');
      enqueueSnackbar('An Error Occured.', { variant: 'error' });
    }
  };

  const handleReset = useCallback(() => reset(), [reset]);

  const handleCloseSnackbar = useCallback(() => setSnackbarOpen(false), [setSnackbarOpen]);

  return (
    <Container
      sx={{
        padding: 0,
        margin: 0,
        height: '100%',
        blockSize: 'auto',
        '@media all': {
          maxWidth: '100%',
          padding: 0,
        },
        '@media (min-height: 1240px)': {
          blockSize: '100%',
        },
      }}
    >
      <Backdrop
        sx={{
          zIndex: theme.zIndex.drawer + 1,
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
              <CardHeader title='Upload model' sx={{ paddingLeft: '48px', paddingTop: '32px' }} />
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
                    style={{ width: '40%', marginTop: 0, height: '219px' }}
                  />
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
                  onClick={handleReset}
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
                <DebounceButton
                  onClick={handleSubmit(onSubmit)}
                  disabled={
                    (!control._formState.isValid && control._formState.isDirty) || !currentAddress
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
                </DebounceButton>
              </CardActions>
            </Card>
          </Box>
          <Snackbar
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            open={snackbarOpen}
            onClose={handleCloseSnackbar}
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

export default UploadCreator;
