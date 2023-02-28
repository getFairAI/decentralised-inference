import { gql, useQuery } from '@apollo/client';
import { Avatar, Box, Card, CardActionArea, Container, Grid, IconButton, Stack, Typography} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SlideCard from '@/components/slide-card';
import { useRef, useState } from 'react';
import GroupIcon from '@mui/icons-material/Group';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import EngineeringIcon from '@mui/icons-material/Engineering';
import { IEdge } from '@/interfaces/arweave';
import { ThumbUp } from '@mui/icons-material';

export default function Home() {
  const TOP5QUERY = gql`
    query txs {
      transactions (
        first: 5
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
  const [slideIdx, setSlideIdx ] = useState(0);
  const [ swipeRight, setSwipeRight] = useState(false);
  const [ swiped, setSwiped ] = useState(true);
  const max = 5;

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (error) {
    console.error(error);
    return null;
  }

  const onDisplayTxs = data as IEdge[];
  const txs = data as IEdge[];

  const click = (direction: string) => {
    setSwiped(!swiped);
    if (direction === 'left') {
      setSwipeRight(false);
      if (slideIdx === 0) {
        setSlideIdx(max - 1);
      } else {
        setSlideIdx(slideIdx - 1);
      }
      
    } else if (direction === 'right') {
      setSwipeRight(true);
      if (slideIdx === 4) {
        setSlideIdx(0);
      } else {
        setSlideIdx(slideIdx + 1);
      }
    }
  }

  return (
    <Container sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignContent: 'space-around', top: '64px', position: 'relative'}}>
      <Box display={'flex'} >
        <Box sx={{ flexGrow: 0, display: { md: 'flex', justifyContent: 'flex-start' } }}>
          <IconButton disableRipple={true}  onClick={() => click('left')}><ChevronLeftIcon /></IconButton>
        </Box>
        <Box sx={{ flexGrow: 1, display: { md: 'flex', justifyContent: 'space-between' }, margin: '16px' }}>
          {/* {
            onDisplayTxs.map((edge, index) => (
              <SlideCard  key={index} data={edge}/>
            ))
          } */}
          <SlideCard data={onDisplayTxs.find((_, index) => index === slideIdx)!}/>
        </Box>
        <Box sx={{ flexGrow: 0, display: { md: 'flex', justifyContent: 'flex-start' } }}>
          <IconButton disableRipple={true} onClick={() => click('right')}><ChevronRightIcon /></IconButton>
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
                      <Box margin={'8px'} display='flex' justifyContent={'space-between'}>
                        <Box display='flex'>
                          <Avatar sx={{ width: 56, height: 56 }}/>
                          <Box sx={{ maxWidth: '300px' }} marginLeft={'8px'}>
                            <Typography variant="h6">{edge.node.tags.find(el => el.name === 'test')?.value}</Typography>
                            <Typography variant='h6' noWrap>{edge.node.id}</Typography>
                          </Box>
                        </Box>
                        <Box display={'flex'} alignItems='self-end'>
                          <Typography variant='body1' lineHeight={1} paddingRight={'8px'}>2</Typography>
                          <ThumbUp></ThumbUp>
                        </Box>
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
                      <Box margin={'8px'} display='flex' justifyContent={'space-between'}>
                        <Box display='flex'>
                          <Avatar sx={{ width: 56, height: 56 }}/>
                          <Box sx={{ maxWidth: '300px' }} marginLeft={'8px'}>
                            <Typography variant="h6">{edge.node.tags.find(el => el.name === 'test')?.value}</Typography>
                            <Typography variant='h6' noWrap>{edge.node.id}</Typography>
                          </Box>
                        </Box>
                        <Box display={'flex'} alignItems='self-end'>
                          <Typography variant='body1' lineHeight={1} paddingRight={'8px'}>2</Typography>
                          <ThumbUp></ThumbUp>
                        </Box>
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
