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
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  MenuItem,
  Snackbar,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ChangeEvent,
  UIEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  MouseEvent,
} from 'react';
import {
  Control,
  FieldValues,
  UseControllerProps,
  UseFormSetValue,
  useController,
  useForm,
} from 'react-hook-form';
import TextControl from '@/components/text-control';
import SelectControl from '@/components/select-control';
import MarkdownControl from '@/components/md-control';
import FileControl from '@/components/file-control';
import AvatarControl from '@/components/avatar-control';
import CustomProgress from '@/components/progress';
import {
  APP_VERSION,
  TAG_NAMES,
  APP_NAME,
  SCRIPT_CREATION,
  SCRIPT_CREATION_PAYMENT,
  secondInMS,
  U_DIVIDER,
  SCRIPT_CREATION_FEE,
  VAULT_ADDRESS,
  MODEL_CREATION_PAYMENT_TAGS,
  SCRIPT_CREATION_PAYMENT_TAGS,
} from '@/constants';
import { BundlrContext } from '@/context/bundlr';
import { useSnackbar } from 'notistack';
import { WalletContext } from '@/context/wallet';
import { FundContext } from '@/context/fund';
import { ApolloError, useQuery } from '@apollo/client';
import { FIND_BY_TAGS } from '@/queries/graphql';
import { IContractEdge, IContractQueryResult } from '@/interfaces/arweave';
import {
  bundlrUpload,
  commonUpdateQuery,
  displayShortTxOrAddr,
  findTag,
  uploadAvatarImage,
  uploadUsageNotes,
} from '@/utils/common';
import DebounceButton from '@/components/debounce-button';
import { sendU } from '@/utils/u';
import { filterPreviousVersions, isFakeDeleted } from '@/utils/script';
import CachedIcon from '@mui/icons-material/Cached';
import { fetchMoreFn } from '@/utils/apollo';

export interface CreateForm extends FieldValues {
  name: string;
  fee: number;
  category: string;
  notes: string;
  file: File;
  model: string;
  script: string;
  description?: string;
  avatar?: File;
  allow: { allowFiles: boolean; allowText: boolean };
}
const AllowGroupControl = (props: UseControllerProps) => {
  const { field } = useController(props);

  const error = useMemo(() => {
    const values = field.value as { allowFiles: boolean; allowText: boolean };
    if (!values.allowFiles && !values.allowText) {
      return true;
    } else {
      return false;
    }
  }, [field]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const values = field.value as { allowFiles: boolean; allowText: boolean };
      if (event.target.name === 'allowFiles') {
        field.onChange({
          ...values,
          allowFiles: !values.allowFiles,
        });
      } else if (event.target.name === 'allowText') {
        field.onChange({
          ...values,
          allowText: !values.allowText,
        });
      } else {
        // do nothing
      }
    },
    [field],
  );

  return (
    <FormControl required error={error} variant='outlined'>
      <FormLabel>Choose the available Input/Output of promts in Application chat</FormLabel>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={field.value.allowFiles}
              onChange={handleChange}
              name='allowFiles'
              onBlur={field.onBlur}
            />
          }
          label='Allow Files'
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={field.value.allowText}
              onChange={handleChange}
              name='allowText'
              onBlur={field.onBlur}
            />
          }
          label='Allow Text'
        />
      </FormGroup>
      {error && <FormHelperText>Please Choose at least one of the options</FormHelperText>}
    </FormControl>
  );
};

const ScriptOption = ({
  el,
  setValue,
  modelsData,
}: {
  el: IContractEdge;
  setValue?: UseFormSetValue<FieldValues>;
  modelsData?: IContractQueryResult;
}) => {
  const handleScriptChoice = useCallback(() => {
    if (!setValue || !modelsData) {
      return;
    } else {
      const scriptModel = modelsData.transactions.edges.find(
        (model) => findTag(model, 'modelTransaction') === findTag(el, 'modelTransaction'),
      );
      setValue('model', JSON.stringify(scriptModel), {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue('script', JSON.stringify(el), {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }, [el, modelsData, setValue]);

  return (
    <MenuItem
      onClick={handleScriptChoice}
      sx={{
        display: 'flex',
        gap: '16px',
      }}
    >
      <Typography>{findTag(el, 'scriptName')}</Typography>
      <Typography sx={{ opacity: '0.5' }}>
        {findTag(el, 'scriptTransaction')}
        {` (Creator: ${displayShortTxOrAddr(findTag(el, 'sequencerOwner') as string)}`}
      </Typography>
    </MenuItem>
  );
};

const ModelOption = ({ el }: { el: IContractEdge }) => {
  return (
    <MenuItem
      sx={{
        display: 'flex',
        gap: '16px',
      }}
    >
      <Typography>{findTag(el, 'modelName')}</Typography>
      <Typography sx={{ opacity: '0.5' }}>
        {findTag(el, 'modelTransaction')}
        {` (Creator: ${displayShortTxOrAddr(findTag(el, 'sequencerOwner') as string)}`}
      </Typography>
    </MenuItem>
  );
};

const GenericSelect = ({
  name,
  control,
  data,
  error,
  loading,
  hasNextPage,
  disabled = false,
  modelsData,
  setValue,
  loadMore,
}: {
  name: string;
  control: Control<FieldValues, unknown>;
  data: IContractQueryResult;
  error?: ApolloError;
  loading: boolean;
  hasNextPage: boolean;
  disabled?: boolean;
  modelsData?: IContractQueryResult;
  setValue?: UseFormSetValue<FieldValues>;
  loadMore: fetchMoreFn;
}) => {
  const theme = useTheme();
  const [scriptAnchorEl, setScriptAnchorEl] = useState<null | HTMLElement>(null);
  const scriptOpen = useMemo(() => Boolean(scriptAnchorEl), [scriptAnchorEl]);

  const selectLoadMore = (event: UIEvent<HTMLDivElement>) => {
    const bottomOffset = 100;
    const bottom =
      event.currentTarget.scrollHeight - event.currentTarget.scrollTop <=
      event.currentTarget.clientHeight + bottomOffset;
    if (bottom && hasNextPage) {
      // user is at the end of the list so load more items
      loadMore({
        variables: {
          after:
            data && data.transactions.edges.length > 0
              ? data.transactions.edges[data.transactions.edges.length - 1].cursor
              : undefined,
        },
        updateQuery: commonUpdateQuery,
      });
    }
  };
  const isScript = useMemo(() => name === 'script', [name]);
  const hasModelData = useMemo(
    () => !isScript && !error && !loading && data?.transactions.edges.length > 0,
    [isScript, error, loading, data],
  );
  const hasNoData = useMemo(
    () => !error && !loading && (!data.transactions.edges || data.transactions.edges.length === 0),
    [error, loading, data],
  );
  const scriptData = useMemo(() => {
    if (isScript) {
      const filteredScritps = filterPreviousVersions<IContractEdge[]>(data.transactions.edges);
      const filtered: IContractEdge[] = [];
      (async () => {
        for (const el of filteredScritps) {
          const scriptId = findTag(el, 'scriptTransaction') as string;
          if (await isFakeDeleted(scriptId)) {
            // if fake deleted ignore
          } else {
            filtered.push(el);
          }
        }
      })();
      return filtered;
    } else {
      return [] as IContractEdge[];
    }
  }, [isScript, data]);
  const hasScriptData = useMemo(
    () => !error && !loading && scriptData.length > 0,
    [error, loading, scriptData],
  );
  const handleScriptSelectClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (scriptAnchorEl) {
        setScriptAnchorEl(null);
      } else {
        setScriptAnchorEl(event.currentTarget);
      }
    },
    [scriptAnchorEl, setScriptAnchorEl],
  );
  const renderValueFn = useCallback(
    (selected: unknown) => {
      let title;
      let mainText;
      let subText;
      if (typeof selected !== 'string') {
        return '';
      }
      if (isScript) {
        title = findTag(JSON.parse(selected), 'scriptName');
        mainText = findTag(JSON.parse(selected), 'scriptTransaction');
        subText = findTag(JSON.parse(selected), 'sequencerOwner');
      } else {
        title = findTag(JSON.parse(selected), 'modelName');
        mainText = findTag(JSON.parse(selected), 'modelTransaction');
        subText = findTag(JSON.parse(selected), 'sequencerOwner');
      }

      return (
        <Box
          sx={{
            display: 'flex',
            gap: '16px',
          }}
        >
          <Typography>{title}</Typography>
          <Typography sx={{ opacity: '0.5' }}>
            {mainText}
            {` (Creator: ${displayShortTxOrAddr(subText as string)})`}
          </Typography>
        </Box>
      );
    },
    [isScript],
  );

  return (
    <SelectControl
      name={name}
      control={control}
      rules={{ required: !disabled }}
      mat={{
        ...(isScript && { onClick: handleScriptSelectClick }),
        disabled,
        placeholder: 'Choose a Model',
        sx: {
          borderWidth: '1px',
          borderColor: theme.palette.text.primary,
          borderRadius: '16px',
        },
        renderValue: renderValueFn,
        MenuProps: {
          ...(isScript && { anchorEl: scriptAnchorEl, open: scriptOpen }),
          PaperProps: {
            onScroll: selectLoadMore,
            sx: {
              maxHeight: '144px',
              overflowY: loading ? 'hidden' : 'auto',
            },
          },
        },
      }}
    >
      {loading && (
        <Backdrop
          sx={{
            zIndex: theme.zIndex.drawer + 1,
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
      {error && (
        <Box>
          <Typography>Could Not Fetch Available Models</Typography>
        </Box>
      )}

      {hasModelData &&
        data.transactions.edges.map((el: IContractEdge) => (
          <ModelOption key={el.node.id} el={el} />
        ))}

      {hasScriptData &&
        scriptData.map((el: IContractEdge) => (
          <ScriptOption key={el.node.id} el={el} setValue={setValue} modelsData={modelsData} />
        ))}

      {hasModelData &&
        data.transactions.edges.map((el: IContractEdge) => (
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
              {findTag(el, 'modelTransaction')}
              {` (Creator: ${displayShortTxOrAddr(findTag(el, 'sequencerOwner') as string)}`}
            </Typography>
          </MenuItem>
        ))}

      {hasNoData && (
        <Box>
          <Typography>There Are no Available Models</Typography>
        </Box>
      )}
    </SelectControl>
  );
};

const Curators = () => {
  const elementsPerPage = 5;
  const { handleSubmit, reset, control, setValue } = useForm({
    defaultValues: {
      name: '',
      fee: 0,
      category: 'text',
      description: '',
      notes: '',
      avatar: '',
      file: '',
      model: '',
      script: '',
      allow: {
        allowFiles: false,
        allowText: true,
      },
    },
  } as FieldValues);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, setMessage] = useState('');
  const [formData, setFormData] = useState<CreateForm | undefined>(undefined);
  const [hasModelsNextPage, setHasModelsNextPage] = useState(false);
  const [hasScriptsNextPage, setHasScriptsNextPage] = useState(false);
  const totalChunks = useRef(0);
  const { nodeBalance, getPrice, chunkUpload, updateBalance } = useContext(BundlrContext);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const { currentAddress, currentBalance, updateUBalance } = useContext(WalletContext);
  const { setOpen: setFundOpen } = useContext(FundContext);
  const [mode, setMode] = useState<'upload' | 'update'>('upload');

  const {
    data: scriptsData,
    loading: scriptsLoading,
    error: scriptsError,
    fetchMore: scriptsFetchMore,
  } = useQuery(FIND_BY_TAGS, {
    variables: {
      tags: [
        ...SCRIPT_CREATION_PAYMENT_TAGS,
        {
          name: TAG_NAMES.sequencerOwner,
          values: [currentAddress],
        },
      ],
      first: elementsPerPage,
    },
    notifyOnNetworkStatusChange: true,
    skip: !currentAddress,
  });

  const {
    data: modelsData,
    loading: modelsLoading,
    error: modelsError,
    fetchMore: modelsFetchMore,
  } = useQuery(FIND_BY_TAGS, {
    variables: {
      tags: [...MODEL_CREATION_PAYMENT_TAGS],
      first: elementsPerPage,
    },
    notifyOnNetworkStatusChange: true,
  });

  const showSuccessSnackbar = (id: string, message: string) => {
    enqueueSnackbar(
      <>
        {message} <br></br>
        <a href={`https://viewblock.io/arweave/tx/${id}`} target={'_blank'} rel='noreferrer'>
          <u>View Transaction in Explorer</u>
        </a>
      </>,
      { variant: 'success' },
    );
  };

  const commonUploadProps = useMemo(
    () => ({
      nodeBalance,
      totalChunks,
      chunkUpload,
      enqueueSnackbar,
      setSnackbarOpen,
      setProgress,
      getPrice,
      showSuccessSnackbar,
    }),
    [
      nodeBalance,
      totalChunks,
      chunkUpload,
      enqueueSnackbar,
      setSnackbarOpen,
      setProgress,
      getPrice,
      showSuccessSnackbar,
    ],
  );

  useEffect(() => {
    if (modelsData) {
      setHasModelsNextPage(modelsData?.transactions?.pageInfo?.hasNextPage || false);
    }
  }, [modelsData]);

  useEffect(() => {
    if (scriptsData) {
      setHasScriptsNextPage(scriptsData?.transactions?.pageInfo?.hasNextPage || false);
    }
  }, [scriptsData]);

  const onSubmit = async (data: FieldValues) => {
    await updateBalance();
    setFormData(data as CreateForm);

    if (nodeBalance <= 0) {
      setFundOpen(true);
    } else {
      await handleFundFinished(data as CreateForm); // use default node
    }
  };

  const getCommonTags = (
    data: CreateForm,
    modelData: IContractEdge,
    scriptData: IContractEdge,
    modelOwner: string,
  ) => {
    const file = data.file;
    const commonTags = [];
    commonTags.push({ name: TAG_NAMES.appName, value: APP_NAME });
    commonTags.push({ name: TAG_NAMES.appVersion, value: APP_VERSION });
    commonTags.push({ name: TAG_NAMES.contentType, value: file.type });
    commonTags.push({ name: TAG_NAMES.scriptName, value: `${data.name}` });
    commonTags.push({ name: TAG_NAMES.category, value: data.category });
    commonTags.push({
      name: TAG_NAMES.modelName,
      value: findTag(modelData, 'modelName') as string,
    });
    commonTags.push({ name: TAG_NAMES.modelCreator, value: modelOwner });
    commonTags.push({
      name: TAG_NAMES.modelTransaction,
      value: findTag(modelData, 'modelTransaction') as string,
    });
    if (data.description) {
      commonTags.push({ name: TAG_NAMES.description, value: data.description });
    }
    commonTags.push({ name: TAG_NAMES.unixTime, value: (Date.now() / secondInMS).toString() });
    commonTags.push({ name: TAG_NAMES.allowFiles, value: `${data.allow.allowFiles}` });
    commonTags.push({ name: TAG_NAMES.allowText, value: `${data.allow.allowText}` });
    if (mode === 'update') {
      commonTags.push({ name: TAG_NAMES.updateFor, value: scriptData.node.id });
      if (findTag(scriptData, 'previousVersions')) {
        const prevVersions: string[] = JSON.parse(
          findTag(scriptData, 'previousVersions') as string,
        );
        prevVersions.push(scriptData.node.id);
        commonTags.push({ name: TAG_NAMES.previousVersions, value: JSON.stringify(prevVersions) });
      } else {
        commonTags.push({
          name: TAG_NAMES.previousVersions,
          value: JSON.stringify([scriptData.node.id]),
        });
      }
    }
    return commonTags;
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
    const modelData = JSON.parse(data.model) as IContractEdge;
    const scriptData = JSON.parse(data.script) as IContractEdge;
    const uFee = parseFloat(SCRIPT_CREATION_FEE) * U_DIVIDER;

    if (currentBalance < parseFloat(SCRIPT_CREATION_FEE)) {
      enqueueSnackbar(
        `Not Enough Balance in your Wallet to pay Script Creation Fee (${SCRIPT_CREATION_FEE} $U)`,
        { variant: 'error' },
      );
      return;
    }

    const modelOwner = findTag(modelData, 'sequencerOwner') as string;
    const commonTags = getCommonTags(data, modelData, scriptData, modelOwner);
    // add extra tags for payment save
    const uploadTags = [...commonTags];
    uploadTags.push({ name: TAG_NAMES.paymentQuantity, value: uFee.toString() });
    uploadTags.push({ name: TAG_NAMES.paymentTarget, value: VAULT_ADDRESS });
    uploadTags.push({ name: TAG_NAMES.operationName, value: SCRIPT_CREATION });

    setSnackbarOpen(true);
    try {
      const res = await bundlrUpload({
        ...commonUploadProps,
        tags: uploadTags,
        fileToUpload: file,
        successMessage: 'Script Uploaded Successfully',
      });

      const paymentTags = [
        ...commonTags,
        { name: TAG_NAMES.scriptTransaction, value: res.data.id },
        { name: TAG_NAMES.operationName, value: SCRIPT_CREATION_PAYMENT },
      ];

      const paymentId = await sendU(VAULT_ADDRESS, uFee.toString(), paymentTags);
      await updateUBalance();

      showSuccessSnackbar(
        paymentId as string,
        `Paid Script Creation Fee ${SCRIPT_CREATION_FEE} $U.`,
      );

      try {
        await uploadUsageNotes(res.data.id, data.name, data.notes, commonUploadProps, 'script');
        if (mode === 'upload') {
          await uploadAvatarImage(res.data.id, commonUploadProps, 'script', data.avatar);
        }
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

  const handleSwitchModeUpload = useCallback(() => {
    reset();
    setMode('upload');
    document.querySelector('#switch-icon')?.classList.remove('rotate');
  }, [setMode, reset]);

  const handleSwitchModeUpdate = useCallback(() => {
    reset();
    setMode('update');
    document.querySelector('#switch-icon')?.classList.add('rotate');
  }, [setMode, reset]);

  const getContent = () => {
    return (
      <Box width={'100%'} padding='0px 32px' display={'flex'} flexDirection={'column'} gap={'16px'}>
        {mode === 'upload' ? (
          <>
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
              <GenericSelect
                name='model'
                control={control}
                data={modelsData}
                error={modelsError}
                loading={modelsLoading}
                hasNextPage={hasModelsNextPage}
                loadMore={modelsFetchMore}
              />
            </Box>
          </>
        ) : (
          <>
            <Box padding='0px 32px' display={'flex'} flexDirection={'column'} gap={'16px'}>
              <GenericSelect
                name='script'
                control={control}
                data={scriptsData}
                error={scriptsError}
                loading={scriptsLoading}
                hasNextPage={hasScriptsNextPage}
                disabled={false}
                modelsData={modelsData}
                loadMore={scriptsFetchMore}
                setValue={setValue}
              />
              <GenericSelect
                name='model'
                control={control}
                data={modelsData}
                error={modelsError}
                loading={modelsLoading}
                hasNextPage={hasModelsNextPage}
                disabled={true}
                loadMore={modelsFetchMore}
              />
            </Box>
            <Box
              display={'flex'}
              justifyContent={'space-between'}
              alignItems={'center'}
              flexGrow={1}
              width={'100%'}
              padding='0px 32px'
              gap='16px'
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
                    marginTop: 0,
                    marginBottom: 0,
                  },
                  placeholder: 'Select a Category',
                }}
              >
                <MenuItem value={'text'}>Text</MenuItem>
                <MenuItem value={'audio'}>Audio</MenuItem>
                <MenuItem value={'video'}>Video</MenuItem>
              </SelectControl>
            </Box>
            <Box padding='0px 32px'>
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
                style={{ width: '100%', marginTop: 0 }}
              />
            </Box>
          </>
        )}
        <Box padding='0px 32px'>
          <AllowGroupControl name={'allow'} control={control} />
        </Box>
        <Box padding='0px 32px'>
          <MarkdownControl props={{ control, name: 'notes', rules: { required: true } }} />
        </Box>
        <Box padding='0px 32px'>
          <FileControl name='file' control={control} rules={{ required: true }} />
        </Box>
      </Box>
    );
  };

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
              <CardHeader
                title={
                  <Box display={'flex'} gap={'16px'} alignContent={'center'}>
                    <Typography
                      sx={{
                        fontStyle: 'normal',
                        fontWeight: 600,
                        fontSize: '30px',
                        fontHeight: '41px',
                        opacity: mode === 'upload' ? 1 : '0.5',
                      }}
                      onClick={handleSwitchModeUpload}
                    >
                      Upload Script
                    </Typography>
                    <CachedIcon
                      id='switch-icon'
                      sx={{
                        transform: 'rotate(0deg)',
                        transition: 'transform 0.5s linear',
                        '&.rotate': {
                          transform: 'rotate(180deg)',
                          transition: 'transform 0.5s linear',
                        },
                      }}
                      fontSize='large'
                    />
                    <Typography sx={{}} onClick={handleSwitchModeUpdate}>
                      Update Script
                    </Typography>
                  </Box>
                }
                sx={{ paddingLeft: '48px', paddingTop: '32px' }}
              ></CardHeader>
              <CardContent
                sx={{ paddingBottom: 0, gap: '32px', display: 'flex', flexDirection: 'column' }}
              >
                {getContent()}
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
