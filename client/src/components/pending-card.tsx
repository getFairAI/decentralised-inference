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

import { defaultDecimalPlaces, U_LOGO_SRC } from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { displayShortTxOrAddr, findTag, parseUnixTimestamp } from '@/utils/common';
import {
  Card,
  Typography,
  CardContent,
  CardHeader,
  Box,
  Tooltip,
  IconButton,
  Button,
  useTheme,
} from '@mui/material';
import { useMemo } from 'react';
import CopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { parseUBalance } from '@/utils/u';

interface PaymentTx {
  id: string;
  quantity: string;
  timestamp: string;
  target: string;
  operationName: string;
  appVersion: string;
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
      const appVersion = findTag(tx, 'appVersion') as string;

      return {
        id: tx.node.id,
        quantity: parseUBalance(quantity).toString(),
        target,
        timestamp,
        operationName,
        appVersion,
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
            <img src={U_LOGO_SRC} width={'20px'} height={'20px'} />
          </Box>
          <Box display={'flex'} gap={'8px'}>
            <Typography fontWeight={'600'}>Timestamp:</Typography>
            <Typography noWrap>{parseUnixTimestamp(payment?.timestamp as string)}</Typography>
          </Box>
          <Box display={'flex'} gap={'8px'} alignItems={'center'}>
            <Typography fontWeight={'600'}>App Version:</Typography>
            <Typography noWrap>{payment?.appVersion}</Typography>
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
