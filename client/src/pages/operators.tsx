import { MARKETPLACE_FEE } from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { LIST_MODELS_QUERY } from '@/queries/graphql';
import { genLoadingArray } from '@/utils/common';
import { NetworkStatus, useQuery } from '@apollo/client';
import {
  Container,
  Box,
  Stack,
  Card,
  CardActionArea,
  Typography,
  Button,
  Skeleton,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import ReplayIcon from '@mui/icons-material/Replay';
import ModelCard from '@/components/model-card';
import useOnScreen from '@/hooks/useOnScreen';
import { Outlet } from 'react-router-dom';

const Operators = () => {
  const [txs, setTxs] = useState<IEdge[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const target = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(target);
  const elementsPerPage = 5;
  const [hightlightTop, setHighLightTop] = useState(false);
  const theme = useTheme();

  const mockArray = genLoadingArray(6);

  const { data, loading, error, networkStatus, refetch, fetchMore } = useQuery(LIST_MODELS_QUERY, {
    variables: {
      first: elementsPerPage,
    },
    notifyOnNetworkStatusChange: true,
  });

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

  useEffect(() => {
    if (data && networkStatus === NetworkStatus.ready) {
      setHasNextPage(data.transactions.pageInfo.hasNextPage);
      setTxs(
        data.transactions.edges.filter((el: IEdge) => el.node.quantity.ar !== MARKETPLACE_FEE),
      );
    }
  }, [data]);

  const handleHighlight = (value: boolean) => setHighLightTop(value);

  return (
    <>
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          alignContent: 'space-around',
          '@media all': {
            maxWidth: '100%',
          },
        }}
      >
        <Typography
          sx={{
            fontStyle: 'normal',
            fontWeight: 300,
            fontSize: '30px',
            lineHeight: '41px',
            padding: '16px',
            /* identical to box height */
            // background: 'linear-gradient(101.22deg, rgba(14, 255, 168, 0.58) 30.84%, #9747FF 55.47%, rgba(84, 81, 228, 0) 78.13%), linear-gradient(0deg, #FFFFFF, #FFFFFF)',
          }}
        >
          Choose a Model to Start Operating
        </Typography>
        <Box className={'filter-box'} sx={{ display: 'flex' }}>
          <Box display={'flex'} flexDirection={'column'}>
            <Box display='flex' gap={'50px'} width={'100%'}>
              <Typography
                sx={{
                  fontStyle: 'normal',
                  fontWeight: 500,
                  fontSize: '30px',
                  fontHeight: '41px',
                  opacity: !hightlightTop ? 1 : 0.5,
                }}
                onClick={() => handleHighlight(false)}
              >
                Trending
              </Typography>
              <Typography
                sx={{
                  fontStyle: 'normal',
                  fontWeight: 500,
                  fontSize: '30px',
                  fontHeight: '41px',
                  opacity: hightlightTop ? 1 : 0.5,
                }}
                onClick={() => handleHighlight(true)}
              >
                Top
              </Typography>
              <Box flexGrow={1} />
            </Box>
            <Box display={'flex'} position='relative'>
              <Box height={'6px'} sx={{
                position: 'absolute',
                width: hightlightTop ? '55px' : '119px',
                left: hightlightTop ? '166px' : 0,
                background: theme.palette.primary.main,
                borderRadius: '8px'
              }} />
            </Box>
          </Box>
          <Box flexGrow={1} />
          <Box display='flex' gap={'50px'}>
            <Select
              sx={{
                padding: '0px 8px',
                border: '2px solid transparent',
                borderRadius: '10px',
                textTransform: 'none',
                background: `linear-gradient(${theme.palette.background.default}, ${theme.palette.background.default}) padding-box,linear-gradient(170.66deg, ${theme.palette.primary.main} -38.15%, ${theme.palette.primary.main} 30.33%, rgba(84, 81, 228, 0) 93.33%) border-box`,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderWidth: 0,
                },
              }}
              value={'24h'}
            >
              <MenuItem value={'24h'}>
                <Typography
                  sx={{
                    fontStyle: 'normal',
                    fontWeight: 600,
                    fontSize: '20px',
                    lineHeight: '27px',
                    textAlign: 'center',
                    color: theme.palette.primary.main,
                  }}
                >
                  24H
                </Typography>
              </MenuItem>
              <MenuItem value={'week'}>
                <Typography>1 Week</Typography>
              </MenuItem>
            </Select>
            <Button
              sx={{
                borderRadius: '10px',
                border: '2px solid transparent',
                padding: '8px',
                textTransform: 'none',
                background: `linear-gradient(${theme.palette.background.default}, ${theme.palette.background.default}) padding-box,linear-gradient(170.66deg, ${theme.palette.primary.main} -38.15%, ${theme.palette.primary.main} 30.33%, rgba(84, 81, 228, 0) 93.33%) border-box`,
              }}
            >
              <Typography
                sx={{
                  padding: '0px 8px',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '20px',
                  lineHeight: '27px',
                  textAlign: 'center',
                }}
              >
                View All
              </Typography>
            </Button>
          </Box>
        </Box>
        <Box>
          <Box
            display={'flex'}
            justifyContent={'flex-start'}
            flexDirection={'row-reverse'}
            gap='30px'
            margin={'16px'}
          >
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '20px',
                lineHeight: '27px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              Last updated
            </Typography>
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '20px',
                lineHeight: '27px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              Rating
            </Typography>
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '20px',
                lineHeight: '27px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              Usage
            </Typography>
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '20px',
                lineHeight: '27px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              Avg. Operators Fee
            </Typography>
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '20px',
                lineHeight: '27px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              Model Fee
            </Typography>
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '20px',
                lineHeight: '27px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              Current # of Operators
            </Typography>
          </Box>
          <Stack spacing={4} sx={{ margin: '16px' }}>
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
              txs.map((el: IEdge, idx: number) => (
                <ModelCard modelTx={el} key={el.node.id} index={idx} />
              ))
            )}
            {loading &&
              mockArray.map((val) => (
                <Card key={val}>
                  <Box>
                    <CardActionArea>
                      <Typography>
                        <Skeleton animation={'wave'} />
                      </Typography>
                      <Typography>
                        <Skeleton animation={'wave'} />
                      </Typography>
                      <Typography>
                        <Skeleton animation={'wave'} />
                      </Typography>
                      <Typography>
                        <Skeleton animation={'wave'} />
                      </Typography>
                      <Typography>
                        <Skeleton animation={'wave'} />
                      </Typography>
                      <Typography>
                        <Skeleton animation={'wave'} />
                      </Typography>
                    </CardActionArea>
                  </Box>
                </Card>
              ))}
          </Stack>
          <div ref={target}></div>
        </Box>
      </Container>
      <Outlet />
    </>
  );
};

export default Operators;
