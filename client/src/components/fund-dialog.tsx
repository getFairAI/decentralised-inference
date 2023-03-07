import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import { WebBundlr } from 'bundlr-custom';
// import { WebBundlr } from "@bundlr-network/client";
import { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import useArweave from '@/context/arweave';
import BigNumber from 'bignumber.js';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DEV_BUNDLR_URL, NODE1_BUNDLR_URL, NODE2_BUNDLR_URL } from '@/constants';

type FundFinishedFn = (node: string) => Promise<void>;

const FundDialog = ({
  open,
  setOpen,
  handleFundFinished,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleFundFinished: FundFinishedFn;
}) => {
  const [node, setNode] = useState(NODE1_BUNDLR_URL);
  const [amount, setAmount] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const { getWalletBalance } = useArweave();

  const handleChange = (event: SelectChangeEvent) => {
    setNode(event.target.value);
  };

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAmount(+event.target.value);
  };

  const updateBalance = async () => {
    console.log('riunn');
    const bundlr = new WebBundlr(node, 'arweave', window.arweaveWallet);
    await bundlr.ready();
    console.log(bundlr, 'running');
    // Get loaded balance in atomic units
    const atomicBalance = await bundlr.getLoadedBalance();

    // Convert balance to an easier to read format
    const convertedBalance = bundlr.utils.unitConverter(atomicBalance);
    setBalance(convertedBalance.toNumber());
  };

  const updatebalanceEffect = () => {
    if (open) {
      updateBalance();
    }
  };

  useEffect(updatebalanceEffect, [node, open]); // run when node changes

  useEffect(() => {
    const asyncgetWalletBalance = async () => {
      setWalletBalance(+(await getWalletBalance()));
    };
    if (open) {
      asyncgetWalletBalance();
    }
  }, [open]);

  const handleClick = () => {
    handleFundFinished(node);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleFund = async () => {
    const bundlr = new WebBundlr(node, 'arweave', window.arweaveWallet);
    await bundlr.ready();
    setLoading(true);
    const bn = new BigNumber(amount);
    const fundAmountParsed = bn.multipliedBy(bundlr.currencyConfig.base[1]);
    try {
      await bundlr.fund(fundAmountParsed.toString());
      const atomicBalance = await bundlr.getLoadedBalance();

      // Convert balance to an easier to read format
      const convertedBalance = bundlr.utils.unitConverter(atomicBalance);
      setBalance(convertedBalance.toNumber());
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  return (
    <>
      <Dialog open={open} maxWidth={'sm'} fullWidth onClose={handleClose}>
        <DialogTitle>Fund Bundlr Node</DialogTitle>
        <DialogContent>
          <Box
            display={'flex'}
            flexDirection={'column'}
            justifyContent={'space-evenly'}
            marginBottom={'8px'}
          >
            <FormControl fullWidth margin='dense'>
              <InputLabel id='select-label'>Bundlr Node</InputLabel>
              <Select labelId='select-label' value={node} label='Age' onChange={handleChange}>
                <MenuItem value={DEV_BUNDLR_URL}>dev.bundlr.network</MenuItem>
                <MenuItem value={NODE1_BUNDLR_URL}>node1.bundlr.network</MenuItem>
                <MenuItem value={NODE2_BUNDLR_URL}>node2.bundlr.network</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label='Current Node Balance'
              value={balance}
              disabled
              margin='dense'
              InputProps={{
                endAdornment: (
                  <InputAdornment position='start'>
                    <IconButton onClick={updateBalance}>
                      <RefreshIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              type='number'
              label='Amount to Fund'
              value={amount}
              onChange={handleAmountChange}
              helperText={`Max: ${walletBalance}`}
              InputProps={{ inputProps: { min: 0, max: walletBalance } }}
              margin='dense'
            />
          </Box>
          <Box>
            <LoadingButton
              loading={loading}
              variant='outlined'
              onClick={handleFund}
              disabled={amount <= 0 || amount >= walletBalance}
            >
              Fund
            </LoadingButton>
            <Button onClick={handleClick} variant='contained' disabled={balance <= 0}>
              Continue
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FundDialog;
