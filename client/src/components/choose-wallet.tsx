import { WalletContext } from '@/context/wallet';
import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  useTheme,
} from '@mui/material';
import { Dispatch, SetStateAction, useCallback, useContext, useEffect, useRef } from 'react';
import PowerIcon from '@mui/icons-material/Power';

const ChooseWallet = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  // components/layout.js
  const theme = useTheme();
  const { isArConnectAvailable, connectWallet } = useContext(WalletContext);

  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  const handleArConnect = useCallback(() => connectWallet('arconnect'), [connectWallet]);
  const handleArweaveApp = useCallback(() => connectWallet('arweave.app'), [connectWallet]);

  const prevWalletValue = useRef<string | null>(localStorage.getItem('wallet'));

  useEffect(() => {
    if (prevWalletValue.current !== localStorage.getItem('wallet')) {
      prevWalletValue.current = localStorage.getItem('wallet');
      setOpen(false);
    }
  }, [localStorage.length]); // run this code when the value of count changes

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
      <DialogTitle>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '23px',
            lineHeight: '31px',
          }}
        >
          {'Connect Wallet'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <List>
          <ListItem
            secondaryAction={
              <Button
                aria-label='connect'
                variant='contained'
                onClick={handleArConnect}
                disabled={!isArConnectAvailable || localStorage.getItem('wallet') === 'arconnect'}
                endIcon={<PowerIcon />}
              >
                <Typography>Connect</Typography>
              </Button>
            }
          >
            <ListItemAvatar>
              <Avatar src='./arconnect-logo.png' />
            </ListItemAvatar>
            <ListItemText primary='ArConnect' />
          </ListItem>
          <ListItem
            secondaryAction={
              <Button
                aria-label='connect'
                variant='contained'
                onClick={handleArweaveApp}
                disabled={localStorage.getItem('wallet') === 'arweave.app'}
                endIcon={<PowerIcon />}
              >
                <Typography fontStyle={'bold'}>Connect</Typography>
              </Button>
            }
          >
            <ListItemAvatar>
              <Avatar src='./arweave-logo-for-light.png' />
            </ListItemAvatar>
            <ListItemText primary='Arweave.app' />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          paddingBottom: '20px',
        }}
      >
        <Button variant='outlined' onClick={handleClose} sx={{ width: 'fit-content' }}>
          <Typography>Close</Typography>
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChooseWallet;
