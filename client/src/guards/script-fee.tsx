import {
  APP_NAME,
  APP_VERSION,
  DEFAULT_TAGS,
  SCRIPT_FEE_PAYMENT,
  SCRIPT_FEE_PAYMENT_SAVE,
  TAG_NAMES,
} from '@/constants';
import { WalletContext } from '@/context/wallet';
import { WorkerContext } from '@/context/worker';
import { ScriptNavigationState } from '@/interfaces/router';
import { QUERY_FEE_PAYMENT } from '@/queries/graphql';
import arweave, { isTxConfirmed, parseWinston } from '@/utils/arweave';
import { findTag } from '@/utils/common';
import { useLazyQuery } from '@apollo/client';
import {
  Alert,
  Backdrop,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { ReactNode, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const ScriptFeeGuard = ({ children }: { children: ReactNode }) => {
  const { txid } = useParams();
  const { state }: { state: ScriptNavigationState } = useLocation();
  const navigate = useNavigate();
  const [isAllowed, setIsAllowed] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const { currentAddress } = useContext(WalletContext);
  const { startJob } = useContext(WorkerContext);

  const [getLazyFeePayment, queryResult] = useLazyQuery(QUERY_FEE_PAYMENT);

  useEffect(() => {
    const getAddress = async () => {
      setLoading(true);
      try {
        const addr = await window.arweaveWallet.getActiveAddress();
        const tags = [
          ...DEFAULT_TAGS,
          { name: TAG_NAMES.scriptTransaction, values: txid },
          { name: TAG_NAMES.operationName, values: SCRIPT_FEE_PAYMENT },
        ];
        getLazyFeePayment({
          variables: {
            owner: addr,
            recipient: state.scriptCurator,
            tags,
          },
        });
      } catch (err) {
        enqueueSnackbar('Wallet is not Connected', { variant: 'error' });
        navigate('/');
      }
    };

    if (window && window.arweaveWallet) getAddress();
  }, []);

  useEffect(() => {
    const asyncTxConfirmed = async () => {
      if (
        queryResult.data &&
        queryResult.data.transactions &&
        queryResult.data.transactions.edges.length > 0
      ) {
        setIsAllowed(
          queryResult.data.transactions.edges[0].node.quantity.winston === findTag(state.fullState, 'scriptFee') &&
            (await isTxConfirmed(queryResult.data.transactions.edges[0].node.id))
        );
        setHasPaid(
          queryResult.data.transactions.edges[0].node.quantity.winston ===
            findTag(state.fullState, 'scriptFee') &&
            !(await isTxConfirmed(queryResult.data.transactions.edges[0].node.id)),
        );
        setLoading(false);
      } else if (queryResult.data && queryResult.data && queryResult.data.transactions) {
        // means there is no
        setIsAllowed(false);
        setLoading(false);
      }
    };
    asyncTxConfirmed();
  }, [queryResult.data]);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleAccept = async () => {
    try {
      const scriptFee = findTag(state.fullState, 'scriptFee') as string;

      const saveTx = await arweave.createTransaction({ data: 'Save Transaction' });
      saveTx.addTag(TAG_NAMES.appName, APP_NAME);
      saveTx.addTag(TAG_NAMES.appVersion, APP_VERSION);
      saveTx.addTag(TAG_NAMES.operationName, SCRIPT_FEE_PAYMENT_SAVE);
      saveTx.addTag(TAG_NAMES.scriptName, state.scriptName);
      saveTx.addTag(TAG_NAMES.scriptCurator, state.scriptCurator);
      saveTx.addTag(TAG_NAMES.scriptFee, scriptFee);
      saveTx.addTag(TAG_NAMES.scriptTransaction, txid || state.scriptTransaction);
      saveTx.addTag(TAG_NAMES.unixTime, (Date.now() / 1000).toString());
      saveTx.addTag(TAG_NAMES.paymentQuantity, scriptFee);
      saveTx.addTag(TAG_NAMES.paymentTarget, state.scriptCurator);
      const saveResult = await window.arweaveWallet.dispatch(saveTx);

      const tx = await arweave.createTransaction({
        target: state.scriptCurator,
        quantity: scriptFee,
      });
      tx.addTag(TAG_NAMES.appName, APP_NAME);
      tx.addTag(TAG_NAMES.appVersion, APP_VERSION);
      tx.addTag(TAG_NAMES.scriptName, state.scriptName);
      tx.addTag(TAG_NAMES.scriptCurator, state.scriptCurator);
      tx.addTag(TAG_NAMES.scriptFee, scriptFee);
      tx.addTag(TAG_NAMES.operationName, SCRIPT_FEE_PAYMENT);
      tx.addTag(TAG_NAMES.scriptTransaction, txid || state.scriptTransaction);
      tx.addTag(TAG_NAMES.unixTime, (Date.now() / 1000).toString());
      tx.addTag(TAG_NAMES.saveTransaction, saveResult.id);

      await arweave.transactions.sign(tx);
      const res = await arweave.transactions.post(tx);
      if (res.status === 200) {
        enqueueSnackbar(
          <>
            Script Fee Paid: {arweave.ar.winstonToAr(scriptFee)} AR.
            <br></br>
            <a href={`https://viewblock.io/arweave/tx/${tx.id}`} target={'_blank'} rel='noreferrer'>
              <u>View Transaction in Explorer</u>
            </a>
          </>,
          { variant: 'success' },
        );
        startJob({
          address: currentAddress,
          operationName: SCRIPT_FEE_PAYMENT_SAVE,
          tags: saveTx.tags,
          txid: saveTx.id,
          encodedTags: true,
        });
        setHasPaid(true);
      } else {
        enqueueSnackbar(`Failed with error ${res.status}: ${res.statusText}`, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Something Went Wrong', { variant: 'error' });
    }
  };

  return (
    <>
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color='inherit' />
      </Backdrop>
      <Dialog
        open={!loading && !isAllowed}
        maxWidth={'md'}
        fullWidth
        sx={{
          '& .MuiPaper-root': {
            background:
              theme.palette.mode === 'dark'
                ? 'rgba(61, 61, 61, 0.9)'
                : theme.palette.background.default,
            borderRadius: '30px',
          },
        }}
      >
        <DialogTitle>
          <Typography
            sx={{
              color: theme.palette.warning.light,
              fontWeight: 700,
              fontSize: '23px',
              lineHeight: '31px',
            }}
          >
            Script Fee Payment
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert
            variant='outlined'
            severity='warning'
            sx={{
              marginBottom: '16px',
              borderRadius: '10px',
              color: theme.palette.warning.light,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              '& .MuiAlert-icon': {
                justifyContent: 'center',
              },
            }}
            icon={<img src='./warning-icon.svg'></img>}
          >
            {hasPaid ? (
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: '30px',
                  lineHeight: '41px',
                  display: 'block',
                  textAlign: 'center',
                }}
              >
                Awaiting payment confirmation. This could take around 15m.
              </Typography>
            ) : (
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: '30px',
                  lineHeight: '41px',
                  display: 'block',
                  textAlign: 'center',
                }}
              >
                In Order to prevent bad actors an user has to pay the script fee before being able to
                use it. The current Script fee is{' '}
                {parseWinston(findTag(state.fullState, 'scriptFee') as string)}{' '}
                <img src='./arweave-logo-warning.svg'></img>
              </Typography>
            )}
          </Alert>
        </DialogContent>
        {!hasPaid ? (
          <DialogActions
            sx={{ display: 'flex', justifyContent: 'center', gap: '30px', paddingBottom: '20px' }}
          >
            <Button
              color='error'
              onClick={handleCancel}
              sx={{
                border: '1px solid #DC5141',
                borderRadius: '7px',
              }}
            >
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              sx={{
                background: theme.palette.success.light,
                borderRadius: '7px',
                color: theme.palette.success.contrastText,
                '&:hover': {
                  background: theme.palette.success.light,
                  boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
                },
              }}
            >
              Accept
            </Button>
          </DialogActions>
        ) : <DialogActions
              sx={{ display: 'flex', justifyContent: 'center', gap: '30px', paddingBottom: '20px' }}
            >
            <Button
              onClick={() => navigate('/')}
              variant='contained'
            >
              Back to Home
            </Button>
          </DialogActions>
        }
      </Dialog>
      {isAllowed && children}
    </>
  );
};
export default ScriptFeeGuard;
