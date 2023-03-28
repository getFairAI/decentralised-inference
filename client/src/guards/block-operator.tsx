import { WalletContext } from '@/context/wallet';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { ReactElement, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const BlockOperatorGuard = ({ children }: { children: ReactElement }) => {
  const { address } = useParams();
  const navigate = useNavigate();
  const { currentAddress } = useContext(WalletContext);

  return (
    <>
      <Dialog open={address === currentAddress} maxWidth={'md'} fullWidth sx={{
        '& .MuiPaper-root': {
          background: 'rgba(61, 61, 61, 0.9)',
          borderRadius: '30px',
        }
      }}>
        <DialogTitle>
          <Typography sx={{
            color: '#DC5141',
            fontWeight: 700,
            fontSize: '23px',
            lineHeight: '31px'
          }}>
            Error: Use a different wallet!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert variant='outlined' severity='error'
            sx={{ marginBottom: '16px', borderRadius: '10px', color: '#DC5141', display: 'flex', flexDirection: 'column', justifyContent: 'center',
              '& .MuiAlert-icon': {
                justifyContent: 'center'
              },
              borderColor: '#DC5141'
            }}
            icon={
              <img src='/error-icon.svg'/>
            }
          >
            <Typography sx={{
              fontWeight: 400,
              fontSize: '30px',
              lineHeight: '41px',
              display: 'block',
              textAlign: 'center'
            }}>
              Chosen Operator is <u><b>invalid.</b></u> It is not allowed to use inference with the same wallet as
              the registered Operator.
              <u><b>Please Choose another wallet or Operator and try again.</b></u>
            </Typography>
            
          </Alert>
        </DialogContent>
        <DialogActions sx={{ display: 'flex', justifyContent: 'center', paddingBottom: '20px' }}>
          <Button onClick={() => navigate(-1)} sx={{
            border: '1px solid #F4F4F4',
            borderRadius: '7px',
            color: '#F4F4F4'
          }}>
            Go Back
          </Button>
        </DialogActions>
      </Dialog>
      {address !== currentAddress && children}
    </>
  );
};

export default BlockOperatorGuard;
