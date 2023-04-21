import {
  Alert,
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
  Typography,
} from '@mui/material';
import { ChangeEvent, Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import { NODE1_BUNDLR_URL, NODE2_BUNDLR_URL } from '@/constants';
import { BundlrContext, bundlrNodeUrl } from '@/context/bundlr';
import { useSnackbar } from 'notistack';
import { WalletContext } from '@/context/wallet';
import arweave from '@/utils/arweave';
import { NumericFormat } from 'react-number-format';

type FundFinishedFn = (node: string) => Promise<void>;

const FundDialog = ({
  open,
  setOpen,
  handleFundFinished,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleFundFinished?: FundFinishedFn;
}) => {
  const [node, setNode] = useState<bundlrNodeUrl>(NODE1_BUNDLR_URL);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { nodeBalance, fundNode, updateBalance, changeNode } = useContext(BundlrContext);
  const { currentBalance: walletBalance, updateBalance: updateWalletBalance } =
    useContext(WalletContext);

  const handleChange = async (event: SelectChangeEvent) => {
    setNode(event.target.value as bundlrNodeUrl);
    await changeNode(event.target.value as bundlrNodeUrl);
  };

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAmount(+event.target.value);
  };

  const asyncGetNodeBalance = async () => {
    await updateBalance();
  };

  useEffect(() => {
    if (open) {
      asyncGetNodeBalance();
    }
  }, [node, open]); // run when node changes

  useEffect(() => {
    const asyncgetWalletBalance = async () => {
      await updateWalletBalance();
    };
    if (open) {
      asyncgetWalletBalance();
    }
  }, [open]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleFund = async () => {
    setLoading(true);
    // const bn = new BigNumber(amount);
    const winstonAmount = arweave.ar.arToWinston(amount.toString());
    try {
      const res = await fundNode(winstonAmount);
      await updateBalance();
      setAmount(0);
      enqueueSnackbar(
        <>
          Funded Bundlr with {arweave.ar.winstonToAr(res.quantity)} AR.
          <br></br>
          <a href={`https://viewblock.io/arweave/tx/${res.id}`} target={'_blank'} rel='noreferrer'>
            <u>View Transaction in Explorer</u>
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
  };

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
          >Fund Bundlr Node
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert variant='outlined' severity='info' sx={{ marginBottom: '16px' }}>
            <Typography>
              Funding a Node Bundlr can take up to 40 minutes. Current Pending transactions will not
              be reflected on the node balance until they are confirmed.
              <br />
              You can view Bundlr Node transactions at:
              <br />
              <a
                href='https://viewblock.io/arweave/address/OXcT1sVRSA5eGwt2k6Yuz8-3e3g9WJi5uSE99CWqsBs'
                target='_blank'
                rel='noopener noreferrer'
              >
                <u>
                  https://viewblock.io/arweave/address/OXcT1sVRSA5eGwt2k6Yuz8-3e3g9WJi5uSE99CWqsBs
                </u>
              </a>
            </Typography>
          </Alert>
          <Box
            display={'flex'}
            flexDirection={'column'}
            justifyContent={'space-evenly'}
            marginBottom={'8px'}
          >
            <FormControl fullWidth margin='dense'>
              <InputLabel id='select-label'>Bundlr Node</InputLabel>
              <Select
                labelId='select-label'
                value={node}
                onChange={handleChange}
                label={'Bundlr Node'}
                disabled
              >
                {/* <MenuItem value={DEV_BUNDLR_URL}>dev.bundlr.network</MenuItem> */}
                <MenuItem value={NODE1_BUNDLR_URL}>node1.bundlr.network</MenuItem>
                <MenuItem value={NODE2_BUNDLR_URL}>node2.bundlr.network</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label='Current Node Balance'
              value={arweave.ar.winstonToAr(nodeBalance.toString())}
              disabled
              margin='dense'
              InputProps={{
                endAdornment: (
                  <InputAdornment position='start'>
                    <IconButton onClick={asyncGetNodeBalance}>
                      <RefreshIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <NumericFormat
              value={amount}
              onChange={handleAmountChange}
              customInput={TextField}
              helperText={
                <Typography sx={{ cursor: 'pointer' }} variant='caption'>
                  <u>Max: {walletBalance.toFixed(4)}</u>
                </Typography>
              }
              FormHelperTextProps={{
                onClick: () => setAmount(walletBalance),
              }}
              allowNegative={false}
              isAllowed={(val) => !val.floatValue || val?.floatValue < walletBalance}
              margin='dense'
              decimalScale={4}
              decimalSeparator={'.'}
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
            {handleFundFinished && (
              <Button
                onClick={() => handleFundFinished(node)}
                variant='contained'
                disabled={nodeBalance <= 0}
              >
                Continue
              </Button>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FundDialog;
