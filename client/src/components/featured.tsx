import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import AiCard from './ai-card';
import { IEdge } from '@/interfaces/arweave';
import '@/styles/ui.css';
import { ApolloError } from '@apollo/client';

const Featured = ({ data, loading }: { data: IEdge[]; loading: boolean; error?: ApolloError }) => {
  const [filterSelected, setFilterChanged] = useState(0);
  const filters = ['All', 'Text', 'Document'];

  const handleFilterChange = (newFilterIdx: number) => {
    setFilterChanged(newFilterIdx);
  };
  return (
    <>
      <Box className={'filter-box'}>
        {filters.map((filter, idx) => (
          <Typography
            key={filter}
            style={{
              fontWeight: filterSelected === idx ? 700 : 400,
              fontSize: '20px',
              lineHeight: '27px',
              display: 'flex',
              alignItems: 'center',
              textAlign: 'center',
              color: filterSelected === idx ? '#F4F4F4' : '#707070',
              cursor: 'pointer',
              borderRadius: filterSelected === idx ? '20px' : '0px',
            }}
            onClick={() => handleFilterChange(idx)}
          >
            {filter}
          </Typography>
        ))}
      </Box>
      <Box className={'feature-cards-row'}>
        {data.map((el) => (
          <AiCard model={el} key={el.node.id} loading={loading} />
        ))}
      </Box>
    </>
  );
};

export default Featured;
