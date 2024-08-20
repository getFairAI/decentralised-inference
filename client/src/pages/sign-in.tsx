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
  BUY_ARB_LINK,
  BUY_USDC_LINK,
  CREATE_ALTERNATIVE_LINK,
  CREATE_WALLET_LINK,
  MIN_U_BALANCE,
} from '@/constants';
import { ChooseWalletContext } from '@/context/choose-wallet';
import { IEdge } from '@/interfaces/arweave';
import { QUERY_TXS_BY_RECIPIENT } from '@/queries/graphql';
import { displayShortTxOrAddr } from '@/utils/common';
import { useQuery } from '@apollo/client';
import {
  Box,
  Button,
  Container,
  Divider,
  FormHelperTextProps,
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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { isTxConfirmed } from '@/utils/arweave';
import { EVMWalletContext } from '@/context/evm-wallet';
import { StyledMuiButton } from '@/styles/components';
import { motion } from 'framer-motion';
import { MobileView, BrowserView } from 'react-device-detect';
import OnboadingPage from './onboarding-page';

// icons
import { InfoOutlined } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';

type EdgeWithStatus = IEdge & { status: string };

const justifyContent = 'space-between';

const WalletnotConnectedContent = () => {
  const { setOpen: setChooseWalletOpen } = useContext(ChooseWalletContext);
  const handleClick = useCallback(() => setChooseWalletOpen(true), [setChooseWalletOpen]);
  const { providers } = useContext(EVMWalletContext);

  return (
    <motion.div
      initial={{ y: '-40px', opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0, duration: 0.6 } }}
      className='w-full h-full flex flex-col items-center justify-start px-4 mt-20'
    >
      <div className='w-full flex flex-col justify-center items-center gap-10'>
        <Box>
          <img
            src='./fair-ai-outline.svg'
            alt='FairAI Logo'
            style={{ width: '230px', filter: 'brightness(1.5)' }}
          />
        </Box>
        <Box>
          <Typography fontWeight={600} fontSize={'28px'} align='center' color={'rgb(60,60,60)'}>
            You are one step away from experiencing FairAI.
          </Typography>

          <Typography fontWeight={400} fontSize={'22px'} align='center' color={'rgb(60,60,60)'}>
            All you need is just two clicks away.
          </Typography>
        </Box>
        {providers.length > 0 && (
          <StyledMuiButton
            onClick={handleClick}
            className='plausible-event-name=Onboarding+Connect+Wallet+Click primary bigger gradient-bg'
          >
            <img src='./arbitrum-logo.svg' style={{ width: '24px' }} />
            Connect or get your wallet to the Arbitrum Network
            <PlayArrowRoundedIcon />
          </StyledMuiButton>
        )}
        {providers.length === 0 && (
          <>
            <MobileView>
              <div className='flex flex-col gap-6 justify-center items-center'>
                <div className='flex gap-3 rounded-xl my-2 py-3 px-4 bg-amber-400 font-medium'>
                  <ErrorRoundedIcon />
                  <span>
                    You seem to be using a mobile browser or operating system. Currently, wallets
                    are very limited on mobile. For now, we strongly recommend you use the in-app
                    browser inside the MetaMask wallet app for mobile.
                  </span>
                </div>

                <div className='flex flex-wrap gap-4 items-center flex-col md:flex-row'>
                  <a
                    href={CREATE_WALLET_LINK}
                    target='_blank'
                    rel='noreferrer'
                    className='plausible-event-name=Wallet+Create+Recommended+Click'
                  >
                    <StyledMuiButton className='primary'>
                      <DownloadRoundedIcon />
                      Install MetaMask App
                    </StyledMuiButton>
                  </a>
                </div>
              </div>
            </MobileView>

            <BrowserView>
              <div className='flex flex-col gap-6 justify-center items-center'>
                <div className='flex items-center gap-3 rounded-xl my-2 py-3 px-4 bg-amber-400 font-medium'>
                  <ErrorRoundedIcon /> No wallets detected. Please install a wallet first.
                </div>

                <div className='flex flex-wrap gap-4 items-center flex-col md:flex-row'>
                  <a
                    href={CREATE_WALLET_LINK}
                    target='_blank'
                    rel='noreferrer'
                    className='plausible-event-name=Wallet+Create+Recommended+Click'
                  >
                    <StyledMuiButton className='primary'>
                      <DownloadRoundedIcon />
                      Install our recommended wallet
                    </StyledMuiButton>
                  </a>
                  <span className='text-lg font-semibold'>{' or '}</span>
                  <a
                    href={CREATE_ALTERNATIVE_LINK}
                    target='_blank'
                    rel='noreferrer'
                    className='plausible-event-name=Wallet+Create+Alternatives+Click'
                  >
                    <StyledMuiButton className='secondary'>
                      <OpenInNewRoundedIcon />
                      find alternatives
                    </StyledMuiButton>
                  </a>
                </div>
              </div>
            </BrowserView>
          </>
        )}
      </div>
    </motion.div>
  );
};

const WalletNoFundsContent = () => {
  const theme = useTheme();
  const { state } = useLocation();
  const { currentAddress, ethBalance, usdcBalance } = useContext(EVMWalletContext);
  const [lastTx, setLastTx] = useState<EdgeWithStatus | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const navigate = useNavigate();

  const handleNext = useCallback(
    () => setActiveStep((prevActiveStep) => prevActiveStep + 1),
    [setActiveStep],
  );

  const handleBack = useCallback(
    () => setActiveStep((prevActiveStep) => prevActiveStep - 1),
    [setActiveStep],
  );

  const handleSkip = useCallback(() => {
    if (state?.previousPath) {
      navigate(state.previousPath, { state });
    } else {
      navigate('/');
    }
  }, [state, navigate]);

  const { data: receivedData } = useQuery(QUERY_TXS_BY_RECIPIENT, {
    variables: {
      recipients: [currentAddress],
      first: 1,
    },
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

  return (
    <>
      <Stepper
        activeStep={activeStep}
        orientation='vertical'
        sx={{ width: '60%', ml: '50%', /*  */ mr: '50%' }}
      >
        <Step sx={{ width: '100%' }}>
          <StepLabel>
            <Typography fontWeight={'700'}>Top Up ETH Balance</Typography>
          </StepLabel>
          <StepContent sx={{ width: '100%' }}>
            <Box display={'flex'} width={'100%'} justifyContent={justifyContent} mt={'16px'}>
              <NumericFormat
                label='Available ETH Balance'
                placeholder='Available ETH Balance'
                value={ethBalance}
                thousandSeparator={true}
                customInput={TextField}
                variant='outlined'
                allowNegative={false}
                disabled={true}
                sx={{
                  width: '85%',
                }}
                InputProps={{
                  endAdornment: <img width='20px' height='20px' src='./eth-logo.svg' />,
                }}
                FormHelperTextProps={{ component: 'div' } as Partial<FormHelperTextProps>}
                helperText={
                  <>
                    <Box display={'flex'} gap={'8px'} mt={'8px'}>
                      <Typography
                        display={'flex'}
                        gap={'8px'}
                        alignItems={'center'}
                        fontWeight={'500'}
                        color={'primary'}
                        noWrap
                      >
                        <InfoOutlined />
                        Looking for a way to buy ETH on Arbitrum?
                      </Typography>
                      <Typography alignItems={'center'} color='primary' noWrap>
                        <a href={BUY_ARB_LINK} target='_blank' rel='noreferrer'>
                          <u>Find out How.</u>
                        </a>
                      </Typography>
                    </Box>
                  </>
                }
              />
              {ethBalance > 0 ? (
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
                <Box display={'flex'} justifyContent={justifyContent} mt={'16px'}>
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
            <Box display={'flex'} justifyContent={'flex-end'} mt={'48px'}>
              <Button
                variant='contained'
                onClick={handleNext}
                sx={{ mt: 1, mr: 1 }}
                className='plausible-event-name=Onboarding+Top+Up+U+Click'
              >
                Top Up USDC
              </Button>
            </Box>
          </StepContent>
        </Step>
        <Step>
          <StepLabel>
            <Typography fontWeight={'700'}>Top Up USDC Balance</Typography>
          </StepLabel>
          <StepContent sx={{ width: '100%' }}>
            <Box display={'flex'} width={'100%'} justifyContent={justifyContent} mt={'16px'}>
              <NumericFormat
                label='Available USDC Balance'
                placeholder='Available USDC Balance'
                value={usdcBalance}
                thousandSeparator={true}
                customInput={TextField}
                variant='outlined'
                allowNegative={false}
                disabled={true}
                sx={{
                  width: '85%',
                }}
                InputProps={{
                  endAdornment: <img width='20px' height='20px' src={'./usdc-logo.svg'} />,
                }}
                FormHelperTextProps={{ component: 'div' } as Partial<FormHelperTextProps>}
                helperText={
                  <>
                    <Box display={'flex'} gap={'8px'} mt={'8px'}>
                      <Typography
                        display={'flex'}
                        gap={'8px'}
                        alignItems={'center'}
                        fontWeight={'500'}
                        color={'primary'}
                        noWrap
                      >
                        <InfoOutlined />
                        Looking for a way to get USDC?
                      </Typography>
                      <Typography alignItems={'center'} color='primary' noWrap>
                        <a href={BUY_USDC_LINK} target='_blank' rel='noreferrer'>
                          <u>Learn How.</u>
                        </a>
                      </Typography>
                    </Box>
                  </>
                }
              />
              {usdcBalance >= MIN_U_BALANCE ? (
                <CheckCircleOutlineIcon color='success' fontSize='large' sx={{ mt: '8px' }} />
              ) : (
                <InfoOutlinedIcon color='warning' fontSize='large' sx={{ mt: '8px' }} />
              )}
            </Box>
            <Box display={'flex'} justifyContent={justifyContent} mt={'48px'}>
              <Button
                sx={{ mt: 1, mr: 1 }}
                onClick={handleBack}
                variant='outlined'
                className='plausible-event-name=Onboarding+Top+Up+AR+Click'
              >
                Top Up ETH
              </Button>
              <Button
                sx={{ mt: 1, mr: 1 }}
                variant='contained'
                onClick={handleSkip}
                className='plausible-event-name=Explore+Marketplace'
              >
                Explore marketplace
              </Button>
            </Box>
          </StepContent>
        </Step>
      </Stepper>
    </>
  );
};

const SignIn = () => {
  const { pathname, state } = useLocation();
  const { currentAddress, usdcBalance } = useContext(EVMWalletContext);
  const isConnected = useMemo(() => !!currentAddress, [currentAddress]);
  const { setOpen: setChooseWalletOpen } = useContext(ChooseWalletContext);
  const handleClick = useCallback(() => setChooseWalletOpen(true), [setChooseWalletOpen]);
  const { providers } = useContext(EVMWalletContext);

  const navigate = useNavigate();

  const handleSkip = useCallback(() => navigate('/'), [navigate]);

  const isSwap = useMemo(() => pathname === '/swap', [pathname]);

  useEffect(() => {
    if (isSwap) {
      // ignore
    } else if (isConnected && usdcBalance >= MIN_U_BALANCE && state?.previousPath) {
      navigate(state.previousPath, { state });
    } else if (isConnected && usdcBalance >= MIN_U_BALANCE && state) {
      navigate('/chat', { state });
    } else if (isConnected && usdcBalance >= MIN_U_BALANCE) {
      navigate('/');
    } else {
      // ignore
    }
  }, [isConnected]);

  return (
    <motion.div
      initial={{ opacity: 0, y: '-60px' }}
      animate={{ opacity: 1, y: 0, transition: { type: 'keyframes', duration: 0.4 } }}
    >
      <Container
        sx={{
          width: '100vw',
          minWidth: '100vw',
          maxHeight: '100vh',
          paddingBottom: '100px',
          overflowY: 'auto',
          position: 'absolute',
          background: 'linear-gradient(220deg, #9fd6d6, #ffffff)',
          top: 0,
          left: 0,
        }}
      >
        {!isConnected && <WalletnotConnectedContent />}

        {isConnected && (usdcBalance < MIN_U_BALANCE || isSwap) && <WalletNoFundsContent />}

        <div className='absolute top-[20px] right-[20px] z-[1001]'>
          <StyledMuiButton
            className='plausible-event-name=Close+Onboarding+Click secondary fully-rounded'
            onClick={handleSkip}
          >
            <CloseIcon />
          </StyledMuiButton>
        </div>
        <div className='mt-20'>
          <OnboadingPage />
        </div>

        <div className='w-100 flex justify-center mt-24 mb-5'>
          {providers.length > 0 && (
            <StyledMuiButton
              onClick={handleClick}
              className='plausible-event-name=Onboarding+Connect+Wallet+Click primary bigger gradient-bg'
            >
              <img src='./arbitrum-logo.svg' style={{ width: '24px' }} />
              Connect or get your wallet to the Arbitrum Network
              <PlayArrowRoundedIcon />
            </StyledMuiButton>
          )}
        </div>
      </Container>
    </motion.div>
  );
};

export default SignIn;
