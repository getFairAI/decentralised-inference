import {
  MODEL_CREATION,
  DEFAULT_TAGS,
  TAG_NAMES,
  MODEL_CREATION_PAYMENT,
  SAVE_REGISTER_OPERATION,
  REGISTER_OPERATION,
  MODEL_FEE_PAYMENT_SAVE,
  MODEL_FEE_PAYMENT,
  MODEL_INFERENCE_REQUEST,
  INFERENCE_PAYMENT,
  MODEL_INFERENCE_RESPONSE,
  INFERENCE_PAYMENT_DISTRIBUTION,
} from '@/constants';
import { WalletContext } from '@/context/wallet';
import { IEdge } from '@/interfaces/arweave';
import { QUERY_TX_WITH } from '@/queries/graphql';
import arweave from '@/utils/arweave';
import { findTag } from '@/utils/common';
import { useLazyQuery } from '@apollo/client';
import {
  Card,
  Typography,
  CardContent,
  CardHeader,
  Box,
  Tooltip,
  IconButton,
  CardActions,
  Button,
  useTheme,
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import CopyIcon from '@mui/icons-material/ContentCopy';
import { useSnackbar } from 'notistack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import _ from 'lodash';
import { WorkerContext } from '@/context/worker';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface PaymentTx {
  id: string;
  quantity: string;
  timestamp: string;
  status: string;
  target: string;
  nConfirmations: number;
}

type operationNames =
  | 'Model Creation Payment'
  | 'Operator Registration Payment'
  | 'Model Fee Payment'
  | 'Inference Request Payment'
  | 'Inference Redistribution';

const PendingCard = ({ tx }: { tx: IEdge }) => {
  const { currentAddress } = useContext(WalletContext);
  const [operationName, setOperationName] = useState<operationNames | undefined>(undefined);
  const [getPayment, { data: paymentData, previousData: previousPaymentData }] = useLazyQuery(QUERY_TX_WITH);
  const [payment, setPayment] = useState<Partial<PaymentTx> | undefined>(undefined);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const { startJob } = useContext(WorkerContext);

  useEffect(() => {
    if (tx) {
      switch (findTag(tx, 'operationName')) {
        case MODEL_CREATION:
          // find payment for model creation
          getPayment({
            variables: {
              address: currentAddress,
              tags: [
                ...DEFAULT_TAGS,
                { name: TAG_NAMES.operationName, values: [MODEL_CREATION_PAYMENT] },
                { name: TAG_NAMES.modelTransaction, values: tx.node.id },
              ],
            },
          });
          setOperationName('Model Creation Payment');
          break;
        case SAVE_REGISTER_OPERATION:
          // check there is register operation for this tx
          getPayment({
            variables: {
              address: currentAddress,
              tags: [
                ...DEFAULT_TAGS,
                { name: TAG_NAMES.operationName, values: [REGISTER_OPERATION] },
                { name: TAG_NAMES.saveTransaction, values: [tx.node.id] },
              ],
            },
          });
          setOperationName('Operator Registration Payment');
          break;
        case MODEL_FEE_PAYMENT_SAVE:
          // check there is a model fee payment for this tx
          getPayment({
            variables: {
              address: currentAddress,
              tags: [
                ...DEFAULT_TAGS,
                { name: TAG_NAMES.operationName, values: [MODEL_FEE_PAYMENT] },
                { name: TAG_NAMES.saveTransaction, values: [tx.node.id] },
              ],
            },
          });
          setOperationName('Model Fee Payment');
          break;
        case MODEL_INFERENCE_REQUEST:
          // check there is a inference payment for this tx
          getPayment({
            variables: {
              address: currentAddress,
              tags: [
                ...DEFAULT_TAGS,
                { name: TAG_NAMES.operationName, values: [INFERENCE_PAYMENT] },
                { name: TAG_NAMES.inferenceTransaction, values: [tx.node.id] },
              ],
            },
          });
          setOperationName('Inference Request Payment');
          break;
        case MODEL_INFERENCE_RESPONSE:
          // check there is a inferen payment distribution for this tx
          getPayment({
            variables: {
              address: currentAddress,
              tags: [
                ...DEFAULT_TAGS,
                { name: TAG_NAMES.operationName, values: [INFERENCE_PAYMENT_DISTRIBUTION] },
                { name: TAG_NAMES.responseTransaction, values: [tx.node.id] },
              ],
            },
          });
          setOperationName('Inference Redistribution');
          break;
        default:
          console.log('Invalid Operation Name');
          return;
      }
    }
  }, [tx]);

  useEffect(() => {
    const asyncWrapper = async () => {
      if (paymentData && paymentData.transactions.edges.length === 0) {
        // paymentTx not found show retry option
        const quantity = findTag(tx, 'paymentQuantity') as string;
        const target = findTag(tx, 'paymentTarget');
        const timestamp = 'Not Available';
        setPayment({
          quantity: arweave.ar.winstonToAr(quantity),
          target,
          timestamp,
          status: 'Failed',
        });
        startJob({
          address: currentAddress,
          operationName: findTag(tx, 'operationName') as string,
          tags: tx.node.tags,
          txid: tx.node.id,
          encodedTags: false
        });
      } else if (paymentData && paymentData.transactions.edges.length > 0) {
        // found payment tx show status
        const payment: IEdge = paymentData.transactions.edges[0];
        const timestamp =
          parseFloat(findTag(payment, 'unixTime') as string) || payment.node.block.timestamp;
        const date = new Date(timestamp * 1000)
          .toLocaleDateString()
          .concat(' ')
          .concat(new Date(timestamp * 1000).toLocaleTimeString());
        const result = await arweave.transactions.getStatus(payment.node.id);

        setPayment({
          id: payment.node.id,
          target: payment.node.recipient,
          quantity: payment.node.quantity.ar,
          timestamp: date,
          status: result.confirmed ? 'Confirmed' : 'Pending',
          nConfirmations: result.confirmed?.number_of_confirmations,
        });
      }
    };
    if (!_.isEqual(paymentData, previousPaymentData)) {
      asyncWrapper();
    }
  }, [ paymentData ]);

  const handleRetry = async () => {
    // retry current tx
    // get previous tags and filter quantity and target quantities and operation name
    const tags = tx.node.tags.filter(
      (el) =>
        el.name !== TAG_NAMES.paymentQuantity &&
        el.name !== TAG_NAMES.paymentTarget &&
        el.name !== TAG_NAMES.operationName &&
        el.name !== 'Signing-Client-Version' &&
        el.name !== 'Signing-Client',
    );
    const quantity = findTag(tx, 'paymentQuantity');
    const target = findTag(tx, 'paymentTarget');
    if (!target || !quantity) {
      enqueueSnackbar('Insufficient Tags to retry Transaction...', { variant: 'error' });
      return;
    }
    const retryTx = await arweave.createTransaction({
      target,
      quantity,
    });
    switch (operationName) {
      case 'Inference Redistribution':
        retryTx.addTag(TAG_NAMES.operationName, INFERENCE_PAYMENT_DISTRIBUTION);
        retryTx.addTag(TAG_NAMES.responseTransaction, tx.node.id);
        break;
      case 'Model Fee Payment':
        retryTx.addTag(TAG_NAMES.operationName, MODEL_FEE_PAYMENT);
        retryTx.addTag(TAG_NAMES.saveTransaction, tx.node.id);
        break;
      case 'Inference Request Payment':
        retryTx.addTag(TAG_NAMES.operationName, INFERENCE_PAYMENT);
        retryTx.addTag(TAG_NAMES.inferenceTransaction, tx.node.id);
        break;
      case 'Model Creation Payment':
        retryTx.addTag(TAG_NAMES.operationName, MODEL_CREATION_PAYMENT);
        retryTx.addTag(TAG_NAMES.modelTransaction, tx.node.id);
        break;
      case 'Operator Registration Payment':
        retryTx.addTag(TAG_NAMES.operationName, REGISTER_OPERATION);
        retryTx.addTag(TAG_NAMES.saveTransaction, tx.node.id);
        break;
      default:
        return;
    }
    tags.forEach((tag) =>
      tag.name === TAG_NAMES.unixTime
        ? retryTx.addTag(tag.name, (Date.now() / 1000).toString())
        : retryTx.addTag(tag.name, tag.value),
    );

    await arweave.transactions.sign(retryTx);
    const response = await arweave.transactions.post(retryTx);
    if (response.status === 200) {
      enqueueSnackbar(
        <>
          Transaction Retry
          <br></br>
          <a
            href={`https://viewblock.io/arweave/tx/${retryTx.id}`}
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
        operationName: findTag(tx, 'operationName') as string,
        tags: tx.node.tags,
        txid: tx.node.id,
        encodedTags: false
      });
    } else {
      enqueueSnackbar('Something went Wrong. Please Try again...', { variant: 'error' });
    }
  };

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={operationName} sx={{ padding: '8px 16px' }} action={
        <Tooltip title='View in Explorer'>
          <IconButton size='small' href={`https://viewblock.io/arweave/tx/${payment?.id}`} target='_blank'>
            <OpenInNewIcon />
          </IconButton>
        </Tooltip>
      }/>
      
      <CardContent
        sx={{ display: 'flex', gap: '16px', justifyContent: 'space-between', padding: '8px 16px' }}
      >
        <Box>
          <Box display={'flex'} gap={'8px'}>
            <Typography fontWeight={'600'}>Recipient:</Typography>
            {payment?.target ? (
              <Tooltip title={payment?.target}>
                <Typography>
                  {payment?.target?.slice(0, 6)}...
                  {payment?.target?.slice(-2)}
                  <IconButton
                    size='small'
                    onClick={() => {
                      payment?.target && navigator.clipboard.writeText(payment?.target);
                    }}
                  >
                    <CopyIcon fontSize='inherit' />
                  </IconButton>
                </Typography>
              </Tooltip>
            ) : (
              <Typography>Not Available</Typography>
            )}
          </Box>
          <Box display={'flex'} gap={'8px'} alignItems={'center'}>
            <Typography fontWeight={'600'}>Quantity:</Typography>
            <Typography>{parseFloat(payment?.quantity as string).toFixed(4)}</Typography>
            <img
              src={
                theme.palette.mode === 'dark'
                  ? './arweave-logo.svg'
                  : './arweave-logo-for-light.png'
              }
              width={'20px'}
              height={'20px'}
            />
          </Box>
          <Box display={'flex'} gap={'8px'}>
            <Typography fontWeight={'600'}>Timestamp:</Typography>
            <Typography noWrap>{payment?.timestamp}</Typography>
          </Box>
          {payment?.status !== 'Failed' && (
            <Box display={'flex'} gap={'8px'}>
              <Typography fontWeight={'600'}>Confirmations:</Typography>
              <Typography>{payment?.nConfirmations}</Typography>
            </Box>
          )}
        </Box>
        <Box display={'flex'} flexDirection={'column'} justifyContent={'center'}>
          <Box display={'flex'} gap={'8px'}>
            <Button
              variant='outlined'
              color={
                payment?.status === 'Confirmed'
                  ? 'success'
                  : payment?.status === 'Pending'
                  ? 'warning'
                  : 'error'
              }
              disabled
              sx={{
                '&.MuiButtonBase-root:disabled': {
                  color:
                    payment?.status === 'Confirmed'
                      ? theme.palette.success.main
                      : payment?.status === 'Pending'
                      ? theme.palette.warning.main
                      : theme.palette.error.main,
                  borderColor:
                    payment?.status === 'Confirmed'
                      ? theme.palette.success.main
                      : payment?.status === 'Pending'
                      ? theme.palette.warning.main
                      : theme.palette.error.main,
                },
              }}
            >
              {payment?.status}
            </Button>
          </Box>
        </Box>
      </CardContent>
      {payment?.status === 'Failed' && (
        <CardActions sx={{ display: 'flex', justifyContent: 'center', padding: '8px 16px', gap: '8px' }}>
          {!payment.target || !payment.quantity || Number.isNaN(payment.quantity) ? (
            <>
              <Button onClick={handleRetry} variant='outlined' disabled>
                Retry
              </Button>
              <Tooltip title={'There is Not Sufficient Information to retry this Payment'}>
                <InfoOutlinedIcon />
              </Tooltip>
            </> 
          ) : (
            <Button onClick={handleRetry} variant='outlined'>
              Retry
            </Button>
          )}
        </CardActions>
      )}
    </Card>
  );
};

export default PendingCard;
