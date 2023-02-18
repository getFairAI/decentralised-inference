import { Box, Button, Dialog, DialogContent, DialogTitle, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import { WebBundlr } from "bundlr-custom";
import { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from "react";
import LoadingButton from '@mui/lab/LoadingButton';
import useArweave from "@/context/arweave";
import BigNumber from "bignumber.js";
import RefreshIcon from '@mui/icons-material/Refresh';

const FundDialog = ({ open, setOpen, handleFundFinished}: {open: boolean, setOpen: Dispatch<SetStateAction<boolean>>,handleFundFinished: Function }) => {
  const [ node, setNode ] = useState('https://node1.bundlr.network');
  const [ amount, setAmount ] = useState(0);
  const [ balance, setBalance ] = useState(0);
  const [ loading, setLoading ] = useState(false);
  const [ walletBalance, setWalletBalance] = useState(0);
  const { getWalletBalance } = useArweave();

  const handleChange = (event: SelectChangeEvent) => {
    setNode(event.target.value);
  }

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAmount(+event.target.value);
  }

  const updatebalanceEffect = () => {
    const updateBalance = async () => {
      console.log('riunn')
      const bundlr = new WebBundlr(node, 'arweave', window.arweaveWallet);
      await bundlr.ready();
      console.log(bundlr, 'running')
       // Get loaded balance in atomic units
      let atomicBalance = await bundlr.getLoadedBalance();

      // Convert balance to an easier to read format
      let convertedBalance = bundlr.utils.unitConverter(atomicBalance!);
      setBalance(convertedBalance.toNumber());
    }
    if (open) {
      updateBalance();
    }
  };

  useEffect(updatebalanceEffect, [ node, open ]); // run when node changes

  useEffect(() => {
    const asyncgetWalletBalance = async () => {
      setWalletBalance(+await getWalletBalance())
    }
    if (open) {
      asyncgetWalletBalance();
    }
  }, [ open ])

  const handleClick = () => {
    handleFundFinished(node);
  }

  const handleClose = () => {
    setOpen(false);
  }

  const handleFund = async () => {
    const bundlr = new WebBundlr(node, 'arweave', window.arweaveWallet);
    await bundlr.ready();
    const fundAmountParsed = new BigNumber(amount).multipliedBy(
      bundlr.currencyConfig.base[1],
    );
    setLoading(true);
    try {
      const res = await bundlr.fund(fundAmountParsed);
      let atomicBalance = await bundlr.getLoadedBalance();

      // Convert balance to an easier to read format
      let convertedBalance = bundlr.utils.unitConverter(atomicBalance!);
      setBalance(convertedBalance.toNumber());
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
    
  }

  return (<>
    <Dialog open={open} maxWidth={'sm'} fullWidth onClose={handleClose}>
      <DialogTitle>Fund Bundlr Node</DialogTitle>
      <DialogContent>
        <Box display={'flex'} flexDirection={'column'} justifyContent={'space-evenly'} marginBottom={'8px'}>
          <FormControl fullWidth margin='dense'>
            <InputLabel id="select-label">Bundlr Node</InputLabel>
            <Select
              labelId="select-label"
              value={node}
              label="Age"
              onChange={handleChange}
            >
              <MenuItem value={'https://node1.bundlr.network'}>node1.bundlr.network</MenuItem>
              <MenuItem value={'https://node2.bundlr.network'}>node2.bundlr.network</MenuItem>
            </Select>
          </FormControl>
          <TextField label='Current Node Balance' value={balance}  disabled  margin='dense' InputProps={{
            endAdornment: <InputAdornment position="start"><IconButton><RefreshIcon /></IconButton></InputAdornment>
          }}/>
          <TextField type='number' label='Amount to Fund' value={amount} onChange={handleAmountChange} helperText={`Max: ${walletBalance}`} InputProps={{ inputProps: { min: 0, max: walletBalance } }} margin='dense'/>
        </Box>
        <Box>
          <LoadingButton
            loading={loading}
            variant="outlined"
            onClick={handleFund}
            disabled={amount <= 0 || amount >= walletBalance}
          >
            Fund
          </LoadingButton>
          <Button onClick={handleClick} variant='contained' disabled={balance <= 0}>Continue</Button>
        </Box>
      </DialogContent>
    </Dialog>
  </>)
}

export default FundDialog;