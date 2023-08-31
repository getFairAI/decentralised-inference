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

import { BAZAR_ASSETS_LINK, U_CONTRACT_ID, U_LOGO_SRC } from '@/constants';
import { WalletContext } from '@/context/wallet';
import { displayShortTxOrAddr } from '@/utils/common';
import {
  allowUCMonAsset,
  checkPairExists,
  createPair,
  createSellOrder,
  getAssetAllowance,
  getAssetBalance,
  getAssetBalanceAndAllowed,
  getClaimId,
  getUserOrdersForAsset,
} from '@/utils/ucm';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Slider,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { ChangeEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { NumberFormatValues, NumericFormat } from 'react-number-format';

const maxSliderValue = 1000; // max value that slider renders without performance issues (using step 1)
const errorStr = 'An Error Occured';
const flexSpaceBetween = 'space-between';

const steps = ['Create Pair', 'Approve Spending', 'Create Sell Order'];

const CreateSellOrderStep = ({
  handleNext,
  handleBack,
  currentAllowance,
  isProcessing,
}: {
  handleNext: (quantity: number, price: number) => void;
  handleBack: () => void;
  currentAllowance: number;
  isProcessing: boolean;
}) => {
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);

  const isContinueDisabled = useMemo(
    () => isProcessing || !price || !quantity,
    [isProcessing, price, quantity],
  );

  const handleMaxClick = useCallback(() => {
    setQuantity(currentAllowance);
  }, [setQuantity, currentAllowance]);

  const isAllowed = useCallback(
    (val: NumberFormatValues) => !val.floatValue || val?.floatValue <= currentAllowance,
    [currentAllowance],
  );

  const handleQuantityChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setQuantity(+event.target.value),
    [setQuantity],
  );

  const handleSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => setQuantity(newValue as number),
    [setQuantity],
  );

  const handlePriceChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setPrice(+event.target.value),
    [setPrice],
  );

  const handleClick = useCallback(() => handleNext(quantity, price), [quantity, price, handleNext]);

  return (
    <Box display='flex' flexDirection={'column'} gap='16px'>
      <Typography>
        {
          'Please select the amount you wish to list for sale and the desired price. Note that price will refer to the chosen currency'
        }
      </Typography>
      {currentAllowance > maxSliderValue ? (
        <NumericFormat
          label='Quantity'
          placeholder='Quantity'
          value={quantity}
          onChange={handleQuantityChange}
          customInput={TextField}
          helperText={
            <Typography sx={{ cursor: 'pointer' }} variant='caption'>
              <u>Max: {currentAllowance}</u>
            </Typography>
          }
          FormHelperTextProps={{
            onClick: handleMaxClick,
          }}
          allowNegative={false}
          isAllowed={isAllowed}
          margin='dense'
          sx={{
            width: '50%',
          }}
        />
      ) : (
        <Box
          sx={{
            marginLeft: '16px',
          }}
        >
          <Typography sx={{ marginBottom: '16px' }} variant='caption'>
            Amount to Sell
          </Typography>
          <Slider
            onChange={handleSliderChange}
            disabled={false}
            marks
            max={currentAllowance}
            step={1}
            min={0}
            valueLabelDisplay='auto'
          />
        </Box>
      )}
      <NumericFormat
        label='Price'
        placeholder='Price'
        value={price}
        onChange={handlePriceChange}
        customInput={TextField}
        allowNegative={false}
        margin='dense'
        sx={{
          width: 'fit-content',
        }}
        InputProps={{
          endAdornment: <img width='28px' height='28px' src={U_LOGO_SRC} />,
        }}
      />
      <Box sx={{ mb: 2 }}>
        <div>
          <Button
            variant='contained'
            onClick={handleClick}
            sx={{ mt: 1, mr: 1 }}
            disabled={isContinueDisabled}
          >
            {'Finish'}
          </Button>
          <Button onClick={handleBack} disabled={isProcessing} sx={{ mt: 1, mr: 1 }}>
            Back
          </Button>
        </div>
      </Box>
    </Box>
  );
};

const AllowStep = ({
  handleNext,
  handleBack,
  maxBalance,
  currentAllowance,
  isProcessing,
}: {
  handleNext: (amount: number) => void;
  handleBack: () => void;
  maxBalance: number;
  currentAllowance: number;
  isProcessing: boolean;
}) => {
  const theme = useTheme();

  const [amount, setAmount] = useState(0);

  const isContinueDisabled = useMemo(
    () => isProcessing || (currentAllowance <= 0 && amount <= 0),
    [isProcessing, currentAllowance, amount],
  );

  const handleMaxClick = useCallback(() => {
    setAmount(maxBalance);
  }, [setAmount, maxBalance]);

  const isAllowed = useCallback(
    (val: NumberFormatValues) => !val.floatValue || val?.floatValue <= maxBalance,
    [maxBalance],
  );

  const handleAmountChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setAmount(+event.target.value),
    [setAmount],
  );

  const handleSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => setAmount(newValue as number),
    [setAmount],
  );

  const handleClick = useCallback(() => handleNext(amount), [amount, handleNext]);

  return (
    <Box display='flex' flexDirection={'column'} gap='16px'>
      <Typography>
        {
          'You must approve the Bazar contract to claim the desired amount you want to trade. This means that the balance you choose to approve will be locked and inaccessible after this point.'
        }
      </Typography>
      <NumericFormat
        label='Current Allowance'
        placeholder='Current Allowance'
        value={currentAllowance}
        customInput={TextField}
        disabled={true}
        allowNegative={false}
        margin='dense'
        sx={{
          width: '50%',
        }}
      />
      {maxBalance > maxSliderValue ? (
        <NumericFormat
          label='Amount to Allow'
          placeholder='Amount to Allow'
          value={amount}
          onChange={handleAmountChange}
          customInput={TextField}
          helperText={
            <Typography sx={{ cursor: 'pointer' }} variant='caption'>
              <u>Max: {maxBalance}</u>
            </Typography>
          }
          FormHelperTextProps={{
            onClick: handleMaxClick,
          }}
          allowNegative={false}
          isAllowed={isAllowed}
          margin='dense'
          decimalScale={0}
          disabled={currentAllowance > 0}
          sx={{
            width: '50%',
          }}
        />
      ) : (
        <Box
          sx={{
            marginLeft: '16px',
          }}
        >
          <Typography
            sx={{ marginBottom: '16px' }}
            variant='caption'
            color={currentAllowance > 0 ? theme.palette.text.disabled : theme.palette.text.primary}
          >
            Amount to Approve
          </Typography>
          <Slider
            onChange={handleSliderChange}
            disabled={currentAllowance > 0}
            marks
            max={maxBalance}
            step={1}
            min={0}
            valueLabelDisplay='auto'
          />
        </Box>
      )}

      <Box sx={{ mb: 2, display: 'flex', justifyContent: flexSpaceBetween }}>
        <Box>
          <Button
            variant='contained'
            onClick={handleClick}
            sx={{ mt: 1, mr: 1 }}
            disabled={isContinueDisabled}
          >
            {'Continue'}
          </Button>
          <Button onClick={handleBack} disabled={isProcessing} sx={{ mt: 1, mr: 1 }}>
            Back
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

const CreatePairStep = ({
  handleNext,
  isProcessing,
}: {
  handleNext: (token: string) => void;
  isProcessing: boolean;
}) => {
  const [token, setToken] = useState('u');

  const handleChange = useCallback(
    (event: SelectChangeEvent) => setToken(event.target.value as string),
    [setToken],
  );

  const handleClick = useCallback(() => handleNext(token), [token, handleNext]);

  return (
    <Box display='flex' flexDirection={'column'} gap='16px'>
      <Typography>
        {'Before Listing your Asset in '}
        <u>
          <a href='https://bazar.ar-io.dev' target='_blank' rel='noreferrer'>
            Bazar
          </a>
        </u>
        {' you need to choose the currency to trade your asset with.'}
      </Typography>
      <FormControl sx={{ width: 'fit-content' }}>
        <InputLabel id='demo-simple-select-label'>Buy Token</InputLabel>
        <Select
          labelId='demo-simple-select-label'
          id='demo-simple-select'
          value={token}
          label='Buy Token'
          onChange={handleChange}
          sx={{
            '& .MuiInputBase-input': {
              display: 'flex',
              gap: '24px',
              justifyContent: flexSpaceBetween,
            },
          }}
        >
          <MenuItem value={'u'} sx={{ display: 'flex', justifyContent: flexSpaceBetween }}>
            <Typography>{`$U (${displayShortTxOrAddr(U_CONTRACT_ID)})`}</Typography>
            <img width='20px' height='29px' src={U_LOGO_SRC} />
          </MenuItem>
          <MenuItem value={'other'} disabled>
            {'More coming Soon...'}
          </MenuItem>
        </Select>
      </FormControl>
      <Box sx={{ mb: 2 }}>
        <Box>
          <Button
            variant='contained'
            onClick={handleClick}
            sx={{ mt: 1, mr: 1 }}
            disabled={isProcessing}
          >
            Continue
          </Button>
          <Button disabled={true} sx={{ mt: 1, mr: 1 }}>
            Back
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

const VerticalLinearStepper = ({ assetId }: { assetId: string }) => {
  const { currentAddress } = useContext(WalletContext);

  const [activeStep, setActiveStep] = useState(0);
  const [maxBalance, setMaxBalance] = useState(0);
  const [currentAllowance, setCurrentAllowance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (assetId && currentAddress) {
      setIsProcessing(true);
      (async () => {
        try {
          setMaxBalance(await getAssetBalance(assetId, currentAddress));
          setCurrentAllowance(await getAssetAllowance(assetId, currentAddress));
        } catch (error) {
          // ignore
        }
        setIsProcessing(false);
      })();
    }
  }, [assetId, currentAddress]);

  const handleBack = useCallback(
    () => setActiveStep((prevActiveStep) => prevActiveStep - 1),
    [setActiveStep],
  );

  const handleCreatePair = useCallback(
    async (token: string) => {
      if (token === 'u') {
        try {
          setIsProcessing(true);
          if (!(await checkPairExists(assetId))) {
            await createPair(assetId);
          }
          setActiveStep((prevActiveStep) => prevActiveStep + 1);
          setIsProcessing(false);
        } catch (error) {
          setIsProcessing(false);
          enqueueSnackbar(errorStr, { variant: 'error' });
        }
      } else {
        // ignore
      }
    },
    [assetId, setActiveStep, setIsProcessing],
  );

  const handleAllow = useCallback(
    async (amount: number) => {
      try {
        if (currentAllowance > 0) {
          setActiveStep((prevActiveStep) => prevActiveStep + 1);
        } else if (amount > 0) {
          setIsProcessing(true);
          await allowUCMonAsset(assetId, amount);
          setIsProcessing(false);
          setActiveStep((prevActiveStep) => prevActiveStep + 1);
        } else {
          // ignore
          throw new Error('Please make sure to properly fill amount field');
        }
      } catch (error) {
        setIsProcessing(false);
        enqueueSnackbar(errorStr, { variant: 'error' });
      }
    },
    [assetId, currentAllowance, setActiveStep],
  );

  const handleCreateOrder = useCallback(
    async (quantity: number, price: number) => {
      try {
        if (price >= 0 && quantity >= 0 && quantity <= currentAllowance) {
          setIsProcessing(true);
          const allowTxId = await getClaimId(assetId, currentAddress, quantity);
          if (allowTxId) {
            await createSellOrder(assetId, quantity, price, allowTxId);
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
          } else {
            throw new Error('Could not find Allowed balance');
          }
          setIsProcessing(false);
        } else {
          throw new Error('Please make sure to fill price and quantity fields properly');
        }
      } catch (error) {
        setIsProcessing(false);
        enqueueSnackbar(errorStr, { variant: 'error' });
      }
    },
    [assetId, currentAddress, currentAllowance, setActiveStep],
  );

  const renderStep = useCallback(
    (index: number) => {
      const firstStep = 0;
      const secondStep = 1;
      const thirdStep = 2;

      switch (index) {
        case secondStep:
          return (
            <AllowStep
              handleNext={handleAllow}
              handleBack={handleBack}
              maxBalance={maxBalance}
              currentAllowance={currentAllowance}
              isProcessing={isProcessing}
            />
          );
        case thirdStep:
          return (
            <CreateSellOrderStep
              handleNext={handleCreateOrder}
              handleBack={handleBack}
              currentAllowance={currentAllowance}
              isProcessing={isProcessing}
            />
          );
        case firstStep:
        default:
          return <CreatePairStep handleNext={handleCreatePair} isProcessing={isProcessing} />;
      }
    },
    [
      handleAllow,
      handleCreatePair,
      handleCreateOrder,
      handleBack,
      maxBalance,
      currentAllowance,
      isProcessing,
    ],
  );

  const handleViewInBazar = useCallback(
    () => window.open(`${BAZAR_ASSETS_LINK}${assetId}`, '_blank'),
    [window, assetId],
  );

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <Stepper activeStep={activeStep} orientation='vertical'>
        {steps.map((step, index) => (
          <Step key={step}>
            <StepLabel>{step}</StepLabel>
            <StepContent>{renderStep(index)}</StepContent>
          </Step>
        ))}
      </Stepper>
      {activeStep === steps.length && (
        <Paper square elevation={0} sx={{ p: 3 }}>
          <Typography>All steps completed - you&apos;re finished</Typography>
          <Button variant='contained' onClick={handleViewInBazar}>
            Check Listing
          </Button>
        </Paper>
      )}
    </Box>
  );
};

const ContentDisplay = ({
  assetId,
  sold,
  onSale,
}: {
  assetId: string;
  sold: boolean;
  onSale: boolean;
}) => {
  const handleViewInBazar = useCallback(
    () => window.open(`${BAZAR_ASSETS_LINK}${assetId}`, '_blank'),
    [window, assetId],
  );
  if (sold) {
    return (
      <>
        <Typography>You Do not Own this Asset</Typography>
        <Button variant='contained' onClick={handleViewInBazar}>
          Buy Now
        </Button>
      </>
    );
  } else if (onSale) {
    return (
      <Box>
        <Typography>Asset Is Already listed on Bazar</Typography>
        <Button variant='contained' onClick={handleViewInBazar}>
          Check Listing
        </Button>
      </Box>
    );
  } else {
    return <VerticalLinearStepper assetId={assetId} />;
  }
};

const Trade = ({
  open,
  setOpenWithId,
  assetId,
}: {
  open: boolean;
  setOpenWithId: (assetId: string, open: boolean) => void;
  assetId: string;
}) => {
  // components/layout.js
  const theme = useTheme();
  const { currentAddress } = useContext(WalletContext);
  const [onSale, setOnSale] = useState(false);
  const [sold, setSold] = useState(false);

  const handleClose = useCallback(() => setOpenWithId('', false), [setOpenWithId]);

  useEffect(() => {
    if (currentAddress && assetId) {
      (async () => {
        const [balance, hasAllowed] = await getAssetBalanceAndAllowed(assetId, currentAddress);

        if (balance <= 0) {
          const orders = await getUserOrdersForAsset(assetId, currentAddress);

          setOnSale(orders.length > 0);
          setSold(!hasAllowed && orders.length === 0);
        } else {
          setOnSale(false);
          setSold(false);
        }
      })();
    }
  }, [assetId, currentAddress]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={'sm'}
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
      <DialogTitle
        display='flex'
        justifyContent={'space-between'}
        alignItems='center'
        lineHeight={0}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '23px',
            lineHeight: '31px',
          }}
        >
          {'Trade Asset On Bazar'}
        </Typography>
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
      <DialogContent>
        <ContentDisplay assetId={assetId} sold={sold} onSale={onSale} />
      </DialogContent>
    </Dialog>
  );
};

export default Trade;
