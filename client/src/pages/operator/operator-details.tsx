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
  DEFAULT_TAGS,
  OPERATOR_REGISTRATION_AR_FEE,
  REGISTER_OPERATION,
  TAG_NAMES,
  secondInMS,
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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createAvatar } from '@dicebear/core';
import { bottts } from '@dicebear/collection';
import HistoryTable from '@/components/history-table';
import { findTag } from '@/utils/common';
import Vote from '@/components/vote';

const OperatorDetails = () => {
  const { address } = useParams();
  const { state }: { state: { operatorName: string; scriptFee: string } } = useLocation();
  const navigate = useNavigate();
  const [firstRegistrationDate, setFirstregistrationDate] = useState('');
  const [txid, setTxid] = useState('');
  const theme = useTheme();

  const { data: firstRegistrationData } = useQuery(QUERY_FIRST_REGISTRATION, {
    variables: {
      owner: address,
      tags: [...DEFAULT_TAGS, { name: TAG_NAMES.operationName, values: REGISTER_OPERATION }],
    },
  });

  const handleClose = useCallback(() => navigate('/'), [navigate]);

  const handleBack = useCallback(() => navigate(-1), [navigate]);

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
      if (
        parseInt(registration.node.quantity.ar, 10) !== parseInt(OPERATOR_REGISTRATION_AR_FEE, 10)
      ) {
        // incorrect, fetch next
      } else {
        const timestamp =
          parseInt(findTag(registration, 'unixTime') ?? '', 10) ??
          registration.node.block.timestamp;
        setFirstregistrationDate(new Date(timestamp * secondInMS).toLocaleDateString());
        setTxid(registration.node.id);
      }
    }
  }, [firstRegistrationData]);

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
              {address && txid && (
                <Vote
                  voteFor='operator'
                  owner={address}
                  fee={parseFloat(state.scriptFee)}
                  txid={txid}
                />
              )}
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
          <Button variant='outlined' onClick={handleBack}>
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
