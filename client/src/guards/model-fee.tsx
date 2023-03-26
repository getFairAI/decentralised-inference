import { APP_NAME_TAG, APP_VERSION } from '@/constants';
import { ITag } from '@/interfaces/arweave';
import { QUERY_MODEL_FEE_PAYMENT } from '@/queries/graphql';
import arweave from '@/utils/arweave';
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
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useRouteLoaderData } from 'react-router-dom';

const ModelFeeGuard = ({ children }: { children: ReactNode }) => {
  const updatedFee = useRouteLoaderData('model') as string;
  const { txid } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  /* const { data, loading, error } = useQuery(QUERY_MODEL_FEE_PAYMENT, {
    variables: {
      recipient: state.modelCreator,
      owner:
    }
  }); */

  const [getLazyFeePayment, queryResult] = useLazyQuery(QUERY_MODEL_FEE_PAYMENT);

  useEffect(() => {
    const getAddress = async () => {
      setLoading(true);
      try {
        const addr = await window.arweaveWallet.getActiveAddress();
        const tags = [
          { name: APP_NAME_TAG.name, values: APP_NAME_TAG.values[0] },
          { name: 'Model-Transaction', values: txid },
          { name: 'Operation-Name', values: 'Model Fee Payment' },
        ];
        getLazyFeePayment({
          variables: {
            owner: addr,
            recipient: state.modelCreator,
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
    if (
      queryResult.data &&
      queryResult.data.transactions &&
      queryResult.data.transactions.edges.length > 0
    ) {
      setIsAllowed(
        queryResult.data.transactions.edges[0].node.quantity.winston ===
          (updatedFee ||
            state.fullState.node.tags.find((el: ITag) => el.name === 'Model-Fee').value),
      );
      setLoading(false);
    } else if (queryResult.data && queryResult.data && queryResult.data.transactions) {
      // means there is no
      setIsAllowed(false);
      setLoading(false);
    }
  }, [queryResult.data]);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleAccept = async () => {
    try {
      const modelFee =
        updatedFee || state.fullState.node.tags.find((el: ITag) => el.name === 'Model-Fee')?.value;
      const tx = await arweave.createTransaction({
        target: state.modelCreator,
        quantity: modelFee,
      });
      tx.addTag('App-Name', APP_NAME_TAG.values[0]);
      tx.addTag('App-Version', APP_VERSION);
      tx.addTag('Model-Name', state.modelName);
      tx.addTag('Model-Creator', state.modelCreator);
      tx.addTag('Model-Fee', modelFee);
      tx.addTag('Operation-Name', 'Model Fee Payment');
      tx.addTag('Model-Transaction', txid || state.modelTransaction);
      tx.addTag('Unix-Time', (Date.now() / 1000).toString());
      await arweave.transactions.sign(tx);
      const res = await arweave.transactions.post(tx);
      if (res.status === 200) {
        enqueueSnackbar(
          <>
            Model Fee Paid: {arweave.ar.winstonToAr(modelFee)} AR.
            <br></br>
            <a href={`https://viewblock.io/arweave/tx/${tx.id}`} target={'_blank'} rel='noreferrer'>
              <u>View Transaction in Explorer</u>
            </a>
          </>,
          { variant: 'success' },
        );
        setIsAllowed(true);
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
      <Dialog open={!loading && !isAllowed} maxWidth={'md'} fullWidth sx={{
        '& .MuiPaper-root': {
          background: 'rgba(61, 61, 61, 0.9)',
          borderRadius: '30px',
        }
      }}>
        <DialogTitle><Typography sx={{
          color: '#F4BA61',
          fontWeight: 700,
          fontSize: '23px',
          lineHeight: '31px'
        }}>Model Fee Payment</Typography></DialogTitle>
        <DialogContent>
          <Alert
            variant='outlined'
            severity='warning'
            sx={{ marginBottom: '16px', borderRadius: '10px', color: '#F4BA61', display: 'flex', flexDirection: 'column', justifyContent: 'center',
              '& .MuiAlert-icon': {
                justifyContent: 'center'
              }
            }}
            icon={
              <img src='/public/warning-icon.svg'></img>
            }
          >
            <Typography sx={{
              fontWeight: 400,
              fontSize: '30px',
              lineHeight: '41px',
              display: 'block',
              textAlign: 'center'
            }}>
              In Order to prevent bad actors an user has to pay the model fee before being able to use
              it. The current Model fee is{' '}
              {arweave.ar.winstonToAr(
                updatedFee ||
                  state.fullState.node.tags.find((el: ITag) => el.name === 'Model-Fee')?.value,
              )}{' '}<img src='/public/arweave-logo-warning.svg'></img>
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ display: 'flex', justifyContent: 'center', gap: '30px', paddingBottom: '20px' }}>
          <Button color='error' onClick={handleCancel} sx={{
            border: '1px solid #DC5141',
            borderRadius: '7px',
          }}>
            Decline
          </Button>
          <Button onClick={handleAccept} sx={{
            background:' rgba(14, 255, 168, 0.58)',
            borderRadius: '7px',
            color: '#F4F4F4'
          }}>Accept</Button>
        </DialogActions>
      </Dialog>
      {isAllowed && children}
    </>
  );
};
export default ModelFeeGuard;
