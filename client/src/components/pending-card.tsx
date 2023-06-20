import {
  MODEL_CREATION,
  DEFAULT_TAGS,
  TAG_NAMES,
  MODEL_CREATION_PAYMENT,
  SAVE_REGISTER_OPERATION,
  REGISTER_OPERATION,
  MODEL_FEE_PAYMENT_SAVE,
  MODEL_FEE_PAYMENT,
  INFERENCE_PAYMENT,
  SCRIPT_INFERENCE_REQUEST,
  SCRIPT_INFERENCE_RESPONSE,
  INFERENCE_PAYMENT_DISTRIBUTION,
  SCRIPT_CREATION_PAYMENT,
  SCRIPT_CREATION,
  SCRIPT_FEE_PAYMENT_SAVE,
  SCRIPT_FEE_PAYMENT,
  defaultDecimalPlaces,
} from '@/constants';
import { WalletContext } from '@/context/wallet';
import { IEdge } from '@/interfaces/arweave';
import { QUERY_TX_WITH } from '@/queries/graphql';
import arweave from '@/utils/arweave';
import { displayShortTxOrAddr, findTag, parseUnixTimestamp } from '@/utils/common';
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
import { useContext, useEffect, useMemo, useState } from 'react';
import CopyIcon from '@mui/icons-material/ContentCopy';
import { useSnackbar } from 'notistack';
import _ from 'lodash';
import { WorkerContext } from '@/context/worker';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { parseUBalance } from '@/utils/u';

interface PaymentTx {
  id: string;
  quantity: string;
  timestamp: string;
  target: string;
  operationName: string;
}

const PendingCard = ({ tx }: { tx: IEdge }) => {
  const theme = useTheme();

  const payment: PaymentTx | undefined = useMemo(() => {
    if (tx) {
      const input = findTag(tx, 'input') as string;
      const quantity = JSON.parse(input).qty;
      const target = JSON.parse(input).target;
      const timestamp = findTag(tx, 'unixTime') as string;
      const operationName = findTag(tx, 'operationName') as string;

      return {
        id: tx.node.id,
        quantity: parseUBalance(quantity).toString(),
        target,
        timestamp,
        operationName,
      } as PaymentTx;
    }
    return undefined;
  }, [tx]);

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={payment?.operationName}
        sx={{ padding: '8px 16px' }}
        action={
          <Tooltip title='View in Explorer'>
            <span>
              <IconButton
                size='small'
                href={`https://viewblock.io/arweave/tx/${payment?.id}`}
                target='_blank'
              >
                <OpenInNewIcon />
              </IconButton>
            </span>
          </Tooltip>
        }
      />

      <CardContent
        sx={{ display: 'flex', gap: '16px', justifyContent: 'space-between', padding: '8px 16px' }}
      >
        <Box>
          <Box display={'flex'} gap={'8px'}>
            <Typography fontWeight={'600'}>Recipient:</Typography>
            {payment?.target ? (
              <Tooltip title={payment?.target}>
                <Typography>
                  {displayShortTxOrAddr(payment.target)}
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
            <Typography>
              {parseFloat(payment?.quantity as string).toFixed(defaultDecimalPlaces)}
            </Typography>
            <img
              src={'https://arweave.net/J3WXX4OGa6wP5E9oLhNyqlN4deYI7ARjrd5se740ftE'}
              width={'20px'}
              height={'20px'}
            />
          </Box>
          <Box display={'flex'} gap={'8px'}>
            <Typography fontWeight={'600'}>Timestamp:</Typography>
            <Typography noWrap>{parseUnixTimestamp(payment?.timestamp as string)}</Typography>
          </Box>
        </Box>
        <Box display={'flex'} flexDirection={'column'} justifyContent={'center'}>
          <Box display={'flex'} gap={'8px'}>
            <Button
              variant='outlined'
              color={'success'}
              disabled
              sx={{
                '&.MuiButtonBase-root:disabled': {
                  color: theme.palette.success.main,
                  borderColor: theme.palette.success.main,
                },
              }}
            >
              {'Confirmed'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PendingCard;
