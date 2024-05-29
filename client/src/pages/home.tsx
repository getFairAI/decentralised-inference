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
  Box,
  Container, Grid,  Typography,
} from '@mui/material';
import '@/styles/ui.css';
import useSolutions from '@/hooks/useSolutions';
import LoadingCard from '@/components/loading-card';
import { useRef } from 'react';
import useOperators from '@/hooks/useOperators';
import { genLoadingArray } from '@/utils/common';
import Solution from '@/components/solution';

export default function Home() {
  const target = useRef<HTMLDivElement>(null);
  const {
    loading,
    txs,
    error,
  } = useSolutions(target);

  const { validTxs: operatorsData } = useOperators(txs);
  const loadingTiles = genLoadingArray(10);

  return (
    <>
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignContent: 'center',
          '@media all': {
            maxWidth: '100%',
          },
          mt: '36px'
        }}
      >
        {error && <Typography>Error: {error.message}</Typography>}
        <Grid container spacing={10} display={'flex'} justifyContent={'flex-start'}>
          {loading && loadingTiles.map(el => <Grid item key={el}> <LoadingCard /></Grid>)}
          {txs.map((tx) => (
            <Grid item key={tx.node.id}>
              <Solution tx={tx} operatorsData={operatorsData.filter(el => el.solutionId === tx.node.id)}/>
            </Grid>
          ))}
        </Grid>
        <Box ref={target} sx={{ paddingBottom: '16px' }}></Box>
      </Container>
    </>
  );
};
