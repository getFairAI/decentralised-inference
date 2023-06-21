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

import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useSnackbar } from 'notistack';
import { WalletContext } from '@/context/wallet';
import arweave from '@/utils/arweave';
import { NumberFormatValues, NumericFormat } from 'react-number-format';
import DebounceLoadingButton from './debounce-loading-button';
import { swapArToU } from '@/utils/u';
import { defaultDecimalPlaces } from '@/constants';

const SwapU = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { currentBalance: walletBalance, updateBalance: updateWalletBalance } =
    useContext(WalletContext);

  useEffect(() => {
    if (open) {
      (async () => updateWalletBalance())();
    }
  }, [open]);

  const handleClose = useCallback(() => setOpen(false), [setOpen]);
  const isAllowed = useCallback(
    (val: NumberFormatValues) => !val.floatValue || val?.floatValue < walletBalance,
    [walletBalance],
  );
  const handleAmountChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setAmount(+event.target.value),
    [setAmount],
  );
  const handleMaxClick = useCallback(() => setAmount(walletBalance), [walletBalance, setAmount]);

  const handleSwap = useCallback(async () => {
    setLoading(true);
    const winstonAmount = arweave.ar.arToWinston(amount.toString());
    try {
      const res = await swapArToU(winstonAmount);
      setAmount(0);
      enqueueSnackbar(
        <>
          Swapped {amount} AR to U tokens
          <br></br>
          <a href={`https://viewblock.io/arweave/tx/${res}`} target={'_blank'} rel='noreferrer'>
            <u> View Transaction in Explorer</u>
          </a>
        </>,
        { variant: 'success' },
      );
      setLoading(false);
      setOpen(false);
    } catch (error) {
      setLoading(false);
      enqueueSnackbar(`Error: ${error}`, { variant: 'error' });
    }
  }, [amount, setAmount, setLoading, setOpen, enqueueSnackbar]);

  return (
    <>
      <Dialog open={open} maxWidth={'sm'} fullWidth onClose={handleClose}>
        <DialogTitle>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '23px',
              lineHeight: '31px',
            }}
          >
            Swap AR to U
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert variant='outlined' severity='info' sx={{ marginBottom: '16px' }}>
            <Typography>
              Swapping Ar to U tokens implies burning AR. This proccess can take up to 10 minutes to
              be fully confirmed on the network.
            </Typography>
          </Alert>
          <Box
            display={'flex'}
            flexDirection={'column'}
            justifyContent={'space-evenly'}
            marginBottom={'8px'}
          >
            <NumericFormat
              value={amount}
              onChange={handleAmountChange}
              customInput={TextField}
              helperText={
                <Typography sx={{ cursor: 'pointer' }} variant='caption'>
                  <u>Max: {walletBalance.toFixed(defaultDecimalPlaces)}</u>
                </Typography>
              }
              FormHelperTextProps={{
                onClick: handleMaxClick,
              }}
              allowNegative={false}
              isAllowed={isAllowed}
              margin='dense'
              decimalScale={4}
              decimalSeparator={'.'}
            />
          </Box>
          <Box>
            <DebounceLoadingButton
              loading={loading}
              variant='outlined'
              onClick={handleSwap}
              disabled={amount <= 0 || amount >= walletBalance}
            >
              Swap
            </DebounceLoadingButton>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SwapU;
