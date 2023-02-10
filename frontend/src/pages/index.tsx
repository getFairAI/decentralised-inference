import { gql, useQuery } from '@apollo/client';
import { Avatar, Box, Card, CardActionArea, Container, Grid, IconButton, Slide, Stack, Typography} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SlideCard from '@/components/slide-card';
import { useState } from 'react';
import GroupIcon from '@mui/icons-material/Group';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import EngineeringIcon from '@mui/icons-material/Engineering';
import { IEdge } from '@/interfaces/arweave';

export default function Home() {
  const TOP5QUERY = gql`
    query txs {
      transactions (
        first: 5,
        tags: [
          {
            name: "test",
            values: ["test-upload"]
          },
        ]
      )
      {
        edges {
          node {
            id
            tags {
              name
              value
            }
          }
        }
      }
    }
  `;

  const { data, loading, error } = useQuery(TOP5QUERY);
  const [ rightClicked, setRightClicked ] = useState(false);
  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (error) {
    console.error(error);
    return null;
  }

  const txs = data.transactions.edges as IEdge[];
  
  const click = () => {
    setRightClicked(true);
  }

  return (
    <Container sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignContent: 'space-around'}}>
      <Box display={'flex'}>
        <Box sx={{ flexGrow: 0, display: { md: 'flex', justifyContent: 'flex-start' } }}>
          <IconButton disableRipple={true} onClick={click}><ChevronLeftIcon /></IconButton>
        </Box>
        <Box sx={{ flexGrow: 1, display: { md: 'flex', justifyContent: 'space-between' }, margin: '16px' }}>
          <SlideCard />
        </Box>
        <Box sx={{ flexGrow: 0, display: { md: 'flex', justifyContent: 'flex-start' } }}>
          <IconButton disableRipple={true}><ChevronRightIcon /></IconButton>
        </Box>
      </Box>
      <Box sx={{ margin: '16px' }}>
        <Box display={'flex'}>
          <Typography variant='h4' display={'flex'}>Arweave Powered AI Model MarketPlace</Typography>
          <Typography variant='h6' display={'flex'} alignItems={'center'} noWrap><GroupIcon fontSize='large'/> 1k users</Typography>
          <Typography variant='h6' display={'flex'} alignItems={'center'} noWrap><ModelTrainingIcon fontSize='large'/>260 Models</Typography>
          <Typography variant='h6' display={'flex'} alignItems={'center'} noWrap><EngineeringIcon fontSize='large'/>600 Operators</Typography>
        </Box>
        {/* <Card>
          <CardActionArea sx={{ height: '150px'}}>
            <Typography variant='h5'>learn More <ChevronRightIcon /></Typography>
          </CardActionArea>
        </Card> */}
      </Box>
      <Box marginBottom={'16px'}>
        {/* <Box display={'flex'}>
          <Typography variant='h4'>
            Top Performing models
          </Typography>
        </Box> */}
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid item xs={12} sm={12} md={6}>
            <Stack spacing={2}>
              {txs.map((edge: IEdge, index: number) => (
                <Box sx={{ width: '100%'}} display={'flex'} flexDirection={'row'} key={index}>
                  <Card sx={{ width: '100%'}}>
                    <CardActionArea sx={{ width: '100%'}}>
                      <Box margin={'8px'}>
                        <Avatar />
                        <Typography variant="h6">{edge.node.tags.find(el => el.name === 'test')?.value}</Typography>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Box>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} sm={12} md={6}>
            <Stack spacing={2}>
              {txs.map((edge: IEdge, index: number) => (
                <Box sx={{ width: '100%'}} display={'flex'} flexDirection={'row'} key={index}>
                  <Card sx={{ width: '100%'}}>
                    <CardActionArea sx={{ width: '100%'}}>
                      <Box margin={'8px'}>
                        <Avatar />
                        <Typography variant="h6">{edge.node.tags.find(el => el.name === 'test')?.value}</Typography>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Box>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
