import { Box, Typography, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import AiCard from './ai-card';
import { IEdge } from '@/interfaces/arweave';
import '@/styles/ui.css';
import { ApolloError } from '@apollo/client';

const Featured = ({ data, loading }: { data: IEdge[]; loading: boolean; error?: ApolloError }) => {
  const [filterSelected, setFilterChanged] = useState(0);
  const filters = ['All', 'Text', 'Document'];
  const smallScreen = useMediaQuery('(max-width:1600px)');

  const handleFilterChange = (newFilterIdx: number) => {
    setFilterChanged(newFilterIdx);
  };
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
              /* identical to box height */
              // background: 'linear-gradient(101.22deg, rgba(14, 255, 168, 0.58) 30.84%, #9747FF 55.47%, rgba(84, 81, 228, 0) 78.13%), linear-gradient(0deg, #FFFFFF, #FFFFFF)',
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
                  cursor: 'pointer',
                  opacity: filterSelected === idx ? 1 : 0.5,
                  borderRadius: filterSelected === idx ? '20px' : '0px',
                }}
                onClick={() => handleFilterChange(idx)}
              >
                {filter}
              </Typography>
            ))}
          </Box>
          <Box className={'feature-cards-row'} justifyContent={'flex-end'}>
            {data.map((el) => (
              <AiCard model={el} key={el.node.id} loading={loading} />
            ))}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Featured;
