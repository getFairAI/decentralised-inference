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
  PROTOCOL_NAME,
  PROTOCOL_VERSION,
  TAG_NAMES,
  TERMS_AGREEMENT,
  TERMS_VERSION,
} from '@/constants';
import { WalletContext } from '@/context/wallet';
import { QUERY_TX_WITH } from '@/queries/graphql';
import arweave from '@/utils/arweave';
import { useQuery } from '@apollo/client';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
} from '@mui/material';
import { ReactElement, useCallback, useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const TermsAgreement = ({ children }: { children: ReactElement }) => {
  const { currentAddress, dispatchTx } = useContext(WalletContext);
  const theme = useTheme();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);

  const { data } = useQuery(QUERY_TX_WITH, {
    variables: {
      address: currentAddress,
      tags: [
        { name: TAG_NAMES.protocolName, values: ['Fair Protocol'] },
        { name: TAG_NAMES.operationName, values: [TERMS_AGREEMENT] },
        { name: TAG_NAMES.termsVersion, values: [TERMS_VERSION] },
      ],
    },
    skip: !currentAddress,
  });

  useEffect(() => {
    if (data?.transactions?.edges && data.transactions.edges.length > 0) {
      // Terms agreement already signed
      setShowDialog(false);
    } else if (data?.transactions?.edges && data.transactions.edges.length === 0) {
      setShowDialog(true);
    } else {
      // ignore while loading
    }
  }, [data, setShowDialog]);

  const handleAgreeClick = useCallback(async () => {
    const tags = [
      { name: TAG_NAMES.protocolName, value: PROTOCOL_NAME },
      { name: TAG_NAMES.protocolVersion, value: PROTOCOL_VERSION },
      { name: TAG_NAMES.operationName, value: TERMS_AGREEMENT },
      { name: TAG_NAMES.termsVersion, value: TERMS_VERSION },
    ];

    const tx = await arweave.createTransaction({ data: TERMS_AGREEMENT });
    tags.forEach((tag) => tx.addTag(tag.name, tag.value));

    await dispatchTx(tx);
    setShowDialog(false);
  }, [setShowDialog]);

  const handleBackClick = useCallback(() => navigate('/'), [navigate]);

  return (
    <>
      <Dialog
        open={showDialog}
        maxWidth={'md'}
        sx={{
          '& .MuiPaper-root': {
            background:
              theme.palette.mode === 'dark'
                ? 'rgba(61, 61, 61, 0.9)'
                : theme.palette.background.default,
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
            Terms And Conditions
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            {'By clicking "Accept And Continue" you agree to our '}
            <Link to={'/terms'} target='_blank' rel='noopener noreferrer'>
              <u>terms and conditions</u>
            </Link>
            {'.'}
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{ display: 'flex', justifyContent: 'space-between', padding: '24px 24px 24px 24px' }}
        >
          <Button onClick={handleBackClick} variant='outlined' className='plausible-event-name=Terms+Decline+Click'>
            Decline
          </Button>
          <Button onClick={handleAgreeClick} variant='contained' className='plausible-event-name=Terms+Accept+Click'>
            Accept And Continue
          </Button>
        </DialogActions>
      </Dialog>
      {children}
    </>
  );
};

export default TermsAgreement;
