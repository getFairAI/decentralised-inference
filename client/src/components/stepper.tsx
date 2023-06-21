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

import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { StepIconProps } from '@mui/material/StepIcon';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import {
  ChangeEvent,
  Fragment,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PaymentIcon from '@mui/icons-material/Payment';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import DownloadIcon from '@mui/icons-material/Download';
import rehypeSanitize from 'rehype-sanitize';
import { IEdge } from '@/interfaces/arweave';
import {
  CANCEL_OPERATION,
  DEFAULT_TAGS,
  NET_ARWEAVE_URL,
  OPERATOR_REGISTRATION_AR_FEE,
  OPERATOR_REGISTRATION_PAYMENT_TAGS,
  TAG_NAMES,
  defaultDecimalPlaces,
} from '@/constants';
import { NumericFormat } from 'react-number-format';
import { findTag, printSize } from '@/utils/common';
import { useRouteLoaderData } from 'react-router-dom';
import { RouteLoaderResult } from '@/interfaces/router';
import { getData } from '@/utils/arweave';
import useOnScreen from '@/hooks/useOnScreen';
import MarkdownControl from './md-control';
import { WalletContext } from '@/context/wallet';
import DebounceButton from './debounce-button';
import { useQuery } from '@apollo/client';
import { FIND_BY_TAGS, QUERY_TX_WITH } from '@/queries/graphql';

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient(170.66deg, ${theme.palette.primary.main} -38.15%, ${theme.palette.primary.main} 30.33%)`,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient(170.66deg, ${theme.palette.primary.main} -38.15%, ${theme.palette.primary.main} 30.33%)`,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderRadius: 1,
  },
}));

const ColorlibStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: theme.palette.text.primary,
  width: 40,
  height: 40,
  display: 'flex',
  borderRadius: '16px',
  justifyContent: 'center',
  alignItems: 'center',
  ...(ownerState.active && {
    backgroundImage: `linear-gradient(170.66deg, ${theme.palette.primary.main} -38.15%, ${theme.palette.primary.main} 30.33%)`,
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
    color: theme.palette.primary.contrastText,
  }),
  ...(ownerState.completed && {
    backgroundImage: `linear-gradient(170.66deg, ${theme.palette.primary.main} -38.15%, ${theme.palette.primary.main} 30.33%)`,
    color: theme.palette.primary.contrastText,
  }),
}));

const ColorlibStepIcon = (props: StepIconProps) => {
  const { active, completed, className } = props;

  const icons: { [index: string]: ReactElement } = {
    1: <InfoOutlinedIcon />,
    2: <SettingsIcon />,
    3: <PaymentIcon />,
  };

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  );
};

const RegisterStep = ({
  tx,
  handleSubmit,
  handleNext,
  handleBack,
}: {
  tx: IEdge;
  handleSubmit: (rate: string, name: string, handleNext: () => void) => Promise<void>;
  handleNext: () => void;
  handleBack: () => void;
}) => {
  const [operatorName, setOperatorName] = useState('');
  const [rate, setRate] = useState(0);
  const { currentAddress } = useContext(WalletContext);

  const scriptTxid = useMemo(() => findTag(tx, 'scriptTransaction'), [tx]);

  const { data, loading } = useQuery(FIND_BY_TAGS, {
    variables: {
      tags: [
        ...DEFAULT_TAGS,
        ...OPERATOR_REGISTRATION_PAYMENT_TAGS,
        { name: TAG_NAMES.scriptTransaction, values: [scriptTxid] },
      ],
      first: 1,
    },
    skip: !scriptTxid,
  });

  const registrationId = useMemo(
    () => data?.transactions.edges.length > 0 && data.transactions.edges[0].node.id,
    [data],
  );

  const { data: cancelData, loading: cancelLoading } = useQuery(QUERY_TX_WITH, {
    variables: {
      address: currentAddress,
      tags: [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.operationName, values: [CANCEL_OPERATION] },
        { name: TAG_NAMES.registrationTransaction, values: [registrationId] },
      ],
    },
    skip: !registrationId,
  });
  const isLoading = useMemo(() => loading || cancelLoading, [loading, cancelLoading]);

  const handleRateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newNumber = parseFloat(event.target.value);

    if (newNumber) {
      setRate(parseFloat(newNumber.toFixed(defaultDecimalPlaces)));
    }
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOperatorName(event.target.value);
  };

  const handleFinish = useCallback(async () => {
    await handleSubmit(rate.toString(), operatorName, handleNext);
  }, [rate, operatorName, handleNext, handleSubmit]);

  if (isLoading) {
    return (
      <Fragment>
        <Box justifyContent={'space-between'} display={'flex'}>
          <CircularProgress />
        </Box>
      </Fragment>
    );
  } else if (registrationId && cancelData?.transactions.edges.length === 0) {
    return (
      <Fragment>
        <Box justifyContent={'space-between'} display={'flex'}>
          <Typography sx={{ mt: 2, mb: 1 }} alignContent={'center'} textAlign={'center'}>
            You have already registered an operator. If you want to change the name or fee, you need
            to cancel the registration first.
          </Typography>
        </Box>
      </Fragment>
    );
  } else {
    return (
      <Fragment>
        <Box justifyContent={'space-between'} display={'flex'}>
          <TextField
            value={operatorName}
            label={'Name'}
            onChange={handleNameChange}
            InputProps={{
              sx: {
                borderWidth: '1px',
                borderColor: '#FFF',
                borderRadius: '23px',
              },
            }}
            sx={{
              width: '72%',
            }}
          />
          <NumericFormat
            value={rate}
            onChange={handleRateChange}
            customInput={TextField}
            decimalScale={4}
            label='Fee'
            variant='outlined'
            decimalSeparator={'.'}
            InputProps={{
              sx: {
                borderWidth: '1px',
                borderColor: '#FFF',
                borderRadius: '23px',
              },
            }}
            sx={{ width: '25%' }}
          />
        </Box>
        <Alert severity='warning' variant='outlined' sx={{ borderRadius: '23px' }}>
          <Typography>
            Registration Requires {OPERATOR_REGISTRATION_AR_FEE} AR to prevent malicious actors.
          </Typography>
        </Alert>
        <Box display={'flex'} justifyContent={'space-between'}>
          <Button
            onClick={handleBack}
            sx={{
              border: '1px solid #F4F4F4',
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
              Back
            </Typography>
          </Button>
          <DebounceButton
            onClick={handleFinish}
            sx={{
              borderRadius: '7px',
              height: '39px',
              width: '204px',
            }}
            variant='contained'
            disabled={!operatorName || !rate || !currentAddress}
          >
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: '15px',
                lineHeight: '20px',
              }}
            >
              Finish
            </Typography>
          </DebounceButton>
        </Box>
      </Fragment>
    );
  }
};

export const CustomStepper = (props: {
  data: IEdge;
  handleSubmit: (rate: string, name: string, handleNext: () => void) => Promise<void>;
  isRegistered: boolean;
}) => {
  const { notesTxId, modelTxId, modelName } =
    (useRouteLoaderData('register') as RouteLoaderResult) || {};
  const [activeStep, setActiveStep] = useState(0);
  const [skipped, setSkipped] = useState(new Set<number>());
  const [completed, setCompleted] = useState(new Set<number>());
  const [fileSize, setFileSize] = useState(0);
  const [modelFileSize, setModelFileSize] = useState(0);
  const [notes, setNotes] = useState('');
  const target = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(target);
  const [hasScrolledDown, setHasScrollDown] = useState(false);

  const isStepSkipped = (step: number) => skipped.has(step);

  const handleNext = useCallback(() => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
    setCompleted(completed.add(activeStep));
  }, [skipped, activeStep, setSkipped, setActiveStep, setCompleted, completed]);

  const handleBack = useCallback(() => {
    const newCompleted = new Set(completed.values());
    newCompleted.delete(activeStep);
    setCompleted(newCompleted);
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  }, [completed, setCompleted, setActiveStep]);

  const download = (id: string, name?: string) => {
    const a = document.createElement('a');
    a.href = `${NET_ARWEAVE_URL}/${id}`;
    a.download = name || id;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(
          `${NET_ARWEAVE_URL}/${findTag(props.data, 'scriptTransaction')}`,
          { method: 'HEAD' },
        );
        setFileSize(parseInt(response.headers.get('Content-Length') ?? '', 10));
      } catch (e) {
        // do nothing
      }
    })();
  }, [props.data]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${NET_ARWEAVE_URL}/${modelTxId}`, { method: 'HEAD' });
        setModelFileSize(parseInt(response.headers.get('Content-Length') ?? '', 10));
      } catch (e) {
        // do nothing
      }
    })();
  }, [modelTxId]);

  useEffect(() => {
    if (notesTxId) {
      (async () => {
        setNotes((await getData(notesTxId)) as string);
      })();
    }
  }, [notesTxId]);

  useEffect(() => {
    if (!hasScrolledDown && isOnScreen) {
      setHasScrollDown(true);
    }
  }, [isOnScreen]);

  const handleModelDownload = useCallback(() => {
    if (modelTxId) {
      download(modelTxId, modelName);
    }
  }, [download, modelTxId, modelName]);

  const handleSriptDownload = useCallback(() => {
    const id = findTag(props.data, 'scriptTransaction');
    const name = findTag(props.data, 'scriptName');
    if (id) {
      download(id, name);
    }
  }, [download, props.data]);

  return (
    <Stack sx={{ width: '100%', marginTop: '16px' }} spacing={2}>
      <Stepper alternativeLabel activeStep={activeStep} connector={<ColorlibConnector />}>
        <Step key='wrapEth'>
          <StepLabel
            StepIconComponent={ColorlibStepIcon}
            StepIconProps={{ active: activeStep === 0, completed: completed.has(0) }}
          >
            Information
          </StepLabel>
          {/* <StepButton></StepButton> */}
        </Step>
        <Step key='swapWETHtoUSDC'>
          <StepLabel
            StepIconComponent={ColorlibStepIcon}
            StepIconProps={{ active: activeStep === 1, completed: completed.has(1) }}
          >
            Setup
          </StepLabel>
        </Step>
        <Step key='createTask'>
          <StepLabel
            StepIconComponent={ColorlibStepIcon}
            StepIconProps={{ active: activeStep === 2, completed: completed.has(2) }}
          >
            Register
          </StepLabel>
        </Step>
      </Stepper>

      {activeStep === 3 ? (
        <Fragment>
          <Typography sx={{ mt: 2, mb: 1 }} alignContent={'center'} textAlign={'center'}>
            Registration has been Submitted Successfully. Please wait until the transaction is
            confirmed in the network...
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Box sx={{ flex: '1 1 auto' }} />
            {/* <Button onClick={handleReset} variant='outlined'>Reset</Button> */}
          </Box>
        </Fragment>
      ) : activeStep === 2 ? (
        <RegisterStep
          tx={props.data}
          handleBack={handleBack}
          handleNext={handleNext}
          handleSubmit={props.handleSubmit}
        />
      ) : activeStep === 1 ? (
        <Fragment>
          <MarkdownControl
            viewProps={{
              preview: 'preview',
              previewOptions: {
                rehypePlugins: [[rehypeSanitize]],
              },
              hideToolbar: true,
              fullscreen: false,
              value: notes,
            }}
          />
          <Box>
            <FormControl variant='outlined' fullWidth>
              <TextField
                multiline
                disabled
                minRows={1}
                value={findTag(props.data, 'scriptName')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <IconButton aria-label='download' onClick={handleSriptDownload}>
                        <DownloadIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position='start'>{printSize(fileSize)}</InputAdornment>
                  ),
                  readOnly: true,
                  sx: {
                    borderWidth: '1px',
                    borderColor: '#FFF',
                    borderRadius: '23px',
                  },
                }}
              />
            </FormControl>
          </Box>
          <Box>
            <FormControl variant='outlined' fullWidth>
              <TextField
                multiline
                disabled
                minRows={1}
                value={modelName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <IconButton aria-label='download' onClick={handleModelDownload}>
                        <DownloadIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position='start'>{printSize(modelFileSize)}</InputAdornment>
                  ),
                  readOnly: true,
                  sx: {
                    borderWidth: '1px',
                    borderColor: '#FFF',
                    borderRadius: '23px',
                  },
                }}
              />
            </FormControl>
          </Box>
          <Box display={'flex'} justifyContent={'space-between'}>
            <Button
              onClick={handleBack}
              sx={{
                border: '1px solid #F4F4F4',
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
                Back
              </Typography>
            </Button>
            <Button
              onClick={handleNext}
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
                Next
              </Typography>
            </Button>
          </Box>
        </Fragment>
      ) : (
        <Fragment>
          <Box
            sx={{
              textAlign: 'justify',
              gap: '8px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '500px',
              overflowY: 'auto',
              paddingRight: '16px',
            }}
          >
            <Typography variant='h4' textAlign={'justify'}>
              <b>Rules, Terms, and Conditions of the App</b>
            </Typography>
            <Typography variant='body1' textAlign={'justify'}>
              To become an Operator you have to install a template inserted in Arweave by a Creator,
              following the rules defined by that Creator. These rules should result in a script
              that will run in some kind of infinite loop, waiting for some inference request to be
              made by a User.{' '}
              <b>
                It is the Operator&apos;s responsibility to verify that a Creator&apos;s code and
                rules make sense and are legit. The instructions may be a scam and the code may
                contain malware. We highly advise you to use a PC other than your own to perform the
                inferences.
              </b>
            </Typography>
            <Typography variant='body1' textAlign={'justify'}>
              For more detailed and updated information, we recommend reading Fair Protocol&apos;s
              whitepaper (https://fairwhitepaper.arweave.dev/) with attention before becoming an
              Operator.
            </Typography>
            <Typography variant='body1' textAlign={'justify'}>
              To become an Operator, you must install a template inserted in Arweave by a CUrator,
              following the rules defined by that Curator. These rules should result in a script
              waiting for some inference request from Users in an infinite loop.
              <b>
                The Operator is responsible for verifying that a Curator&apos;s code and rules make
                sense and are legitimate. The instructions may be a scam, and the code may contain
                malware. We highly advise using a PC other than your own to perform the inferences.
              </b>
            </Typography>
            <Typography variant='body1' textAlign={'justify'}>
              <b>
                If an Operator starts an activity but doesn&apos;t return any inference required by
                a User within 7 blocks, it will be removed from the Marketplace as a viable option
                to perform inference. The wallet from the Operator can only perform inferences again
                if it realises a new transaction to open activity.
              </b>
            </Typography>
            <Typography variant='body1' textAlign={'justify'}>
              <b>
                Operators must return as many inferences as possible without failures to obtain the
                best likely statistics. Statistics are vital for Operators, as this is what Users
                will rely on when choosing someone to perform inference.
              </b>
            </Typography>
            <Typography variant='body1' textAlign={'justify'}>
              Operators can decide to terminate the activity whenever they want. They should send a
              new transaction specifying this business termination to end it, and they can also
              restart it again later on. This transaction will be free of costs, and the advantage
              of doing it will be that the Marketplace won&apos;t penalise the Operator since the
              Users won&apos;t be left without a response. As such, the Operator will have better
              statistics.
            </Typography>
            <Typography variant='body1' textAlign={'justify'}>
              The Fair Protocol marketplace will ensure that all participants follow all the
              specified rules, charging users another 5% fee for that service when they request
              inferences. Those 5% will be paid to Operators, which will pay them back to the
              Marketplace.
              <b>
                If the Operator does not send the fees to the Marketplace within 7 Arweave blocks,
                the Marketplace won&apos;t list to Users the Operator anymore.
              </b>
            </Typography>
            <Typography variant='body1' textAlign={'justify'}>
              By becoming an Operator, you accept all these rules, terms, and conditions.
            </Typography>
            <div ref={target}></div>
            <Typography variant='body1' textAlign={'justify'}>
              <b>
                By clicking next, you accept all these rules, terms, and conditions specified above.
              </b>
            </Typography>
          </Box>
          <Box display={'flex'} justifyContent={'flex-end'}>
            {/* <Button variant='contained' onClick={handleBack}>Back</Button> */}
            <Button
              onClick={handleNext}
              sx={{
                borderRadius: '7px',
                height: '39px',
                width: '204px',
                '&.Mui-disabled': {
                  opacity: '0.1',
                },
              }}
              variant='contained'
              disabled={!hasScrolledDown}
            >
              <Typography
                sx={{
                  fontStyle: 'normal',
                  fontWeight: 500,
                  fontSize: '15px',
                  lineHeight: '20px',
                }}
              >
                Accept & Continue
              </Typography>
            </Button>
          </Box>
        </Fragment>
      )}
    </Stack>
  );
};
