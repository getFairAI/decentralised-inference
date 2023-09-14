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

import AiCard from '@/components/ai-card';
import Logo from '@/components/logo';
import { DEFAULT_TAGS_RETRO, MODEL_CREATION_PAYMENT_TAGS } from '@/constants';
import { ChooseWalletContext } from '@/context/choose-wallet';
import { WalletContext } from '@/context/wallet';
import { IEdge, IQueryResult } from '@/interfaces/arweave';
import { FIND_BY_TAGS } from '@/queries/graphql';
import { commonUpdateQuery, findTag, isFakeDeleted } from '@/utils/common';
import { useQuery } from '@apollo/client';
import { Box, Button, Container, Typography } from '@mui/material';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignIn = () => {
  const elementsPerPage = 4;

  const [featuredTxs, setFeaturedTxs] = useState<IEdge[]>([]);
  const { setOpen: setChooseWalletOpen } = useContext(ChooseWalletContext);
  const { currentAddress } = useContext(WalletContext);
  const isConnected = useMemo(() => !!currentAddress, [currentAddress]);

  const navigate = useNavigate();

  const handleClick = useCallback(() => setChooseWalletOpen(true), [setChooseWalletOpen]);

  const handleSkip = useCallback(() => {
    localStorage.setItem('hasSignedIn', 'true');
    navigate('/');
  }, [localStorage]);

  const { data, loading, fetchMore } = useQuery(FIND_BY_TAGS, {
    variables: {
      tags: [...DEFAULT_TAGS_RETRO, ...MODEL_CREATION_PAYMENT_TAGS],
      first: elementsPerPage,
    },
  });

  const filterTxs = async (txsData: IQueryResult) => {
    const filtered: IEdge[] = [];
    for (const el of txsData.transactions.edges) {
      const modelId = findTag(el, 'modelTransaction') as string;
      const modelOwner = findTag(el, 'sequencerOwner') as string;
      if (!(await isFakeDeleted(modelId, modelOwner, 'model'))) {
        filtered.push(el);
      } else {
        // ignore
      }
    }
    if (featuredTxs.length === 0) {
      setFeaturedTxs(filtered.slice(0, elementsPerPage));
    } else {
      // ignore
    }
  };

  useEffect(() => {
    if (data?.transactions?.pageInfo.hasNextPage) {
      (async () => {
        await fetchMore({
          variables: {
            after:
              data.transactions.edges.length > 0
                ? data.transactions.edges[data.transactions.edges.length - 1].cursor
                : undefined,
          },
          updateQuery: commonUpdateQuery,
        });
      })();
    } else if (data) {
      (async () => {
        await filterTxs(data);
      })();
    } else {
      // ignore
    }
  }, [data]);

  return (
    <>
      <Container
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '21px',
        }}
      >
        <Box display={'flex'} minWidth={'300px'}>
          <Logo />
        </Box>
        <Box>
          <Typography
            sx={{ color: '#1F1F26' }}
            fontWeight={300}
            fontSize={'30px'}
            lineHeight={'40.5px'}
            align='center'
          >
            {!isConnected ? 'First, Lets get connected!' : 'Now Pick a Model To Get you Started!'}
          </Typography>
        </Box>
        {!isConnected && (
          <Button
            sx={{ borderRadius: '8px', gap: '10px', background: '#FFF' }}
            onClick={handleClick}
          >
            <Typography
              sx={{ color: '#1F1F26' }}
              fontWeight={700}
              fontSize={'18px'}
              lineHeight={'24.3px'}
            >
              Connect Wallet
            </Typography>
          </Button>
        )}

        {isConnected && (
          <>
            <Box className={'feature-cards-row'} justifyContent={'flex-end'}>
              {featuredTxs.map((el) => (
                <Box key={el.node.id} display={'flex'} flexDirection={'column'} gap={'30px'}>
                  <AiCard model={el} key={el.node.id} loading={loading} />
                  <Typography>{findTag(el, 'description')}</Typography>
                </Box>
              ))}
            </Box>
            <Button
              sx={{
                bottom: '20px',
                position: 'fixed',
                borderRadius: '8px',
                gap: '10px',
                background: '#FFF',
              }}
              onClick={handleSkip}
            >
              <Typography>Skip</Typography>
            </Button>
          </>
        )}
      </Container>
    </>
  );
};

export default SignIn;
