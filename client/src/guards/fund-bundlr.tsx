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

import { BundlrContext } from '@/context/bundlr';
import { FundContext } from '@/context/fund';
import { WalletContext } from '@/context/wallet';
import {
  Dialog,
  DialogTitle,
  Typography,
  DialogContent,
  Alert,
  DialogActions,
  Button,
  useTheme,
} from '@mui/material';
import { ReactElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const FundBundlr = ({ children }: { children: ReactElement }) => {
  const { currentAddress } = useContext(WalletContext);
  const { nodeBalance, isLoading } = useContext(BundlrContext);
  const { setOpen: setFundOpen } = useContext(FundContext);
  const [ignore, setIgnore] = useState(false);
  const theme = useTheme();

  const isOpen = useMemo(
    () => nodeBalance <= 0 && !ignore && !isLoading && !!currentAddress,
    [nodeBalance, ignore, isLoading, currentAddress],
  );

  useEffect(() => setIgnore(false), [currentAddress]); // set ignore to false when user changes wallet

  const handleFundNow = useCallback(() => {
    setIgnore(true);
    setFundOpen(true);
  }, [setIgnore, setFundOpen]);

  const handleIgnore = useCallback(() => setIgnore(true), [setIgnore]);

  return (
    <>
      <Dialog
        open={isOpen}
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
            {'Missing Bundlr Funds'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert
            /* onClose={() => setOpen(false)} */
            variant='outlined'
            severity='warning'
            sx={{
              marginBottom: '16px',
              borderRadius: '23px',
              color: theme.palette.warning.light,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              '& .MuiAlert-icon': {
                justifyContent: 'center',
              },
              '& .MuiAlert-message': {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              },
            }}
            icon={<img src='./warning-icon.svg'></img>}
          >
            <Typography
              sx={{
                fontWeight: 400,
                fontSize: '30px',
                lineHeight: '41px',
                display: 'block',
                textAlign: 'center',
              }}
            >
              {
                'You do not have enough Bundlr Funds to use this app. Please fund your Bundlr Node to continue.'
              }
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: '30px',
            paddingBottom: '20px',
          }}
        >
          <Button
            onClick={handleIgnore}
            variant='outlined'
            color='warning'
            sx={{ width: 'fit-content' }}
          >
            <Typography color={theme.palette.warning.main}>Fund Later</Typography>
          </Button>
          <Button
            onClick={handleFundNow}
            variant='contained'
            color='warning'
            sx={{ width: 'fit-content' }}
          >
            <Typography color={theme.palette.primary.contrastText}>Fund Now</Typography>
          </Button>
        </DialogActions>
      </Dialog>
      {children}
    </>
  );
};

export default FundBundlr;
