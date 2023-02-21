import * as React from 'react';
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Check from '@mui/icons-material/Check';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { StepIconProps } from '@mui/material/StepIcon';
import { Alert, Avatar, Box, Button, Card, FormControl, IconButton, InputAdornment, StepButton, StepContent, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import PaymentIcon from '@mui/icons-material/Payment';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import MDEditor from '@uiw/react-md-editor';
import DownloadIcon from '@mui/icons-material/Download';
import rehypeSanitize from 'rehype-sanitize';

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

export const CustomStepper = (props: { data: any, handleSubmit: Function, isRegistered: boolean }) => {
  const [ activeStep, setActiveStep ] = useState(0);
  const [ skipped, setSkipped ] = useState(new Set<number>());
  const [ completed, setCompleted ] = useState(new Set<number>());

  const [ rate, setRate ] = useState(0);

  const isStepOptional = (step: number) => {
    return step === 0 || step === 1;
  };

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
    props.handleSubmit(rate);
    handleNext();
  }

  const handleBack = () => {
    completed.delete(activeStep);
    setCompleted(completed);
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      // You probably want to guard against something like this,
      // it should never occur unless someone's actively trying to break something.
      throw new Error("You can't skip a step that isn't optional.");
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
  };

  const handleDownload = () => {

  }

  const printSize = (file: File) => {
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
  }

  const handleRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRate(+event.target.value);
  }

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
              <TextField label={'Rates Endpoint'} sx={{ width: '70%'}}></TextField>
              <TextField label={'Rate'} sx={{ width: '25%'}} value={rate} onChange={handleRateChange}></TextField>
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
                    startAdornment: <InputAdornment position='start'><IconButton aria-label="download" onClick={handleDownload} ><DownloadIcon /></IconButton></InputAdornment>,
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
            <Typography variant='body1' textAlign={'center'}>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum</Typography>
            <Box display={'flex'} justifyContent={'flex-end'}>
              {/* <Button variant='contained' onClick={handleBack}>Back</Button> */}
              <Button variant='contained' onClick={handleNext}>Next</Button>
            </Box>
          </React.Fragment>
        )
      }
    </Stack>
  );
}