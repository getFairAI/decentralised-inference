import * as React from 'react';
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Check from '@mui/icons-material/Check';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { StepIconProps } from '@mui/material/StepIcon';
import { Alert, Box, Button, FormControl, IconButton, InputAdornment, List, ListItem, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import PaymentIcon from '@mui/icons-material/Payment';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import MDEditor from '@uiw/react-md-editor';
import DownloadIcon from '@mui/icons-material/Download';
import rehypeSanitize from 'rehype-sanitize';
import useArweave from '@/context/arweave';

const QontoConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#784af4',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#784af4',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderTopWidth: 3,
    borderRadius: 1,
  },
}));

const QontoStepIconRoot = styled('div')<{ ownerState: { active?: boolean } }>(
  ({ theme, ownerState }) => ({
    color: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#eaeaf0',
    display: 'flex',
    height: 22,
    alignItems: 'center',
    ...(ownerState.active && {
      color: '#784af4',
    }),
    '& .QontoStepIcon-completedIcon': {
      color: '#784af4',
      zIndex: 1,
      fontSize: 18,
    },
    '& .QontoStepIcon-circle': {
      width: 8,
      height: 8,
      borderRadius: '50%',
      backgroundColor: 'currentColor',
    },
  }),
);

function QontoStepIcon(props: StepIconProps) {
  const { active, completed, className } = props;

  return (
    <QontoStepIconRoot ownerState={{ active }} className={className}>
      {completed ? (
        <Check className="QontoStepIcon-completedIcon" />
      ) : (
        <div className="QontoStepIcon-circle" />
      )}
    </QontoStepIconRoot>
  );
}

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        'linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        'linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor:
      theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderRadius: 1,
  },
}));

const ColorlibStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...(ownerState.active && {
    backgroundImage:
      'linear-gradient( 136deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)',
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
  }),
  ...(ownerState.completed && {
    backgroundImage:
      'linear-gradient( 136deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)',
  }),
}));

function ColorlibStepIcon(props: StepIconProps) {
  const { active, completed, className } = props;

  const icons: { [index: string]: React.ReactElement } = {
    1: <InfoOutlinedIcon />,
    2: <SettingsIcon />,
    3: <PaymentIcon />,
  };

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  );
}

export const CustomStepper = (props: { data: string, handleSubmit: (rate: string) => Promise<void>, isRegistered: boolean }) => {
  const [ activeStep, setActiveStep ] = useState(0);
  const [ skipped, setSkipped ] = useState(new Set<number>());
  const [ completed, setCompleted ] = useState(new Set<number>());
  const [ , setCurrentBalance ] = useState(0.00);

  const { getWalletBalance } = useArweave();

  const [ rate, setRate ] = useState(0);

  /* const isStepOptional = (step: number) => {
    return step === 0 || step === 1;
  }; */

  const isStepSkipped = (step: number) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
    setCompleted(completed.add(activeStep));
  };

  const handleFinish = () => {
    props.handleSubmit(rate.toString());
    handleNext();
  };

  const handleBack = () => {
    completed.delete(activeStep);
    setCompleted(completed);
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  /* const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      // You probably want to guard against something like this,
      // it should never occur unless someone's actively trying to break something.
      throw new Error('You can\'t skip a step that isn\'t optional.');
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
    setCompleted(completed.add(activeStep));
  };

  const handleReset = () => {
    setActiveStep(0);
    setCompleted(new Set<number>());
  }; */

  /* const handleDownload = () => {

  }; */

  /* const printSize = (file: File) => {
    const size = file.size;
    if (size < 1024) {
      return `${size} bytes`;
    } else if (size < Math.pow(1024,2)) {
      const kb = size / 1024;
      return `${Math.round((kb + Number.EPSILON) * 100) / 100} KB`;
    } else if (size < Math.pow(1024,3)) {
      const mb = size / Math.pow(1024, 2);
      return `${Math.round((mb + Number.EPSILON) * 100) / 100} MB`;
    } else {
      const gb = size / Math.pow(1024, 3);
      return `${Math.round((gb + Number.EPSILON) * 100) / 100} GB`;
    }
  }; */

  const handleRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = parseFloat(event.target.value);

    if (newNumber) setRate(parseFloat(newNumber.toFixed(3)));
  };

  React.useEffect(() => {
    const f = async () => {
      const res = await getWalletBalance();
      setCurrentBalance(+res);
    };
    f();
  }, []);
  return (
    <Stack sx={{ width: '100%', marginTop: '16px' }} spacing={2}>
      <Stepper alternativeLabel activeStep={activeStep} connector={<QontoConnector />}>
        <Step key='wrapEth'>
          <StepLabel StepIconComponent={QontoStepIcon} StepIconProps={{ active: activeStep === 0, completed:  completed.has(0)}}/>
        </Step>
        <Step key='swapWETHtoUSDC'>
          <StepLabel StepIconComponent={QontoStepIcon} StepIconProps={{ active: activeStep === 1, completed:  completed.has(1)}}/>
        </Step>
        <Step key='createTask'>
          <StepLabel StepIconComponent={QontoStepIcon} StepIconProps={{ active: activeStep === 2, completed:  completed.has(2)}}/>
        </Step>
      </Stepper>
      <Stepper alternativeLabel activeStep={activeStep} connector={<ColorlibConnector />}>
        <Step key='wrapEth'>
          <StepLabel StepIconComponent={ColorlibStepIcon} StepIconProps={{ active: activeStep === 0, completed:  completed.has(0)}}>Information</StepLabel>
          {/* <StepButton></StepButton> */}
        </Step>
        <Step key='swapWETHtoUSDC'>
          <StepLabel StepIconComponent={ColorlibStepIcon} StepIconProps={{ active: activeStep === 1, completed:  completed.has(1)}}>Setup</StepLabel>
        </Step>
        <Step key='createTask'>
          <StepLabel StepIconComponent={ColorlibStepIcon} StepIconProps={{ active: activeStep === 2, completed:  completed.has(2)}}>Register</StepLabel>
        </Step>
      </Stepper>

      {
        activeStep === 3 ? (
          <React.Fragment>
            <Typography sx={{ mt: 2, mb: 1 }} alignContent={'center'} textAlign={'center'}>
              Registration has been Submitted Successfully.
              Will will be notified when the transaction is approved...
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Box sx={{ flex: '1 1 auto' }} />
              {/* <Button onClick={handleReset} variant='outlined'>Reset</Button> */}
            </Box>
          </React.Fragment>
        ) : activeStep === 2 ? (
          <React.Fragment>
            <TextField disabled value={'Model id'} label={'Model'}></TextField>
            <Box justifyContent={'space-between'} display={'flex'}>
              {/* <TextField label={'Rates Endpoint'} sx={{ width: '70%'}}></TextField> */}
              <TextField
                label={'Rate'}
                sx={{ width: '25%'}}
                value={rate}
                onChange={handleRateChange}
                type='number'
                inputProps={{ step: 0.01, inputMode: 'numeric', min: 0.01, /* max: currentBalance */ }}
                /* helperText={`Max: ${currentBalance}`} */
              ></TextField>
            </Box>
            <Alert severity='warning'>Registration Requires a small fee to prevent malicious actors</Alert>
            <Box display={'flex'} justifyContent={'space-between'}>
              <Button variant='outlined' onClick={handleBack}>Back</Button>
              <Button variant='contained' onClick={handleFinish}>Finish</Button>
            </Box>
          </React.Fragment>
        ) : activeStep === 1 ? (
          <React.Fragment>          
            <MDEditor preview='preview' previewOptions={{
              rehypePlugins: [[rehypeSanitize]],
            }} hideToolbar={true} fullscreen={false} value={'### Requirements\nExample Markdown'}></MDEditor>
            <Box>
              <FormControl variant="outlined" fullWidth>
                <TextField
                  multiline
                  disabled
                  minRows={1}
                  value={'Model name'}
                  InputProps={{
                    startAdornment: <InputAdornment position='start'><IconButton aria-label="download" /* onClick={handleDownload} */ ><DownloadIcon /></IconButton></InputAdornment>,
                    endAdornment: <InputAdornment position="start">{'15MB'}</InputAdornment>,
                    readOnly: true 
                  }}
                />
              </FormControl>
            </Box>
            <Box display={'flex'} justifyContent={'space-between'}>
              <Button variant='outlined' onClick={handleBack}>Back</Button>
              <Button variant='contained' onClick={handleNext}>Next</Button>
            </Box>
          </React.Fragment>
        ) : (        
          <React.Fragment>
            <Typography variant='h4' textAlign={'Justify'}>
              <b>Rules, Terms, and Conditions of the App</b>
            </Typography>
            <Typography variant='h5' textAlign={'Justify'}>
              Terminology:
            </Typography>
            <List
              sx = {{
                listStyleType: 'disc',
                pl: 2,
                lineHeight: 0.5,
                '& .MuiListItem-root': {
                  display: 'list-item',
                },
              }}>
              <ListItem>
              A Creator is anyone who inserts trained models on the Fair Protocol marketplace;
              </ListItem>
              <ListItem>
              A User is anyone who requests inference tasks on models inserted by Creators;
              </ListItem>
              <ListItem>
            An Operator is anyone who responds to those inferences requests made by Users, running the specified model inference and returning it.
              </ListItem>
            </List>  
            <Typography variant='body1' textAlign={'Justify'}>
              All the communication between participants in this network is done through Arweave. This means that a Creator inserts trained models on Arweave, so users can request inferences on those models through Arweave, and Operators can send responses on Arweave. When anything is written on Arweave, it&apos;s stored forever, due to the particularities of that blockchain. {'\n'}
            </Typography>
            <Typography variant='body1' textAlign={'Justify'}>
              A Creator defines all the rules needed to install a model, as well as the script that the Operators should run, and the rules for getting such a script to work. A Creator then sends all this data to Arweave, and for his model to be listed in the marketplace he must pay a fee to the marketplace of 0.1 AR. The fee is intended to filter out people who want to put junk on the marketplace.
            </Typography>
            <Typography variant='body1' textAlign={'Justify'}>
              To become an Operator you have to install a template inserted in Arweave by a Creator, following the rules defined by that Creator. These rules should result in a script that will run in some kind of infinite loop, waiting for some inference request to be made by a User. <b>It is the Operator&apos;s responsibility to verify that a Creator&apos;s code and rules make sense and are legit. The instructions may be a scam and the code may contain malware. We highly advise you to use a PC other than your own to perform the inferences.</b>
            </Typography>
            <Typography variant='body1' textAlign={'Justify'}>
              After a successful installation, an Operator should make a transaction to Arweave saying that it started business on that specific model, in order to inform the marketplace. This transaction will have an extra cost of 0.05 AR, sent to the marketplace, to filter out some potential bad actors. Operators charge a fee for performing inferences to Users. This fee is specified by themselves in the start business transaction.
            </Typography>
            <Typography variant='body1' textAlign={'Justify'}>
              <b>If an Operator starts business, but doen&apos;t return any inference required by a User within <b>X blocks</b>, it will be removed from the marketplace as a viable option to perform inference, and will only be able to perform inference again if it realizes a new transaction to open a business.</b> <b>To do: decide about blocks/time until penalization</b>
            </Typography>
            <Typography variant='body1' textAlign={'Justify'}>
              <b>Statistics are especially important for Operators, as this is what Users will rely on when choosing someone to perform inference. To obtain the best possible statistics, an Operator must return as many inferences as possible without failing to return any.</b>
            </Typography>
            <Typography variant='body1' textAlign={'Justify'}>
              Operators can decide to terminate business whenever they want. To do so, they should send a new transaction, specifying this business termination. This transaction will be free of costs, and the advantage of doing it will be that no penalization will be executed by the marketplace to the Operator, and will have best stats. They can start business again later on. <b>To do: specify rules for this in the app</b>
            </Typography>
            <Typography variant='body1' textAlign={'Justify'}>
              To reward the train of models executed by Creators as well as the fees paid by those Creators when submitting models to Arweave, the marketplace ensures that every time a User requests an inference on a specified model to an Operator, it pays an extra 5% fee to the Operator, so the Operator can reward afterwards the Creator of that model.
            </Typography>
            <Typography variant='body1' textAlign={'Justify'}>
              The Fair Protocol marketplace will ensure that all participants follow all the rules specified, charging another 5% fee for that service to Users when they request inferences. Those 5% will be paid to Operators, that in turn will pay to the marketplace. <b>If any of those extra fees are not paid by the Operator, the marketplace won&apos;t show the results of the inference to the User. If was the Operator who didn&apos;t had paid back, he will be penalized by the marketplace, by not being shown as a valid option to Users.</b> <b>To do: detail more these rules</b>
            </Typography>
            <Typography variant='body1' textAlign={'Justify'}>
              <b>By clicking next, you accept all these rules, terms, and conditions specified above.</b>
            </Typography>
            <Box display={'flex'} justifyContent={'flex-end'}>
              {/* <Button variant='contained' onClick={handleBack}>Back</Button> */}
              <Button variant='contained' onClick={handleNext}>Next</Button>
            </Box>
          </React.Fragment>
        )
      }
    </Stack>
  );
};