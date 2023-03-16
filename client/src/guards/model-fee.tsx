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
    if (queryResult.data && queryResult.data.length > 0) {
      setIsAllowed(
        queryResult.data[0].node.quantity.winston ===
          (updatedFee ||
            state.fullState.node.tags.find((el: ITag) => el.name === 'Model-Fee').value),
      );
      setLoading(false);
    } else if (queryResult.data) {
      // means there is no
      setIsAllowed(false);
      setLoading(false);
    }
  }, [queryResult.data]);

  const handleCancel = () => {
    navigate(`/model/${txid}/detail`, { state: state.fullState });
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
          Model Fee Paid: {arweave.ar.winstonToAr(
            modelFee,
          )} AR.
          <br></br>
          <a href={`https://viewblock.io/arweave/tx/${tx.id}`} target={'_blank'} rel="noreferrer"><u>View Transaction in Explorer</u></a>
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
      <Dialog open={!loading && !isAllowed} maxWidth={'sm'} fullWidth>
        <DialogTitle>Model Fee Payment</DialogTitle>
        <DialogContent>
          <Alert variant='outlined' severity='warning' sx={{ marginBottom: '16px' }}>
            In Order to prevent bad actors an user has to pay the model fee before being able to use
            it. The current Model fee is{' '}
            <u>
              {arweave.ar.winstonToAr(
                updatedFee ||
                  state.fullState.node.tags.find((el: ITag) => el.name === 'Model-Fee')?.value,
              )}
            </u>{' '}
            AR.
            <br />
          </Alert>
        </DialogContent>
        <DialogActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button color='error' onClick={handleCancel}>
            Decline
          </Button>
          <Button onClick={handleAccept}>Accept</Button>
        </DialogActions>
      </Dialog>
      {isAllowed && children}
    </>
  );
};
export default ModelFeeGuard;
