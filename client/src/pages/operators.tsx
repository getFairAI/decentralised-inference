import { CustomStepper } from '@/components/stepper';
import { IEdge } from '@/interfaces/arweave';
import { LIST_MODELS_QUERY } from '@/queries/graphql';
import { useQuery } from '@apollo/client';
import { Container, Box, Stepper, Stack, Card, CardActionArea, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Operators = () => {
  const navigate = useNavigate();
  const [ elements, setElements ] = useState<any[]>([]);
  const { data, loading, error } = useQuery(LIST_MODELS_QUERY);
  
  
  useEffect(() => {
    if (data) {
      setElements(data.map((el: any) => {
        return {
          name: '',
          txid: el.node.id,
          uploader: el.node.address,
          avgFee: 0,
          avgRunCost: 0,
          totalRuns: 0,
          rating: 0
        };
      }));
    }
  }, [ data ]);
  
  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (error) {
    console.error(error);
    return null;
  }

  const handleCardClick = (idx: number) => {
    navigate(`/model/${encodeURIComponent(elements[idx].txid)}/register`, { state: data[idx] });
  };
  return (
    <>
      <Container sx={{ top: '64px', position: 'relative' }}>
        <Box>
          <Stack spacing={4} sx={{ margin: '16px' }}>
            {elements.map((el: any, idx: number) => (
              <Card key={idx}>
                <Box>
                  <CardActionArea onClick={(e) => handleCardClick(idx)}>
                    <Typography>Name: {el.name}</Typography>
                    <Typography>Transaction id: {el.txid}</Typography>
                    <Typography>Creator: {el.uploader}</Typography>
                    <Typography>Average Fee: {el.avgFee}</Typography>
                    <Typography>Average Run cost: {el.avgRunCost}</Typography>
                    <Typography>Number of Executions to date: {el.totalRuns}</Typography>
                    <Typography>Rating: {el.rating}</Typography>
                  </CardActionArea>
                </Box>
              </Card>
            ))}
          </Stack>
          {/* <CustomStepper /> */}
        </Box>
      </Container>
    </>
  );
};

export default Operators;