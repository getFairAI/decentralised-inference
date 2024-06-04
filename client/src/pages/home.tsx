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
  Container, Grid,  Icon,  InputBase, Typography, useTheme,
} from '@mui/material';
import '@/styles/ui.css';
import useSolutions from '@/hooks/useSolutions';
import LoadingCard from '@/components/loading-card';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import useOperators from '@/hooks/useOperators';
import { findTag, genLoadingArray } from '@/utils/common';
import Solution from '@/components/solution';
import { throttle } from 'lodash';
import { IContractEdge } from '@/interfaces/arweave';

export default function Home() {
  const target = useRef<HTMLDivElement>(null);
  const { loading, txs, error } = useSolutions(target);
  const [ filteredTxs, setFilteredTxs ] = useState<IContractEdge[]>([]);

  const { validTxs: operatorsData, loading: operatorsLoading } = useOperators(txs);
  const loadingTiles = genLoadingArray(10);
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = throttle((event: ChangeEvent<HTMLInputElement>) => {
    // do something
    if (event.target.value === '') {
      setFilteredTxs(txs);
    } else {
      setFilteredTxs(txs.filter((tx) => findTag(tx, 'solutionName')?.toLowerCase().includes(event.target.value.toLowerCase())));
    }
  }, 2000);

  useEffect(() => {
    setFilteredTxs(txs);
  }, [ txs ]);

  return (
    <>
      <Container
        ref={containerRef}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignContent: 'center',
          '@media all': {
            maxWidth: '100%',
          },
          mt: '18px'
        }}
      >
        <Box display={'flex'} justifyContent={'flex-end'} alignItems={'center'}  mb={'24px'} pr={'20px'}>
          <Box
            sx={{
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '3px 20px 3px 20px',
              alignItems: 'center',
              border: 'solid',
              borderColor: theme.palette.terciary.main,
              borderWidth: '0.5px',
              width: '20%',
            }}
          >
            <InputBase
              sx={{
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '18px',
                lineHeight: '16px',
                width: '100%',
              }}
              onChange={handleChange}
              placeholder='Search...'
            />
            <Icon
              sx={{
                height: '30px',
              }}
            >
              <img src='./search-icon.svg'></img>
            </Icon>
          </Box>
        </Box>
        {error && <Typography>Error: {error.message}</Typography>}
        <Grid container spacing={10} display={'flex'} justifyContent={'center'}>
          {loading &&
            loadingTiles.map((el) => (
              <Grid item key={el}>
                {' '}
                <LoadingCard />
              </Grid>
            ))}
          {filteredTxs.map((tx) => (
            <Grid item key={tx.node.id}>
              <Solution
                tx={tx}
                loading={operatorsLoading}
                operatorsData={operatorsData.filter((el) => el.solutionId === tx.node.id)}
                containerRef={containerRef}
              />
            </Grid>
          ))}
        </Grid>
        <Box ref={target} sx={{ paddingBottom: '16px' }}></Box>
      </Container>
    </>
  );
}
