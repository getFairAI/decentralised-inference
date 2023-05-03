import {
  DEFAULT_TAGS,
  OPERATOR_REGISTRATION_AR_FEE,
  REGISTER_OPERATION,
  TAG_NAMES,
} from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { QUERY_FIRST_REGISTRATION } from '@/queries/graphql';
import { useQuery } from '@apollo/client';
import {
  Box,
  Button,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createAvatar } from '@dicebear/core';
import { bottts } from '@dicebear/collection';
import HistoryTable from '@/components/history-table';
import { findTag } from '@/utils/common';
import Vote from '@/components/vote';

const OperatorDetails = () => {
  const { address } = useParams();
  const { state }: { state: { operatorName: string } } = useLocation();
  const navigate = useNavigate();
  const [firstRegistrationDate, setFirstregistrationDate] = useState('');
  const [ txid, setTxid ] = useState('');
  const theme = useTheme();

  const { data: firstRegistrationData } = useQuery(QUERY_FIRST_REGISTRATION, {
    variables: {
      owner: address,
      tags: [...DEFAULT_TAGS, { name: TAG_NAMES.operationName, values: REGISTER_OPERATION }],
    },
  });

  const handleClose = () => navigate('/');

  const imgUrl = useMemo(() => {
    const avatar = createAvatar(bottts, {
      seed: address,
      scale: 62,
    });

    const img = avatar.toString();
    const svg = new Blob([img], { type: 'image/svg+xml' });
    return URL.createObjectURL(svg);
  }, [address]);

  useEffect(() => {
    const registration = firstRegistrationData?.transactions?.edges[0] as IEdge;
    if (registration) {
      // check fee
      if (parseInt(registration.node.quantity.ar) !== parseInt(OPERATOR_REGISTRATION_AR_FEE)) {
        // incorrect, fetch next
      } else {
        const timestamp =
          parseInt(findTag(registration, 'unixTime') || '') || registration.node.block.timestamp;
        setFirstregistrationDate(new Date(timestamp * 1000).toLocaleDateString());
        setTxid(registration.node.id);
      }
    }
  }, firstRegistrationData);

  return (
    <>
      <Dialog
        open={true}
        maxWidth={'xl'}
        fullWidth
        sx={{
          '& .MuiPaper-root': {
            background:
              theme.palette.mode === 'dark'
                ? theme.palette.neutral.main
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
          <Typography>Operator Details</Typography>
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
        <DialogContent sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box display={'flex'}>
            <CardMedia image={imgUrl} sx={{ borderRadius: 8, width: 84, height: 84 }} />
            <Box>
              <Typography>{state.operatorName}</Typography>
              <Typography>{address}</Typography>
              { address && txid &&  <Vote voteFor='operator' owner={address} fee={parseFloat(OPERATOR_REGISTRATION_AR_FEE)} txid={txid} /> }
            </Box>
          </Box>
          <Box display={'flex'} flexDirection='column'>
            <Typography>Date Registered</Typography>
            <Typography>{firstRegistrationDate}</Typography>
          </Box>
        </DialogContent>
        <DialogContent>
          <HistoryTable address={address} />
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: 'center',
          }}
        >
          <Button variant='outlined' onClick={() => navigate(-1)}>
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: '15px',
                lineHeight: '20px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              Go Back
            </Typography>
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OperatorDetails;
