import { WalletContext } from '@/context/wallet';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { ReactElement, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const BlockOperatorGuard = ({ children }: { children: ReactElement}) => {
  const { address } = useParams();
  const navigate = useNavigate();
  const { currentAddress } = useContext(WalletContext);

  return <>
    <Dialog open={address === currentAddress} maxWidth={'sm'} fullWidth>
      <DialogTitle>Invalid Operator</DialogTitle>
      <DialogContent>
        <Alert variant='outlined' severity='error' sx={{ marginBottom: '16px' }}>
          Chosen Operator is invalid. It is not allowed to use inference with the same wallet as the registered Operator.<br></br>
          Please Choose another wallet or Operator and try again.
        </Alert>
      </DialogContent>
      <DialogActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant='contained' onClick={() => navigate(-1)}>
          Back
        </Button>
      </DialogActions>
    </Dialog>
    {address !== currentAddress && children}
  </>;
};

export default BlockOperatorGuard;