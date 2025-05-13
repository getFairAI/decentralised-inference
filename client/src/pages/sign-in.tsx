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
import {
  Box,
  Button,
  Container,
  FormHelperTextProps,
  IconButton,
  Slider,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ChangeEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import { useLocation, useNavigate } from 'react-router-dom';
import { EVMWalletContext } from '@/context/evm-wallet';
import { StyledMuiButton } from '@/styles/components';
import { motion } from 'framer-motion';
import { MobileView, BrowserView } from 'react-device-detect';
import OnboadingPage from './onboarding-page';
import redstone from 'redstone-api';

// icons
import { ContentCopyRounded, InfoOutlined } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { ThrowawayContext } from '@/context/throwaway';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import { enqueueSnackbar } from 'notistack';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import SettingsIcon from '@mui/icons-material/Settings';
import { allowUsdc, sendEth } from '@fairai/evm-sdk';

const MIN_ETH_IN_USDC = 0.01; // 0.1 USD
const MIN_USDC = 1;

const justifyContent = 'space-between';
const maxPercentage = 100;
const marks = [
  {
    value: 0,
    label: '0%',
  },
  {
    value: 25,
    label: '25%',
  },
  {
    value: 50,
    label: '50%',
  },
  {
    value: 75,
    label: '75%',
  },
  {
    value: maxPercentage,
    label: '100%',
  },
];

const valueLabelFormat = (val: number) => `${val}%`;

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
            src='./logo_non_capitalized_black_transp.svg'
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
  const { state, pathname } = useLocation();
  const { ethBalance, usdcBalance } = useContext(EVMWalletContext);
  const {
    throwawayBalance,
    throwawayAddr,
    throwawayUsdcAllowance,
    updateAllowance,
    updateBalance,
  } = useContext(ThrowawayContext);
  const [fundAmount, setFundAmount] = useState(0);
  const [fundAmountInUsdc, setFundAmountInUsdc] = useState(0);
  const [allowAmount, setAllowAmount] = useState(0);
  const [adjustAllowance, setAdjustAllowance] = useState(false);
  const [adjustPayerBalance, setAdjustPayerBalance] = useState(false);
  const [ethBalanceInUsd, setEthBalanceInUsd] = useState(0);
  const [throwawayBalanceInUsd, setThrowawayBalanceInUsd] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(throwawayAddr);
    enqueueSnackbar('Copied to clipboard', { variant: 'success' });
  }, [throwawayAddr, enqueueSnackbar]);

  const handleNext = useCallback(
    () => setActiveStep((prevActiveStep) => prevActiveStep + 1),
    [setActiveStep],
  );

  const handleBack = useCallback(
    () => setActiveStep((prevActiveStep) => prevActiveStep - 1),
    [setActiveStep],
  );

  const handleAdjustShow = useCallback(
    () => setAdjustAllowance((prev) => !prev),
    [setAdjustAllowance],
  );
  const handleAdjustPayerBalanceShow = useCallback(
    () => setAdjustPayerBalance((prev) => !prev),
    [setAdjustPayerBalance],
  );
  const handleChangeFundAmount = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.value === '') {
        setFundAmount(0);
      } else {
        setFundAmount(Number(event.target.value));
      }
    },
    [setFundAmount],
  );
  const handleSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      // calculate value (slider is percentage)
      setSliderValue(newValue as number);
      const value = (usdcBalance * (newValue as number)) / maxPercentage;
      setAllowAmount(value);
    },
    [usdcBalance, setAllowAmount, maxPercentage],
  );
  const handleAllowChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.value === '') {
        setAllowAmount(0);
        setSliderValue(0);
      } else {
        const percentage = (Number(event.target.value) / usdcBalance) * maxPercentage;
        setSliderValue(Number(percentage.toFixed(0)));
        setAllowAmount(Number(event.target.value));
      }
    },
    [setAllowAmount, setSliderValue, usdcBalance],
  );

  /* const handleChangeAllowAmount = useCallback((event: ChangeEvent<HTMLInputElement>) => setAllowAmount(Number(event.target.value)), [setAllowAmount]); */
  const handleMaxClick = useCallback(() => setFundAmount(ethBalance), [setFundAmount, ethBalance]);

  const handleFinish = useCallback(() => {
    if (state?.previousPath) {
      navigate(state.previousPath, { state });
    } else {
      navigate('/');
    }
  }, [state, navigate]);

  const changeAllowance = useCallback(async () => {
    const hash = await allowUsdc(throwawayAddr as `0x${string}`, allowAmount);
    if (hash) {
      enqueueSnackbar('Allowance updated', { variant: 'success' });
    } else {
      enqueueSnackbar('Allowance update failed', { variant: 'error' });
    }
    updateAllowance(allowAmount);
  }, [allowAmount, throwawayAddr, allowUsdc, updateAllowance, enqueueSnackbar]);

  const fund = useCallback(async () => {
    const hash = await sendEth(throwawayAddr as `0x${string}`, fundAmount);
    if (hash) {
      enqueueSnackbar('Funds Transfered', { variant: 'success' });
      updateBalance(throwawayBalance + fundAmount);
      setFundAmount(0);
    } else {
      enqueueSnackbar('Fund Transfer Failed', { variant: 'error' });
    }
    updateAllowance(allowAmount);
  }, [fundAmount, throwawayBalance, throwawayAddr, sendEth, updateBalance, enqueueSnackbar]);

  useEffect(() => {
    // convert eth to dollars
    (async () => {
      const { value: ethAvgPrice } = await redstone.getPrice('ETH');
      setFundAmountInUsdc(ethAvgPrice * fundAmount);
    })();
  }, [fundAmount, setFundAmountInUsdc]);

  useEffect(() => {
    // convert eth to dollars
    (async () => {
      const { value: ethAvgPrice } = await redstone.getPrice('ETH');
      setThrowawayBalanceInUsd(ethAvgPrice * throwawayBalance);
    })();
  }, [throwawayBalance, setThrowawayBalanceInUsd]);

  useEffect(() => {
    // convert eth to dollars
    (async () => {
      const { value: ethAvgPrice } = await redstone.getPrice('ETH');
      setEthBalanceInUsd(ethAvgPrice * ethBalance);
    })();
  }, [ethBalance, setEthBalanceInUsd]);

  useEffect(() => {
    const percentage = (throwawayUsdcAllowance / usdcBalance) * maxPercentage;
    setSliderValue(Number(percentage.toFixed(0)));
    setAllowAmount(throwawayUsdcAllowance);
  }, [throwawayUsdcAllowance, setSliderValue, setAllowAmount]);

  useEffect(() => {
    if (pathname.includes('swap')) {
      setActiveStep(3);
    } else {
      setActiveStep(0);
    }
  }, [pathname]);

  return (
    <motion.div
      initial={{ y: '-40px', opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0, duration: 0.6 } }}
      className='w-full flex flex-col items-center justify-start px-4 mt-20'
    >
      <Stepper
        activeStep={activeStep}
        orientation='vertical'
        sx={{ width: '60%', ml: '50%', /*  */ mr: '50%', height: '100%' }}
      >
        <Step>
          <StepLabel>
            <Typography fontWeight={'700'}>Generate &apos;Payer&apos; Wallet</Typography>
          </StepLabel>
          <StepContent sx={{ width: '100%' }}>
            <Typography mt={'16px'}>
              To create a better experience for you, we will create a temporary wallet. This wallet
              will be used to pay for transactions on your behalf.
              <br />
              The wallet will remain on your device, and will be stored encrypted on arweave as a
              fallback.
            </Typography>
            <Typography display={'flex'} alignItems={'center'} gap={'4px'}>
              <ErrorRoundedIcon fontSize='small' sx={{ mt: '10.5px', mb: '10.5px' }} />
              <strong>We do not recommend you use this wallet for anything else.</strong>
            </Typography>
            <Box display={'flex'} width={'100%'} gap={'16px'} mt={'16px'}>
              <TextField
                label='Payer Wallet Address'
                placeholder='Payer Wallet Address'
                value={throwawayAddr}
                variant='outlined'
                disabled={true}
                sx={{
                  width: '85%',
                  '& .MuiInputBase-root': {
                    background: 'transparent',
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={handleCopy}>
                      <ContentCopyRounded width='20px' height='20px' />
                    </IconButton>
                  ),
                }}
              />
              <Tooltip title='Generate new Wallet'>
                <IconButton size='large' sx={{ mt: '14px', p: 0 }} disabled={!!throwawayAddr}>
                  <AddCircleRoundedIcon fontSize='inherit' />
                </IconButton>
              </Tooltip>
            </Box>
            <Box display={'flex'} justifyContent={'flex-end'} mt={'48px'}>
              <Button
                sx={{ mt: 1, mr: 1 }}
                variant='contained'
                onClick={handleNext}
                className='plausible-event-name=Onboarding+Step1+Next+Click'
                disabled={!throwawayAddr}
              >
                Next
              </Button>
            </Box>
          </StepContent>
        </Step>
        <Step sx={{ width: '100%' }}>
          <StepLabel optional={<Typography variant='caption'>Optional</Typography>}>
            <Typography fontWeight={'700'}>Top Up ETH Balance</Typography>
          </StepLabel>
          <StepContent sx={{ width: '100%' }}>
            <Typography mt={'16px'}>
              Our marketplace payments use the <strong>Arbitrum Network.</strong> To pay for
              transactions, you will need some residual ETH in the &apos;Payer&apos; Wallet.
              <br />
              In order to top up the balance of the &apos;Payer&apos; Wallet, you will need to have
              ETH. Alternatively, you can fund the wallet directly.
            </Typography>
            <Box display={'flex'} width={'100%'} mt={'16px'} gap={'16px'} alignItems={'flex-start'}>
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
                  '& .MuiInputBase-root': {
                    background: 'transparent',
                  },
                }}
                InputProps={{
                  endAdornment: <Typography>${ethBalanceInUsd.toFixed(4)}</Typography>,
                }}
                FormHelperTextProps={{ component: 'div' } as Partial<FormHelperTextProps>}
                helperText={
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
                }
              />
              {ethBalanceInUsd < MIN_ETH_IN_USDC && (
                <Tooltip title={'Low Balance'}>
                  <IconButton size='large' sx={{ mt: '14px', mb: '14px', p: 0 }}>
                    <ErrorRoundedIcon fontSize='inherit' />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box display={'flex'} justifyContent={'space-between'} mt={'48px'}>
              <Button
                sx={{ mt: 1, mr: 1 }}
                onClick={handleBack}
                variant='text'
                className='plausible-event-name=Onboarding+Step2+Back+Click'
              >
                Back
              </Button>
              <Box display={'flex'} gap={'8px'}>
                <Button
                  sx={{ mt: 1, mr: 1 }}
                  onClick={handleNext}
                  variant='outlined'
                  className='plausible-event-name=Onboarding+Step2+Skip+Click'
                >
                  Skip
                </Button>
                <Button
                  disabled={ethBalanceInUsd < MIN_ETH_IN_USDC}
                  variant='contained'
                  onClick={handleNext}
                  sx={{ mt: 1, mr: 1 }}
                  className='plausible-event-name=Onboarding+Step2+Next+Click'
                >
                  Next
                </Button>
              </Box>
            </Box>
          </StepContent>
        </Step>
        <Step>
          <StepLabel>
            <Typography fontWeight={'700'}>Top Up Background Wallet Eth Balance</Typography>
          </StepLabel>
          <StepContent sx={{ width: '100%' }}>
            <Typography mt={'16px'}>
              The &apos;Payer&apos; Wallet will need some residual ETH to pay for network fees on
              your behalf.
              <br />A typical Transaction in our marketplace costs <strong>
                less than $0.01
              </strong>{' '}
              of network fees. We will ask you to top up the balance of the &apos;Payer&apos; Wallet
              with at least $0.10 worth of ETH in the <strong>Arbitrum Network</strong>.
              <br />
              In this step you can send ETH from your connected wallet to the &apos;Payer&apos;
              Wallet. <strong>Alternatively,</strong> you can fund the &apos;Payer&apos; Wallet
              directly. You can find the address in the first step.
            </Typography>
            <Typography display={'flex'} alignItems={'center'} gap={'4px'} mt={'16px'}>
              <ErrorRoundedIcon fontSize='small' sx={{ mt: '10.5px', mb: '10.5px' }} />
              <strong>
                Do not send large amounts in this wallet. We can not recover funds from it in case
                of loss!
              </strong>
            </Typography>
            <Box display={'flex'} width={'100%'} gap={'16px'} mt={'16px'}>
              <NumericFormat
                label='Payer Wallet Eth Balance'
                placeholder='Payer Wallet Eth Balance'
                value={throwawayBalance}
                thousandSeparator={true}
                customInput={TextField}
                variant='outlined'
                allowNegative={false}
                disabled={true}
                sx={{
                  width: '85%',
                  '& .MuiInputBase-root': {
                    background: 'transparent',
                  },
                }}
                InputProps={{
                  endAdornment: <Typography>${throwawayBalanceInUsd.toFixed(4)}</Typography>,
                }}
                FormHelperTextProps={{ component: 'div' } as Partial<FormHelperTextProps>}
              />
              <Tooltip title={'Deposit ETH'}>
                <IconButton
                  size='large'
                  sx={{ mt: '10.5px', mb: '10.5px', p: 0 }}
                  onClick={handleAdjustPayerBalanceShow}
                >
                  <ArrowCircleDownIcon fontSize='inherit' />
                </IconButton>
              </Tooltip>
            </Box>
            {adjustPayerBalance && (
              <Box mt={'16px'} display={'flex'} alignItems={'flex-start'} gap={'32px'}>
                <NumericFormat
                  label='Amount to Fund (ETH)'
                  placeholder='Amount to Fund'
                  value={fundAmount}
                  onChange={handleChangeFundAmount}
                  customInput={TextField}
                  allowNegative={false}
                  margin='normal'
                  decimalScale={5}
                  sx={{
                    padding: 0,
                    '& .MuiInputBase-root': {
                      background: 'transparent',
                    },
                  }}
                  InputProps={{
                    endAdornment: <Typography>${fundAmountInUsdc.toFixed(4)}</Typography>,
                  }}
                  helperText={
                    <Typography sx={{ cursor: 'pointer' }} variant='caption'>
                      <u>Max: {ethBalance}</u>
                    </Typography>
                  }
                  FormHelperTextProps={{
                    onClick: handleMaxClick,
                  }}
                />
                <Button
                  variant='contained'
                  sx={{ p: '15px 14px', mt: '16px' }}
                  onClick={fund}
                  disabled={fundAmount <= 0}
                  className='plausible-event-name=Onboarding+Fund+Wallet+Click'
                >
                  Fund Wallet
                </Button>
              </Box>
            )}
            <Box display={'flex'} justifyContent={justifyContent} mt={'48px'}>
              <Button
                sx={{ mt: 1, mr: 1 }}
                onClick={handleBack}
                variant='text'
                className='plausible-event-name=Onboarding+Step3+Back+Click'
              >
                Back
              </Button>
              <Button
                sx={{ mt: 1, mr: 1 }}
                variant='contained'
                disabled={throwawayBalanceInUsd < MIN_ETH_IN_USDC}
                onClick={handleNext}
                className='plausible-event-name=Onboarding+Step3+Next+Click'
              >
                Next
              </Button>
            </Box>
          </StepContent>
        </Step>
        <Step>
          <StepLabel>
            <Typography fontWeight={'700'}>Top Up USDC Balance</Typography>
          </StepLabel>
          <StepContent sx={{ width: '100%' }}>
            <Typography mt={'16px'}>
              Hardware providers in our marketplace set their costs and receive payments in USDC, on
              the <strong>Arbitrum Network</strong>.
              <br />
              To ensure a good experince you need to have at least <strong>1 USDC</strong> in your
              wallet.
            </Typography>
            <Box display={'flex'} width={'100%'} gap={'16px'} mt={'16px'} alignItems={'flex-start'}>
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
                  '& .MuiInputBase-root': {
                    background: 'transparent',
                  },
                }}
                InputProps={{
                  endAdornment: <img width='20px' height='20px' src={'./usdc-logo.svg'} />,
                }}
                FormHelperTextProps={{ component: 'div' } as Partial<FormHelperTextProps>}
                helperText={
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
                }
              />
              {usdcBalance < 1 && (
                <Tooltip title={'Low Balance'}>
                  <IconButton size='large' sx={{ mt: '14px', mb: '14px', p: 0 }}>
                    <ErrorRoundedIcon fontSize='inherit' />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box display={'flex'} justifyContent={justifyContent} mt={'48px'}>
              <Button
                sx={{ mt: 1, mr: 1 }}
                onClick={handleBack}
                variant='text'
                className='plausible-event-name=Onboarding+Step4+Back+Click'
              >
                Back
              </Button>
              <Button
                sx={{ mt: 1, mr: 1 }}
                variant='contained'
                disabled={usdcBalance < MIN_USDC}
                onClick={handleNext}
                className='plausible-event-name=Onboarding+Step4+Next+Click'
              >
                Next
              </Button>
            </Box>
          </StepContent>
        </Step>
        <Step>
          <StepLabel>
            <Typography fontWeight={'700'}>Allow USDC Balance</Typography>
          </StepLabel>
          <StepContent sx={{ width: '100%' }}>
            <Typography mt={'16px'}>
              For the best user experience, you need to allow the &apos;Payer&apos; Wallet to spend
              USDC on your behalf.
              <br />
              This will allow the wallet to pay for transactions on your behalf without requiring
              you to sign each transaction.
              <br />
              To Modify the Allowance, click on the gear button and adjust the slider below.
            </Typography>
            <Typography display={'flex'} alignItems={'center'} gap={'4px'} mt={'16px'}>
              <ErrorRoundedIcon fontSize='small' sx={{ mt: '10.5px', mb: '10.5px' }} />
              <strong>
                We recommend you only allow small amounts at a time. You can increase or decrease
                this Allowance anytime.
              </strong>
            </Typography>
            <Box display={'flex'} width={'100%'} gap={'16px'} mt={'16px'} alignItems={'flex-start'}>
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
                  '& .MuiInputBase-root': {
                    background: 'transparent',
                  },
                }}
                InputProps={{
                  endAdornment: <img width='20px' height='20px' src={'./usdc-logo.svg'} />,
                }}
                FormHelperTextProps={{ component: 'div' } as Partial<FormHelperTextProps>}
              />
            </Box>
            <Box display={'flex'} width={'100%'} gap={'16px'} mt={'16px'}>
              <NumericFormat
                label='Current USDC Allowance'
                placeholder='Current USDC Allowance'
                value={throwawayUsdcAllowance}
                thousandSeparator={true}
                customInput={TextField}
                variant='outlined'
                allowNegative={false}
                disabled={true}
                sx={{
                  width: '85%',
                  '& .MuiInputBase-root': {
                    background: 'transparent',
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <img width='20px' height='20px' src={'./usdc-logo.svg'} alt='usdc logo' />
                  ),
                }}
              />
              <Tooltip title={'Modify Allowance'}>
                <IconButton
                  size='large'
                  sx={{ mt: '10.5px', mb: '10.5px', p: 0 }}
                  onClick={handleAdjustShow}
                >
                  <SettingsIcon fontSize='inherit' />
                </IconButton>
              </Tooltip>
            </Box>
            {adjustAllowance && (
              <Box display={'flex'} gap={'24px'} alignItems={'center'} mt={'16px'}>
                <Slider
                  marks={marks}
                  value={sliderValue}
                  onChange={handleSliderChange}
                  step={1}
                  min={0}
                  getAriaValueText={valueLabelFormat}
                  valueLabelFormat={valueLabelFormat}
                  valueLabelDisplay='auto'
                />
                <NumericFormat
                  label='Quantity'
                  placeholder='Quantity'
                  onChange={handleAllowChange}
                  value={allowAmount}
                  customInput={TextField}
                  allowNegative={false}
                  margin='dense'
                  decimalScale={4}
                  sx={{
                    '& .MuiInputBase-root': {
                      background: 'transparent',
                    },
                  }}
                />
              </Box>
            )}
            <Box display={'flex'} justifyContent={justifyContent} mt={'48px'}>
              <Button
                sx={{ mt: 1, mr: 1 }}
                onClick={handleBack}
                variant='text'
                className='plausible-event-name=Onboarding+Step5+Back+Click'
              >
                Back
              </Button>
              <Box>
                <Button
                  sx={{ mt: 1, mr: 1 }}
                  disabled={allowAmount === throwawayUsdcAllowance}
                  variant='outlined'
                  onClick={changeAllowance}
                  className='plausible-event-name=Onboarding+Save+Allowance+Click'
                >
                  Save Allowance
                </Button>
                <Button
                  sx={{ mt: 1, mr: 1 }}
                  variant='contained'
                  disabled={throwawayUsdcAllowance < 1}
                  onClick={handleFinish}
                  className='plausible-event-name=Onboarding+Explore+Marketplace+Click'
                >
                  Explore marketplace
                </Button>
              </Box>
            </Box>
          </StepContent>
        </Step>
      </Stepper>
    </motion.div>
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
          height: '100vh',
          paddingBottom: '100px',
          overflowY: 'auto',
          position: 'absolute',
          background: 'linear-gradient(220deg, #9fd6d6, #ffffff)',
          top: 0,
          left: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent:
            isConnected && (usdcBalance < MIN_U_BALANCE || isSwap) ? 'center' : 'flex-start',
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
        {!isConnected && (
          <>
            <div className='mt-20'>
              <OnboadingPage />
            </div>
            <div className='w-100 flex justify-center mt-24 mb-5'>
              {providers.length > 0 && (
                <StyledMuiButton
                  onClick={handleClick}
                  className='plausible-event-name=Onboarding+Connect+Wallet+Click primary bigger gradient-bg'
                >
                  <img src='./arbitrum-logo.svg' style={{ width: '24px' }} alt='arbitrum logo' />
                  Connect or get your wallet to the Arbitrum Network
                  <PlayArrowRoundedIcon />
                </StyledMuiButton>
              )}
            </div>
          </>
        )}
      </Container>
    </motion.div>
  );
};

export default SignIn;
