import { IEdge } from '@/interfaces/arweave';
import { NetworkStatus, useQuery } from '@apollo/client';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  Chip,
  Container,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid'; // Grid version 2
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import SearchIcon from '@mui/icons-material/Search';
import { MouseEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LIST_MODELS_QUERY } from '@/queries/graphql';
import { MARKETPLACE_FEE } from '@/constants';
import { findTag, genLoadingArray } from '@/utils/common';
import { Stack } from '@mui/system';
import ReplayIcon from '@mui/icons-material/Replay';
import useOnScreen from '@/hooks/useOnScreen';

const Explore = () => {
  const navigate = useNavigate();
  const [txs, setTxs] = useState<IEdge[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const target = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(target);
  const elementsPerPage = 5;

  const mockArray = genLoadingArray(elementsPerPage);

  const { data, loading, error, networkStatus, refetch, fetchMore } = useQuery(LIST_MODELS_QUERY, {
    variables: {
      first: elementsPerPage,
    },
    notifyOnNetworkStatusChange: true,
  });

  /**
   * @description callback for when card is clicked, it is responsible to navigate to clicked model details page
   * @param e click mouse event
   * @param txid clicked transaction id
   * @param index clicked element index
   * @returns
   */
  const handleCardClick = (e: MouseEvent<HTMLButtonElement>, txid?: string, index?: number) => {
    e.preventDefault();
    if (!txid || index === undefined) return;
    navigate(`/model/${encodeURIComponent(txid)}/detail`, { state: txs[index] });
  };

  /**
   * @description Effect that runs when `isOnScreen` or `txs` variables change;
   * For each change it will check if it has next page and if bottom bottom element is still on screen
   * (when bottom element leaves the screeen then next page is fetched when user scrolls and bottom element is visible aggain)
   */
  useEffect(() => {
    if (isOnScreen && hasNextPage) {
      fetchMore({
        variables: {
          after: txs[txs.length - 1].cursor,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          const newResult = Object.assign({}, prev, {
            transactions: {
              edges: [...prev.transactions.edges, ...fetchMoreResult.transactions.edges],
              pageInfo: fetchMoreResult.transactions.pageInfo,
            },
          });
          return newResult;
        },
      });
    }
  }, [isOnScreen, txs]);

  /**
   * @description Effect that runs on query data changes;
   * it is responsible to set the nextPage status and to update current loaded transactions
   */
  useEffect(() => {
    if (data && networkStatus === NetworkStatus.ready) {
      setHasNextPage(data.transactions.pageInfo.hasNextPage);
      setTxs(
        data.transactions.edges.filter((el: IEdge) => el.node.quantity.ar !== MARKETPLACE_FEE),
      );
    }
  }, [data]);

  return (
    <Box sx={{ flexGrow: 1 }} margin={2}>
      <Grid container spacing={{ xs: 2, md: 3, lg: 5 }} columns={{ xs: 4, sm: 8, md: 12 }}>
        <Grid xs={12} justifyContent={'flex-end'} display={'flex'} item>
          <TextField
            placeholder='Search...'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          ></TextField>
        </Grid>
        {error ? (
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
          txs.map((edge: IEdge, index) => (
            <Grid xs={2} sm={4} md={4} key={index} item>
              <Card>
                <CardActionArea
                  style={{ display: 'flex' }}
                  onClick={(e) => handleCardClick(e, findTag(edge, 'modelTransaction'), index)}
                >
                  <CardHeader
                    sx={{ marginRight: 0 }}
                    avatar={<Avatar alt='' src='' sx={{ width: 80, height: 80 }} />}
                    disableTypography={true}
                  />
                  <CardContent sx={{ maxWidth: '300px' }}>
                    <Box sx={{ textOverflow: 'ellipsis', flexWrap: 'wrap' }}>
                      <Typography noWrap variant='body1'>
                        {findTag(edge, 'modelTransaction')}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignContent: 'center',
                        }}
                      >
                        <Chip label={findTag(edge, 'category')} color='primary' />
                        <Box sx={{ display: 'flex', alignContent: 'center' }}>
                          <Typography variant='body1'>11</Typography>
                          <ThumbUpIcon />
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))
        )}
        {loading &&
          mockArray.map((val) => {
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
          })}
      </Grid>
      <div ref={target}></div>
    </Box>
  );
};

export default Explore;
