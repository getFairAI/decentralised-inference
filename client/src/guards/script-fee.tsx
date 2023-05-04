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
  APP_NAME,
  APP_VERSION,
  DEFAULT_TAGS,
  SCRIPT_FEE_PAYMENT,
  SCRIPT_FEE_PAYMENT_SAVE,
  TAG_NAMES,
  secondInMS,
  successStatusCode,
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
import { ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ScriptFeeActions = ({
  hasPaid,
  handleAccept,
}: {
  hasPaid: boolean;
  handleAccept: () => void;
}) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return !hasPaid ? (
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
  ) : (
    <DialogActions
      sx={{ display: 'flex', justifyContent: 'center', gap: '30px', paddingBottom: '20px' }}
    >
      <Button onClick={handleHome} variant='contained'>
        Back to Home
      </Button>
    </DialogActions>
  );
};

const ScriptFeeGuard = ({ children }: { children: ReactNode }) => {
  const { state }: { state: ScriptNavigationState } = useLocation();
  const [isAllowed, setIsAllowed] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const { currentAddress } = useContext(WalletContext);
  const { startJob } = useContext(WorkerContext);

  const [getLazyFeePayment, queryResult] = useLazyQuery(QUERY_FEE_PAYMENT);

  useEffect(() => {
    if (currentAddress) {
      setLoading(true);
      const tags = [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.scriptTransaction, values: state.scriptTransaction },
        { name: TAG_NAMES.operationName, values: SCRIPT_FEE_PAYMENT },
      ];
      getLazyFeePayment({
        variables: {
          owner: currentAddress,
          recipient: state.scriptCurator,
          tags,
        },
      });
    }
  }, [currentAddress]);

  useEffect(() => {
    (async () => {
      if (
        queryResult.data &&
        queryResult.data.transactions &&
        queryResult.data.transactions.edges.length > 0
      ) {
        setIsAllowed(
          queryResult.data.transactions.edges[0].node.quantity.winston ===
            findTag(state.fullState, 'scriptFee') &&
            (await isTxConfirmed(queryResult.data.transactions.edges[0].node.id)),
        );
        setHasPaid(
          queryResult.data.transactions.edges[0].node.quantity.winston ===
            findTag(state.fullState, 'scriptFee') &&
            !(await isTxConfirmed(queryResult.data.transactions.edges[0].node.id)),
        );
        setLoading(false);
      } else if (queryResult.data) {
        // means there is no payment transactions
        setIsAllowed(false);
        setLoading(false);
      } else {
        // do nothing
      }
    })();
  }, [queryResult.data]);

  const payScriptFee = async () => {
    try {
      const scriptFee = findTag(state.fullState, 'scriptFee') as string;

      const saveTx = await arweave.createTransaction({ data: 'Save Transaction' });
      saveTx.addTag(TAG_NAMES.appName, APP_NAME);
      saveTx.addTag(TAG_NAMES.appVersion, APP_VERSION);
      saveTx.addTag(TAG_NAMES.operationName, SCRIPT_FEE_PAYMENT_SAVE);
      saveTx.addTag(TAG_NAMES.scriptName, state.scriptName);
      saveTx.addTag(TAG_NAMES.scriptCurator, state.scriptCurator);
      saveTx.addTag(TAG_NAMES.scriptFee, scriptFee);
      saveTx.addTag(TAG_NAMES.scriptTransaction, state.scriptTransaction);
      saveTx.addTag(TAG_NAMES.unixTime, (Date.now() / secondInMS).toString());
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
      tx.addTag(TAG_NAMES.scriptTransaction, state.scriptTransaction);
      tx.addTag(TAG_NAMES.unixTime, (Date.now() / secondInMS).toString());
      tx.addTag(TAG_NAMES.saveTransaction, saveResult.id);

      await arweave.transactions.sign(tx);
      const res = await arweave.transactions.post(tx);
      if (res.status === successStatusCode) {
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

  const handleAccept = useCallback(() => {
    payScriptFee();
  }, [payScriptFee]);

  return (
    <>
      <Backdrop
        sx={{ color: '#fff', zIndex: (currentTheme) => currentTheme.zIndex.drawer + 1 }}
        open={loading}
      >
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
                In Order to prevent bad actors an user has to pay the script fee before being able
                to use it. The current Script fee is{' '}
                {parseWinston(findTag(state.fullState, 'scriptFee') as string)}{' '}
                <img src='./arweave-logo-warning.svg'></img>
              </Typography>
            )}
          </Alert>
        </DialogContent>
        <ScriptFeeActions hasPaid={hasPaid} handleAccept={handleAccept} />
      </Dialog>
      {isAllowed && children}
    </>
  );
};
export default ScriptFeeGuard;
