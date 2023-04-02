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
  CardMedia,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createAvatar } from '@dicebear/core';
import { bottts } from '@dicebear/collection';
import HistoryTable from '@/components/history-table';
import { findTag } from '@/utils/common';

const OperatorDetails = () => {
  const { address } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [firstRegistrationDate, setFirstregistrationDate] = useState('');

  const { data: firstRegistrationData } = useQuery(QUERY_FIRST_REGISTRATION, {
    variables: {
      owner: address,
      tags: [...DEFAULT_TAGS, { name: TAG_NAMES.operationName, values: REGISTER_OPERATION }],
    },
  });

  const handleClose = () => navigate(-1);

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
            background: 'rgba(61, 61, 61, 0.9)',
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
          <IconButton onClick={handleClose}>
            <img src='/close-icon.svg' />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box display={'flex'}>
            <CardMedia image={imgUrl} sx={{ borderRadius: 8, width: 62, height: 62 }} />
            <Box>
              <Typography>{state.operatorName}</Typography>
              <Typography>{address}</Typography>
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
      </Dialog>
    </>
  );
};

export default OperatorDetails;
