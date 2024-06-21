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

import { Box, Container, Grid, InputBase, Typography } from '@mui/material';
import '@/styles/ui.css';
import useSolutions from '@/hooks/useSolutions';
import LoadingCard from '@/components/loading-card';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import useOperators from '@/hooks/useOperators';
import { findTag, genLoadingArray } from '@/utils/common';
import Solution from '@/components/solution';
import { throttle } from 'lodash';
import { IContractEdge } from '@/interfaces/arweave';

// icons
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { motion } from 'framer-motion';

export default function Home() {
  const target = useRef<HTMLDivElement>(null);
  const { loading, txs, error } = useSolutions(target);
  const [filteredTxs, setFilteredTxs] = useState<IContractEdge[]>([]);

  const { validTxs: operatorsData, loading: operatorsLoading } = useOperators(txs);
  const loadingTiles = genLoadingArray(10);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = throttle((event: ChangeEvent<HTMLInputElement>) => {
    // do something
    if (event.target.value === '') {
      setFilteredTxs(txs);
    } else {
      setFilteredTxs(
        txs.filter((tx) =>
          findTag(tx, 'solutionName')?.toLowerCase().includes(event.target.value.toLowerCase()),
        ),
      );
    }
  }, 2000);

  useEffect(() => {
    setFilteredTxs(txs);
  }, [txs]);

  return (
    <motion.div
      initial={{ y: '-20px', opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.4, duration: 0.4 } }}
    >
      <Container
        ref={containerRef}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          alignContent: 'center',
          '@media all': {
            maxWidth: '100%',
          },
          mt: '40px',
        }}
      >
        <div className='w-full flex justify-center lg:justify-between mb-10 px-4 max-w-[1400px] gap-4 flex-wrap'>
          <div className='flex-3 justify-start text-xl lg:text-3xl font-medium flex items-center gap-4'>
            <img src='./fair-protocol-face-primarycolor.png' style={{ width: '42px' }} />
            Choose a solution and start creating
          </div>

          <Box
            sx={{
              borderRadius: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '3px 20px 3px 20px',
              alignItems: 'center',
              width: '100%',
              maxWidth: '300px',
              backgroundColor: 'white',
              outline: '1px solid lightgrey',
              '&:focus, &:focus-within': {
                outline: '2px solid #3aaaaa',
              },
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
              placeholder='Search'
            />
            <SearchRoundedIcon />
          </Box>
        </div>

        {error && <Typography>Error: {error.message}</Typography>}

        <motion.div
          initial={{ y: '-20px', opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { delay: 0.6, duration: 0.4 } }}
          className='w-full flex flex-wrap justify-center gap-8 max-w-[1400px]'
        >
          {loading &&
            loadingTiles.map((el) => (
              <Grid item key={el}>
                {' '}
                <LoadingCard />
              </Grid>
            ))}
          {filteredTxs.map((tx) => (
            <Grid item key={tx.node.id}>
              <motion.div
                initial={{ y: '-20px', opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { duration: 0.4 } }}
              >
                <Solution
                  tx={tx}
                  loading={operatorsLoading}
                  operatorsData={operatorsData.filter((el) => el.solutionId === tx.node.id)}
                  containerRef={containerRef}
                />
              </motion.div>
            </Grid>
          ))}
        </motion.div>
        <Box ref={target} sx={{ paddingBottom: '16px' }}></Box>
      </Container>
    </motion.div>
  );
}
