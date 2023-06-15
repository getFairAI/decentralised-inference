import { CustomStepper } from '@/components/stepper';
import {
  VAULT_ADDRESS,
  APP_VERSION,
  TAG_NAMES,
  APP_NAME,
  REGISTER_OPERATION,
  SAVE_REGISTER_OPERATION,
  OPERATOR_REGISTRATION_AR_FEE,
  secondInMS,
} from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { RouteLoaderResult } from '@/interfaces/router';
import arweave from '@/utils/arweave';
import { findTag } from '@/utils/common';
import {
  Box,
  Typography,
  Icon,
  InputBase,
  DialogContent,
  Dialog,
  DialogTitle,
  IconButton,
  CardContent,
  useTheme,
} from '@mui/material';
import { toSvg } from 'jdenticon';
import { useSnackbar } from 'notistack';
import { useContext, useMemo, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import { useLoaderData, useLocation, useNavigate } from 'react-router-dom';
import '@/styles/ui.css';
import { WalletContext } from '@/context/wallet';
import { WorkerContext } from '@/context/worker';
import { parseUBalance, sendU } from '@/utils/u';

const Register = () => {
  const { avatarTxId } = (useLoaderData() as RouteLoaderResult) || {};
  const { state }: { state: IEdge } = useLocation();
  const [isRegistered, setIsRegistered] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentUBalance, updateUBalance } = useContext(WalletContext);
  const { startJob } = useContext(WorkerContext);

  const imgUrl = useMemo(() => {
    if (avatarTxId) {
      return `https://arweave.net/${avatarTxId}`;
    }
    const img = toSvg(findTag(state, 'scriptTransaction'), 100);
    const svg = new Blob([img], { type: 'image/svg+xml' });
    return URL.createObjectURL(svg);
  }, [state, avatarTxId]);

  const handleRegister = async (rate: string, operatorName: string, handleNext: () => void) => {
    try {
      if (currentUBalance < parseInt(OPERATOR_REGISTRATION_AR_FEE, 10)) {
        enqueueSnackbar('Insufficient U Balance', { variant: 'error' });
        return;
      }
      const winstonFee = arweave.ar.arToWinston(OPERATOR_REGISTRATION_AR_FEE);
      const parsedUFee = parseUBalance(winstonFee);

      const tags = [];
      tags.push({ name: TAG_NAMES.appName, value: APP_NAME });
      tags.push({ name: TAG_NAMES.appVersion, value: APP_VERSION });
      tags.push({
        name: TAG_NAMES.scriptName,
        value: findTag(state, 'scriptName') ?? '',
      });
      tags.push({ name: TAG_NAMES.scriptCurator, value: state.node.owner.address });
      tags.push({
        name: TAG_NAMES.scriptTransaction,
        value: findTag(state, 'scriptTransaction') as string,
      });
      tags.push({ name: TAG_NAMES.operatorFee, value: arweave.ar.arToWinston(rate) });
      tags.push({ name: TAG_NAMES.operationName, value: REGISTER_OPERATION });
      tags.push({ name: TAG_NAMES.operatorName, value: operatorName });
      tags.push({ name: TAG_NAMES.unixTime, value: (Date.now() / secondInMS).toString() });
      // tags.push({ name: TAG_NAMES.saveTransaction, values: saveResult.id as string });

      const paymentId = await sendU(VAULT_ADDRESS, parsedUFee.toString(), tags);
      await updateUBalance();
      enqueueSnackbar(
        <>
          Operator Registration Submitted.
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
      setIsRegistered(true);
      handleNext();
    } catch (error) {
      enqueueSnackbar('Something went Wrong. Please Try again...', { variant: 'error' });
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <Dialog
      open={true}
      maxWidth={'lg'}
      fullWidth
      sx={{
        padding: '8px',
        '& .MuiPaper-root': {
          background:
            theme.palette.mode === 'dark'
              ? theme.palette.neutral.main
              : theme.palette.background.default,
          borderRadius: '30px',
        },
      }}
    >
      <DialogTitle
        display='flex'
        justifyContent={'space-between'}
        alignItems='center'
        lineHeight={0}
      >
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: '25px',
            lineHeight: '34px',
          }}
        >
          Register Operator
        </Typography>
        <IconButton
          onClick={handleClose}
          sx={{
            background: theme.palette.primary.main,
            '&:hover': {
              background: theme.palette.primary.main,
              opacity: 0.8,
            },
          }}
        >
          <img src='./close-icon.svg' />
        </IconButton>
      </DialogTitle>
      <CardContent
        sx={{
          display: 'flex',
          gap: '48px',
          padding: '0px 32px',
          width: '100%',
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(180deg, #474747 0%, rgba(71, 71, 71, 0) 100%)',
            borderRadius: '23px',
            backgroundPosition: 'center',
            width: 'fit-content',
            '&::after': {
              height: '100%',
              width: '100%',
              content: '""',
              display: 'block',
              position: 'relative',
              bottom: '281px',
              borderRadius: '23px',
            },
          }}
        >
          <img src={imgUrl} width='275px' height={'275px'} style={{ borderRadius: '23px' }} />
        </Box>
        <Box display={'flex'} flexDirection={'column'} gap={'30px'} width={'30%'}>
          <Box>
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
              Name
            </Typography>
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '23px',
                lineHeight: '31px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {findTag(state, 'scriptName')}
            </Typography>
          </Box>
          <Box>
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
              Category
            </Typography>
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '23px',
                lineHeight: '31px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {findTag(state, 'category')}
            </Typography>
          </Box>
          <Box>
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
              justifyContent='flex-start'
              width={'100%'}
              height='60px'
            >
              <NumericFormat
                value={arweave.ar.winstonToAr(findTag(state, 'scriptFee') || '0')}
                customInput={InputBase}
                decimalScale={3}
                decimalSeparator={'.'}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  fontStyle: 'normal',
                  fontWeight: 700,
                  fontSize: '60px',
                  lineHeight: '106px',
                  textAlign: 'center',

                  paddingRight: '8px',
                }}
                disabled
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
        <Box display={'flex'} flexDirection={'column'} gap={'16px'} width={'45%'}>
          <Box>
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
              Description
            </Typography>
            <Typography>{findTag(state, 'description') || 'No Description Available'}</Typography>
          </Box>
        </Box>
      </CardContent>
      <DialogContent sx={{ padding: '20px 32px' }}>
        <CustomStepper data={state} handleSubmit={handleRegister} isRegistered={isRegistered} />
      </DialogContent>
    </Dialog>
  );
};

export default Register;
