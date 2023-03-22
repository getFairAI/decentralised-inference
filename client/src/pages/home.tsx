import { gql, NetworkStatus, useQuery } from '@apollo/client';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  Container,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SlideCard from '@/components/slide-card';
import { useEffect, useRef, useState } from 'react';
import GroupIcon from '@mui/icons-material/Group';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import EngineeringIcon from '@mui/icons-material/Engineering';
import { IEdge } from '@/interfaces/arweave';
import { ThumbUp } from '@mui/icons-material';
import { LIST_LATEST_MODELS_QUERY, LIST_MODELS_QUERY } from '@/queries/graphql';
import useOnScreen from '@/hooks/useOnScreen';
import { MARKETPLACE_FEE } from '@/constants';
import { genLoadingArray } from '@/utils/common';
import ReplayIcon from '@mui/icons-material/Replay';

export default function Home() {
  const [slideIdx, setSlideIdx] = useState(0);
  const [, setSwipeRight] = useState(false);
  const [swiped, setSwiped] = useState(true);
  const [ hasNextPage, setHasNextPage ] = useState(false);
  const [ txs, setTxs ] = useState<IEdge[]>([]);
  const max = 5;
  const elementsPerPage = 10;
  const target = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(target);
  const mockArray = genLoadingArray(elementsPerPage / 2);

  const { data, loading, error } = useQuery(LIST_LATEST_MODELS_QUERY, {
    variables: {
      first: 5,
    }
  });

  const { data: listData, loading: listLoading, error: listError, fetchMore, networkStatus, refetch } = useQuery(LIST_MODELS_QUERY, {
    variables: {
      first: elementsPerPage
    }
  });
  
  useEffect(() => {
    if (isOnScreen && hasNextPage) {
      fetchMore({
        variables: {
          after: txs[txs.length - 1].cursor,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          const newData = fetchMoreResult.transactions.edges;
          
          const merged = prev && prev.transactions?.edges ? prev.transactions.edges.slice(0) : [];
          for (let i = 0; i < newData.length; ++i) {
            if (!merged.find((el: IEdge) => el.node.id === newData[i].node.id)) {
              merged.push(newData[i]);
            }
          }
          const newResult = Object.assign({}, prev, {
            transactions: {
              edges: merged,
              pageInfo: fetchMoreResult.transactions.pageInfo,
            }
          });
          return newResult;
        }
      });
    }
  }, [ useOnScreen, listData ]);

  useEffect(() => {
    if (listData && networkStatus === NetworkStatus.ready) {
      setHasNextPage(listData.transactions.pageInfo.hasNextPage);
      setTxs(listData.transactions.edges.filter((el: IEdge) => el.node.quantity.ar !== MARKETPLACE_FEE));
    }
  }, [listData]);

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
  };

  return (
    <Container
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        alignContent: 'space-around',
      }}
    >
      <Box display={'flex'}>
        <Box sx={{ flexGrow: 0, display: { md: 'flex', justifyContent: 'flex-start' } }}>
          <IconButton disableRipple={true} onClick={() => click('left')}>
            <ChevronLeftIcon />
          </IconButton>
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            display: { md: 'flex', justifyContent: 'space-between' },
            margin: '16px',
          }}
        >
          {/* {
            onDisplayTxs.map((edge, index) => (
              <SlideCard  key={index} data={edge}/>
            ))
          } */}
          <SlideCard data={data && (data.transactions.edges as IEdge[]).find((_, index) => index === slideIdx)} loading={loading} error={error}/>
        </Box>
        <Box sx={{ flexGrow: 0, display: { md: 'flex', justifyContent: 'flex-start' } }}>
          <IconButton disableRipple={true} onClick={() => click('right')}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ margin: '16px' }}>
        <Box display={'flex'}>
          <Typography variant='h4' display={'flex'}>
            Arweave Powered AI Model MarketPlace
          </Typography>
          <Typography variant='h6' display={'flex'} alignItems={'center'} noWrap>
            <GroupIcon fontSize='large' /> 1k users
          </Typography>
          <Typography variant='h6' display={'flex'} alignItems={'center'} noWrap>
            <ModelTrainingIcon fontSize='large' />
            260 Models
          </Typography>
          <Typography variant='h6' display={'flex'} alignItems={'center'} noWrap>
            <EngineeringIcon fontSize='large' />
            600 Operators
          </Typography>
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
          {
            listError ? (
              <Container>
                <Typography alignItems='center' display='flex' flexDirection='column'>
                  Could not Fetch Available Models.
                  <Button
                    sx={{ width: 'fit-content' }}
                    endIcon={<ReplayIcon />}
                    onClick={() => refetch()}
                  >
                    Retry
                  </Button>
                </Typography>
              </Container>
            ) : (
            <>
              <Grid item xs={12} sm={12} md={6}>
                <Stack spacing={2}>
                  {txs.slice(0, (txs.length / 2) + 1).map((edge: IEdge, index: number) => (
                    <Box sx={{ width: '100%' }} display={'flex'} flexDirection={'row'} key={index}>
                      <Card sx={{ width: '100%' }}>
                        <CardActionArea sx={{ width: '100%' }}>
                          <Box margin={'8px'} display='flex' justifyContent={'space-between'}>
                            <Box display='flex'>
                              <Avatar sx={{ width: 56, height: 56 }} />
                              <Box sx={{ maxWidth: '300px' }} marginLeft={'8px'}>
                                <Typography variant='h6'>
                                  {edge.node.tags.find((el) => el.name === 'test')?.value}
                                </Typography>
                                <Typography noWrap variant='body1'>
                                  {edge.node.tags.find((el) => el.name === 'Model-Transaction')?.value}
                                </Typography>
                              </Box>
                            </Box>
                            <Box display={'flex'} alignItems='self-end'>
                              <Typography variant='body1' lineHeight={1} paddingRight={'8px'}>
                                2
                              </Typography>
                              <ThumbUp></ThumbUp>
                            </Box>
                          </Box>
                        </CardActionArea>
                      </Card>
                    </Box>
                  ))}
                </Stack>
                {
                  loading && mockArray.map((val) => {
                    return (
                      <Grid xs={2} sm={4} key={val} item>
                        <Card sx={{ display: 'flex' }}>
                          <CardHeader
                            sx={{ marginRight: 0 }}
                            avatar={
                              <Skeleton
                                animation={'wave'}
                                variant='circular'
                                sx={{ width: 80, height: 80 }}
                              />
                            }
                            disableTypography={true}
                          />
                          <CardContent sx={{ width: '100%' }}>
                            <Box sx={{ textOverflow: 'ellipsis', flexWrap: 'wrap' }}>
                              <Stack spacing={1}>
                                <Typography noWrap variant='body1'>
                                  <Skeleton animation={'wave'} variant='rounded' />
                                </Typography>
                                <Typography variant='body1' width={'80%'}>
                                  <Skeleton animation='wave' variant='rounded' />
                                </Typography>
                                <Box display={'flex'} justifyContent={'space-between'}>
                                  <Typography variant='body1' width={'45%'}>
                                    <Skeleton animation='wave' variant='rounded' />
                                  </Typography>
                                  <Typography variant='body1' width={'30%'}>
                                    <Skeleton animation='wave' variant='rounded' />
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })
                }
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <Stack spacing={2}>
                  {txs.slice(-(txs.length / 2)).map((edge: IEdge, index: number) => (
                    <Box sx={{ width: '100%' }} display={'flex'} flexDirection={'row'} key={index}>
                      <Card sx={{ width: '100%' }}>
                        <CardActionArea sx={{ width: '100%' }}>
                          <Box margin={'8px'} display='flex' justifyContent={'space-between'}>
                            <Box display='flex'>
                              <Avatar sx={{ width: 56, height: 56 }} />
                              <Box sx={{ maxWidth: '300px' }} marginLeft={'8px'}>
                                <Typography variant='h6'>
                                  {edge.node.tags.find((el) => el.name === 'test')?.value}
                                </Typography>
                                <Typography noWrap variant='body1'>
                                  {edge.node.tags.find((el) => el.name === 'Model-Transaction')?.value}
                                </Typography>
                              </Box>
                            </Box>
                            <Box display={'flex'} alignItems='self-end'>
                              <Typography variant='body1' lineHeight={1} paddingRight={'8px'}>
                                2
                              </Typography>
                              <ThumbUp></ThumbUp>
                            </Box>
                          </Box>
                        </CardActionArea>
                      </Card>
                    </Box>
                  ))}
                  {
                  listLoading && mockArray.map((val) => {
                    return (
                      <Grid xs={2} sm={4} key={val} item>
                        <Card sx={{ display: 'flex' }}>
                          <CardHeader
                            sx={{ marginRight: 0 }}
                            avatar={
                              <Skeleton
                                animation={'wave'}
                                variant='circular'
                                sx={{ width: 80, height: 80 }}
                              />
                            }
                            disableTypography={true}
                          />
                          <CardContent sx={{ width: '100%' }}>
                            <Box sx={{ textOverflow: 'ellipsis', flexWrap: 'wrap' }}>
                              <Stack spacing={1}>
                                <Typography noWrap variant='body1'>
                                  <Skeleton animation={'wave'} variant='rounded' />
                                </Typography>
                                <Typography variant='body1' width={'80%'}>
                                  <Skeleton animation='wave' variant='rounded' />
                                </Typography>
                                <Box display={'flex'} justifyContent={'space-between'}>
                                  <Typography variant='body1' width={'45%'}>
                                    <Skeleton animation='wave' variant='rounded' />
                                  </Typography>
                                  <Typography variant='body1' width={'30%'}>
                                    <Skeleton animation='wave' variant='rounded' />
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })
                }
                </Stack>
              </Grid>
            </>
          )}
        </Grid>
        <div ref={target}></div>
      </Box>
    </Container>
  );
}
