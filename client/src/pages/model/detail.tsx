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
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  InputBase,
  Typography,
  useTheme,
} from '@mui/material';
import { Box } from '@mui/system';
import { useLoaderData, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  APP_NAME,
  APP_VERSION,
  MARKETPLACE_ADDRESS,
  MODEL_FEE_UPDATE,
  TAG_NAMES,
} from '@/constants';
import { ChangeEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import arweave from '@/utils/arweave';
import { toSvg } from 'jdenticon';
import { findTag } from '@/utils/common';
import { ModelNavigationState, RouteLoaderResult } from '@/interfaces/router';
import { useSnackbar } from 'notistack';
import { WalletContext } from '@/context/wallet';
import { NumericFormat } from 'react-number-format';
import ChooseOperator from '@/components/choose-operator';
import ChooseScript from '@/components/choose-script';
import { IEdge } from '@/interfaces/arweave';
import Vote from '@/components/vote';

const Detail = () => {
  const loaderData = useLoaderData() as RouteLoaderResult;
  const { state, pathname }: { state: ModelNavigationState; pathname: string } = useLocation();
  const { txid } = useParams();
  const navigate = useNavigate();
  const [feeValue, setFeeValue] = useState(0);
  const [feeDirty, setFeeDirty] = useState(false);
  const [showOperators, setShowOperators] = useState(false);
  const [showScripts, setShowScripts] = useState(false);
  const [scriptTx, setScriptTx] = useState<IEdge | undefined>(undefined);
  const { currentAddress } = useContext(WalletContext);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const [avatarTxId, setAvatarTxId] = useState<string | undefined>(undefined);
  const [updatedFee, setUpdatedFee] = useState<string | undefined>(undefined);

  const imgUrl = useMemo(() => {
    if (avatarTxId) {
      return `https://arweave.net/${avatarTxId}`;
    }
    const img = toSvg(txid, 100);
    const svg = new Blob([img], { type: 'image/svg+xml' });
    return URL.createObjectURL(svg);
  }, [avatarTxId]);

  // disable update fees on model for now
  const updateDisabled = useMemo(() => true, [ feeDirty, feeValue ]);

  const handleClose = () => {
    if (pathname.includes('change-operator')) {
      navigate(pathname.split('/change-operator')[0], { state });
      return;
    }
    navigate('/', { state });
  };

  const updateFee = useCallback(async () => {
    try {
      const tx = await arweave.createTransaction({
        quantity: arweave.ar.arToWinston('0'),
        target: MARKETPLACE_ADDRESS,
      });
      tx.addTag(TAG_NAMES.appName, APP_NAME);
      tx.addTag(TAG_NAMES.appVersion, APP_VERSION);
      tx.addTag(TAG_NAMES.operationName, MODEL_FEE_UPDATE);
      tx.addTag(TAG_NAMES.modelName, state.modelName);
      tx.addTag(TAG_NAMES.modelTransaction, state.modelTransaction);
      tx.addTag(TAG_NAMES.modelFee, arweave.ar.arToWinston(`${feeValue}`));
      tx.addTag(TAG_NAMES.unixTime, (Date.now() / 1000).toString());
      await arweave.transactions.sign(tx);
      const payRes = await arweave.transactions.post(tx);
      if (payRes.status === 200) {
        enqueueSnackbar(
          <>
            Updated Model Fee
            <br></br>
            <a href={`https://viewblock.io/arweave/tx/${tx.id}`} target={'_blank'} rel='noreferrer'>
              <u>View Transaction in Explorer</u>
            </a>
          </>,
          {
            variant: 'success',
          },
        );
        setFeeDirty(false);
      } else {
        enqueueSnackbar(`Failed with error ${payRes.status}: ${payRes.statusText}`, {
          variant: 'error',
        });
      }
    } catch (err) {
      enqueueSnackbar('Something Went Wrong', { variant: 'error' });
    }
  }, [ arweave, enqueueSnackbar, setFeeDirty, state ]);

  const handleFeeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value !== '' ? parseFloat(event.target.value) : 0;
    setFeeValue(val);
    setFeeDirty(true);
  };

  useEffect(() => {
    if (updatedFee) {
      const arValue = arweave.ar.winstonToAr(updatedFee);
      setFeeValue(parseFloat(arValue));
    } else {
      const arValue = arweave.ar.winstonToAr(state.fee);
      setFeeValue(parseFloat(arValue));
    }
  }, [updatedFee]);

  useEffect(() => {
    if (loaderData) {
      setAvatarTxId(loaderData.avatarTxId);
      setUpdatedFee(loaderData.updatedFee);
    }
  }, [loaderData]);

  const handleScriptChosen = (scriptTx: IEdge) => {
    setShowOperators(true);
    setScriptTx(scriptTx);
  };

  const showScriptsFragment = () => {
    return showScripts ? (
      <ChooseScript
        setShowScripts={setShowScripts}
        handleScriptChosen={handleScriptChosen}
        defaultScriptTx={scriptTx}
      />
    ) : (
      <DialogActions
        sx={{
          justifyContent: 'center',
        }}
      >
        <Button
          sx={{
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: '23px',
            lineHeight: '31px',
            display: 'flex',
            alignItems: 'center',
            textAlign: 'center',
            borderRadius: '30px',
          }}
          variant='contained'
          onClick={() => setShowScripts(true)}
          data-testid='choose-script-button'
        >
          <Box display='flex'>
            <Typography>{'Choose a Script '}</Typography>
            <Icon sx={{ rotate: '-90deg' }}>
              <img src='./triangle.svg' />
            </Icon>
          </Box>
        </Button>
      </DialogActions>
    );
  };

  return (
    <Dialog
      open={true}
      maxWidth={'lg'}
      fullWidth
      sx={{
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
        justifyContent={showOperators || showScripts ? 'space-between' : 'flex-end'}
        alignItems='center'
        lineHeight={0}
      >
        {(showOperators || showScripts) && <Typography>{state.modelName}</Typography>}
        <IconButton
          onClick={handleClose}
          sx={{
            background: theme.palette.primary.main,
            '&:hover': { background: theme.palette.primary.main, opacity: 0.8 },
          }}
        >
          <img src='./close-icon.svg' />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          display: showOperators || showScripts ? 'none' : 'flex',
          gap: '48px',
          justifyContent: 'space-evenly',
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
        <Box display={'flex'} flexDirection={'column'} gap={'16px'} width={'30%'}>
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
              data-testid='model-name'
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
              data-testid='model-name-value'
            >
              {state.modelName}
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
              {findTag(state.fullState, 'category')}
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
              {currentAddress === state.modelCreator ? (
                <NumericFormat
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
                  value={feeValue}
                  onChange={handleFeeChange}
                  customInput={InputBase}
                  decimalScale={3}
                  decimalSeparator={'.'}
                />
              ) : (
                <Typography
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
                >
                  {feeValue}
                </Typography>
              )}
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
            <Typography>
              {findTag(state.fullState, 'description') || 'No Description Available.'}
            </Typography>
          </Box>
          {currentAddress === state.modelCreator ? (
            <Button variant='outlined' disabled={updateDisabled} onClick={updateFee}>
              Update
            </Button>
          ) : (
            <Vote
              tx={state.fullState}
              fee={feeValue}
              owner={state.modelCreator}
              voteFor={'model'}
            />
          )}
        </Box>
      </DialogContent>
      {showOperators ? (
        <ChooseOperator setShowOperators={setShowOperators} scriptTx={scriptTx} />
      ) : (
        showScriptsFragment()
      )}
    </Dialog>
  );
};

export default Detail;
