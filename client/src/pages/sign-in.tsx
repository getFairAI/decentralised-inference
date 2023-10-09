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

import Logo from '@/components/logo';
import { BUY_AR_LINK, CREATE_WALLET_LINK, TAG_NAMES, U_CONTRACT_ID, U_LOGO_SRC } from '@/constants';
import { ChooseWalletContext } from '@/context/choose-wallet';
import { WalletContext } from '@/context/wallet';
import { IEdge } from '@/interfaces/arweave';
import { QUERY_TXS_BY_RECIPIENT, QUERY_TX_WITH } from '@/queries/graphql';
import { displayShortTxOrAddr, findTag } from '@/utils/common';
import { useQuery } from '@apollo/client';
import {
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Slider,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import { useLocation, useNavigate } from 'react-router-dom';
import { Close, InfoOutlined } from '@mui/icons-material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import arweave, { isTxConfirmed } from '@/utils/arweave';
import { LoadingButton } from '@mui/lab';
import { swapArToU } from '@/utils/u';
import { useSnackbar } from 'notistack';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import AiCard from '@/components/ai-card';
import useModels from '@/hooks/useModels';

type EdgeWithStatus = IEdge & { status: string };

const WalletnotConnectedContent = () => {
  const { setOpen: setChooseWalletOpen } = useContext(ChooseWalletContext);
  const handleClick = useCallback(() => setChooseWalletOpen(true), [setChooseWalletOpen]);

  return (
    <>
      <Box display={'flex'}>
        <Logo />
      </Box>
      <Box>
        <Typography
          sx={{ color: '#1F1F26' }}
          fontWeight={300}
          fontSize={'30px'}
          lineHeight={'40.5px'}
          align='center'
        >
          First, Lets get connected!
        </Typography>
      </Box>
      <Button sx={{ borderRadius: '8px', gap: '10px', background: '#FFF' }} onClick={handleClick}>
        <Typography
          sx={{ color: '#1F1F26' }}
          fontWeight={700}
          fontSize={'18px'}
          lineHeight={'24.3px'}
        >
          Connect Wallet
        </Typography>
      </Button>
      <Box display={'flex'} gap={'8px'}>
        <Typography display={'flex'} gap={'8px'} alignItems={'center'} fontWeight={'500'} noWrap>
          <InfoOutlined /* sx={{ fontSize: '12px' }}  */ />
          Don&apos;t have a wallet yet?
        </Typography>
        <Typography display={'flex'} gap={'8px'} alignItems={'center'} noWrap>
          <a href={CREATE_WALLET_LINK} target='_blank' rel='noreferrer'>
            <u>Learn how to create one.</u>
          </a>
        </Typography>
      </Box>
    </>
  );
};

const WalletNoFundsContent = () => {
  const theme = useTheme();
  const { currentAddress, currentBalance, currentUBalance } = useContext(WalletContext);
  const [lastTx, setLastTx] = useState<EdgeWithStatus | null>(null);
  const [lastMintTx, setLastMintTx] = useState<EdgeWithStatus | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [percentageAmount, setPercentageAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [currentHeight, setCurrentHeight] = useState(0);
  const navigate = useNavigate();

  const minPercentage = 0;
  const stepPercentage = 1;
  const maxPercentage = 100;

  useEffect(() => {
    (async () => {
      const height = (await arweave.blocks.getCurrent()).height;
      setCurrentHeight(height);
    })();
  }, []);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = useCallback(() => navigate('/'), [navigate]);

  const handleSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => setPercentageAmount(newValue as number),
    [percentageAmount],
  );

  const { data: receivedData } = useQuery(QUERY_TXS_BY_RECIPIENT, {
    variables: {
      recipients: [currentAddress],
      first: 1,
    },
  });

  const { data: mintData, refetch } = useQuery(QUERY_TX_WITH, {
    variables: {
      tags: [
        {
          name: TAG_NAMES.appName,
          values: ['SmartWeaveAction'],
        },
        {
          name: TAG_NAMES.appVersion,
          values: ['0.3.0'],
        },
        {
          name: TAG_NAMES.contract,
          values: [U_CONTRACT_ID],
        },
        {
          name: TAG_NAMES.input,
          values: [JSON.stringify({ function: 'mint' })],
        },
      ],
      address: currentAddress,
      blockFilter: {
        min: currentHeight - 100,
      },
    },
    skip: !currentAddress || !currentHeight,
  });

  useEffect(() => {
    if (receivedData) {
      const latestReceivedTx = receivedData.transactions.edges[0];
      if (!latestReceivedTx) {
        return;
      }

      (async () => {
        const confirmed = await isTxConfirmed(latestReceivedTx.node.id);
        setLastTx({ ...latestReceivedTx, status: confirmed ? 'confirmed' : 'pending' });
      })();
    }
  }, [receivedData]);

  useEffect(() => {
    if (mintData) {
      const latestMintTx = mintData.transactions.edges[0];

      if (!latestMintTx) {
        return;
      }

      (async () => {
        const confirmed = await isTxConfirmed(latestMintTx.node.id);
        setLastMintTx({ ...latestMintTx, status: confirmed ? 'confirmed' : 'pending' });
      })();
    }
  }, [mintData]);

  const handleSwap = useCallback(async () => {
    const amount = currentBalance * (percentageAmount / maxPercentage);
    const winstonAmount = arweave.ar.arToWinston(amount.toString());
    try {
      const res = await swapArToU(winstonAmount);

      enqueueSnackbar(
        <>
          Swapped {amount} AR to $U tokens
          <br></br>
          <a href={`https://viewblock.io/arweave/tx/${res}`} target={'_blank'} rel='noreferrer'>
            <u> View Transaction in Explorer</u>
          </a>
        </>,
        { variant: 'success' },
      );
      setLastMintTx({
        node: {
          id: res as string,
          tags: [],
          owner: { address: currentAddress, key: '' },
          data: { size: 0, type: null },
          signature: '',
          block: { height: 0, id: '', timestamp: 0, previous: '' },
          fee: { ar: amount.toString(), winston: winstonAmount },
          quantity: { ar: '0', winston: '0' },
          recipient: '',
        },
        status: 'pending',
      });
      setPercentageAmount(0);
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } catch (error) {
      setLoading(false);
      enqueueSnackbar(`Error: ${error}`, { variant: 'error' });
    }
  }, [percentageAmount, currentBalance, enqueueSnackbar, refetch, setLoading]);

  const isPending = useMemo(() => !!lastMintTx && lastMintTx?.status !== 'confirmed', [lastMintTx]);

  return (
    <>
      <Stepper
        activeStep={activeStep}
        orientation='vertical'
        sx={{ width: '60%', ml: '50%', /*  */ mr: '50%' }}
      >
        <Step sx={{ width: '100%' }}>
          <StepLabel>
            <Typography fontWeight={'700'}>Check AR Balance</Typography>
          </StepLabel>
          <StepContent sx={{ width: '100%' }}>
            <Box display={'flex'} width={'100%'} justifyContent={'space-between'}>
              <NumericFormat
                label='Available AR Balance'
                placeholder='Available AR Balance'
                value={currentBalance}
                thousandSeparator={true}
                customInput={TextField}
                variant='outlined'
                allowNegative={false}
                disabled={true}
                sx={{
                  width: '85%',
                }}
                InputProps={{
                  endAdornment: (
                    <img width='20px' height='20px' src='./arweave-logo-for-light.png' />
                  ),
                }}
                helperText={
                  <Box display={'flex'} gap={'8px'}>
                    <Typography
                      display={'flex'}
                      gap={'8px'}
                      alignItems={'center'}
                      fontWeight={'500'}
                      color={'primary'}
                      noWrap
                    >
                      <InfoOutlined />
                      Looking for a way to buy AR?
                    </Typography>
                    <Typography alignItems={'center'} color='primary' noWrap>
                      <a href={BUY_AR_LINK} target='_blank' rel='noreferrer'>
                        <u>Find out How.</u>
                      </a>
                    </Typography>
                  </Box>
                }
              />
              {currentBalance > 0 ? (
                <CheckCircleOutlineIcon color='success' fontSize='large' sx={{ mt: '8px' }} />
              ) : (
                <InfoOutlinedIcon color='warning' fontSize='large' sx={{ mt: '8px' }} />
              )}
            </Box>
            {lastTx && (
              <Box mt={'16px'}>
                <Divider textAlign='left'>
                  <Typography>Last Pending Transaction</Typography>
                </Divider>
                <Box display={'flex'} justifyContent={'space-between'} mt={'16px'}>
                  <Box sx={{ display: 'flex', fontWeight: 500, gap: '8px' }}>
                    <Typography>ID:</Typography>
                    <Typography>
                      <u>{displayShortTxOrAddr(lastTx.node.id)}</u>
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', fontWeight: 500, gap: '8px' }}>
                    <Typography>Status:</Typography>
                    <Typography
                      color={
                        lastTx.status === 'confirmed'
                          ? theme.palette.success.main
                          : theme.palette.warning.main
                      }
                    >
                      {lastTx.status}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
            <Box display={'flex'} justifyContent={'flex-end'} mt={'16px'}>
              <Button variant='contained' onClick={handleNext}>
                Next
              </Button>
            </Box>
          </StepContent>
        </Step>
        <Step>
          <StepLabel>
            <Typography fontWeight={'700'}>Check $U Balance</Typography>
          </StepLabel>
          <StepContent sx={{ width: '100%' }}>
            <Box sx={{ width: '100%', display: 'flex', gap: '32px', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', gap: '16px' }}>
                <NumericFormat
                  label='Available $u Balance'
                  placeholder='Available $u Balance'
                  value={currentUBalance}
                  thousandSeparator={true}
                  customInput={TextField}
                  variant='outlined'
                  allowNegative={false}
                  disabled={true}
                  sx={{
                    width: '85%',
                  }}
                  InputProps={{
                    endAdornment: <img width='20px' height='20px' src={U_LOGO_SRC} />,
                  }}
                />
                {currentUBalance > 0 ? (
                  <CheckCircleOutlineIcon color='success' fontSize='large' sx={{ mt: '8px' }} />
                ) : (
                  <InfoOutlinedIcon color='warning' fontSize='large' sx={{ mt: '8px' }} />
                )}
              </Box>
              <Box>
                <Typography>Percentage of AR Balance to Swap to $U</Typography>
                <Slider
                  sx={{
                    width: '100%',
                  }}
                  value={percentageAmount}
                  onChange={handleSliderChange}
                  max={maxPercentage}
                  min={minPercentage}
                  step={stepPercentage}
                  marks={true}
                  valueLabelDisplay='auto'
                />
                <Typography sx={{ cursor: 'pointer' }} variant='caption'>
                  <u>Max: {currentBalance}</u>
                </Typography>
              </Box>
              {lastMintTx && (
                <Box mt={'16px'}>
                  <Divider textAlign='left'>
                    <Typography>Last Pending Transaction</Typography>
                  </Divider>
                  <Box display={'flex'} justifyContent={'space-between'} mt={'16px'}>
                    <Box sx={{ display: 'flex', fontWeight: 500, gap: '8px' }}>
                      <Typography>ID:</Typography>
                      <Typography>
                        <u>{displayShortTxOrAddr(lastMintTx.node.id)}</u>
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', fontWeight: 500, gap: '8px' }}>
                      <Typography>Status:</Typography>
                      <Typography
                        color={
                          lastMintTx.status === 'confirmed'
                            ? theme.palette.success.main
                            : theme.palette.warning.main
                        }
                      >
                        {lastMintTx.status}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
              <Box display={'flex'} justifyContent={'space-between'} width={'100%'} gap={'16px'}>
                <Button variant='outlined' onClick={handleBack}>
                  <Typography>Back</Typography>
                </Button>
                <Box>
                  <LoadingButton
                    variant='contained'
                    loading={loading || isPending}
                    loadingPosition='end'
                    onClick={handleSwap}
                    endIcon={<SwapHorizOutlinedIcon />}
                  >
                    <Typography>Swap AR to $U</Typography>
                  </LoadingButton>
                </Box>
              </Box>
            </Box>
          </StepContent>
        </Step>
        {activeStep === 2 && (
          <Box
            display={'flex'}
            flexDirection={'column'}
            gap={'8px'}
            justifyContent={'center'}
            p={2}
          >
            <Typography fontWeight={'500'}>All Done!</Typography>
            <Typography>
              Your Transaction is being processed by the network. This proccess is expected to take
              about 15 min and your $U funds will not be available until then.
            </Typography>
            <Typography>
              You can track the process{' '}
              <a
                href={`https://viewblock.io/arweave/tx/${lastMintTx?.node.id}`}
                target='_blank'
                rel='noreferrer'
              >
                <u>here</u>
              </a>
            </Typography>
            <Box display={'flex'} justifyContent={'flex-end'} mt={'16px'}>
              <Button sx={{ mt: 1, mr: 1 }} variant='outlined' onClick={handleSkip}>
                Explore marketplace
              </Button>
            </Box>
          </Box>
        )}
      </Stepper>
    </>
  );
};

const SinginWithFunds = () => {
  const singinFeatureElements = 4;
  const { featuredTxs, loading } = useModels(undefined, singinFeatureElements);

  return (
    <>
      <Box display={'flex'}>
        <Logo />
      </Box>
      <Box>
        <Typography
          sx={{ color: '#1F1F26' }}
          fontWeight={300}
          fontSize={'30px'}
          lineHeight={'40.5px'}
          align='center'
        >
          Choose A model to get started!
        </Typography>
      </Box>
      <Box className={'feature-cards-row'} justifyContent={'flex-end'}>
        {featuredTxs.map((el) => (
          <Box key={el.node.id} display={'flex'} flexDirection={'column'} gap={'30px'}>
            <AiCard model={el} key={el.node.id} loading={loading} useModel={true} />
            <Typography>{findTag(el, 'description')}</Typography>
          </Box>
        ))}
      </Box>
    </>
  );
};

const SignIn = () => {
  const { pathname } = useLocation();
  const { currentAddress, currentUBalance } = useContext(WalletContext);
  const isConnected = useMemo(() => !!currentAddress, [currentAddress]);

  const navigate = useNavigate();

  const handleSkip = useCallback(() => navigate('/'), [navigate]);

  const isSwap = useMemo(() => pathname === '/swap', [pathname]);
  return (
    <Container
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '21px',
      }}
    >
      {!isConnected && <WalletnotConnectedContent />}

      {isConnected && (currentUBalance <= 0 || isSwap) && <WalletNoFundsContent />}

      {!isSwap && isConnected && currentUBalance > 0 && <SinginWithFunds />}

      <IconButton
        sx={{
          top: '40px',
          right: '40px',
          position: 'fixed',
          borderRadius: '8px',
          background: '#FFF',
          border: '0.5px solid',
        }}
        onClick={handleSkip}
      >
        <Close />
      </IconButton>
    </Container>
  );
};

export default SignIn;
