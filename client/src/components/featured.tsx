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

import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import AiCard from './ai-card';
import '@/styles/ui.css';
import useFeaturedModels from '@/hooks/useFeaturedModels';
import { IContractEdge } from '@/interfaces/arweave';
import { ApolloError } from '@apollo/client';
import LoadingCard from './loading-card';

type fetchWithFilterParam = 'none' | 'text' | 'video' | 'audio' | 'image';
const filters: fetchWithFilterParam[] = [ 'none', 'text', 'image', 'video', 'audio' ];

const CategoryFilter = ({ filterSelected, idx, setFilterChanged, fetchWithFilter }: { filterSelected: number, idx: number, setFilterChanged: Dispatch<SetStateAction<number>>, fetchWithFilter: (filter: fetchWithFilterParam) => void }) => {

  const theme = useTheme();
  const transparent = 0.5;

  const handleFilterChange = useCallback(() => {
    setFilterChanged(idx);
    fetchWithFilter(filters[idx]);
  }, [ idx, setFilterChanged, fetchWithFilter ]);

  const labels = ['All', 'Text', 'Image', 'Video', 'Audio'];

  return <Typography
    style={{
      fontWeight: filterSelected === idx ? theme.typography.fontWeightBold : theme.typography.fontWeightRegular,
      fontSize: '20px',
      lineHeight: '27px',
      display: 'flex',
      alignItems: 'center',
      textAlign: 'center',
      cursor: 'pointer',
      opacity: filterSelected === idx ? 1 : transparent,
      borderRadius: filterSelected === idx ? '20px' : '0px',
    }}
    onClick={handleFilterChange}
  >
    {labels[idx]}
  </Typography>;
};

const FeaturedRow = ({ models, loading, error }: { models: IContractEdge[], loading: boolean, error?: ApolloError}) => {
  if (error) {
    return <Typography>Could Not Fetch Models</Typography>;
  } else if (loading) {
    return <>
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
    </>;
  } else if (models && models.length === 0) {
    return <Typography>Could not find models matching filters</Typography>;
  } else {
    return <>{models.map((el) => (
      <AiCard model={el} key={el.node.id} />
    ))}</>;
  }
};

const Featured = () => {
  const smallScreen = useMediaQuery('(max-width:1600px)');
  const { featuredTxs, loading, error, fetchWithFilter } = useFeaturedModels();
  const [ filterSelected, setFilterChanged ] = useState(0);

  return (
    <>
      <Box
        display={'flex'}
        sx={{
          flexDirection: smallScreen ? 'column' : 'row',
        }}
      >
        <Box display={'flex'} flexDirection={'column'} width={'40%'} justifyContent={'center'}>
          <Typography
            sx={{
              fontStyle: 'normal',
              fontWeight: 300,
              fontSize: '30px',
              lineHeight: '41px',
            }}
          >
            Choose your AI Model to start using.
          </Typography>
          <Typography variant='h4'>
            Browse available AI models and choose what suits your task best. Fair Protocol brings
            Decentralized AI Computation at low cost with benefits for all participants.
          </Typography>
        </Box>
        <Box display={'flex'} flexDirection={'column'} width={'100%'}>
          <Box className={'filter-box'} justifyContent={'flex-end'}>
            {filters.map((filter, idx) => <CategoryFilter filterSelected={filterSelected} setFilterChanged={setFilterChanged} fetchWithFilter={fetchWithFilter} idx={idx} key={filter} />)}
          </Box>
          <Box className={'feature-cards-row'} justifyContent={'flex-end'}>
            <FeaturedRow models={featuredTxs} loading={loading} error={error}/>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Featured;
