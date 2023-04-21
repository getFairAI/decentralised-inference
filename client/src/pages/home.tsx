import { NetworkStatus, useQuery } from '@apollo/client';
import {
  Box,
  Button,
  Container,
  MenuItem,
  Select,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';

import { useContext, useEffect, useRef, useState } from 'react';

import { IEdge } from '@/interfaces/arweave';
import { LIST_LATEST_MODELS_QUERY, LIST_MODELS_QUERY } from '@/queries/graphql';
import useOnScreen from '@/hooks/useOnScreen';
import { MARKETPLACE_FEE } from '@/constants';
import Featured from '@/components/featured';
import '@/styles/ui.css';
import AiListCard from '@/components/ai-list-card';
import { Outlet } from 'react-router-dom';
import FilterContext from '@/context/filter';
import { findTag } from '@/utils/common';
import { isTxConfirmed } from '@/utils/arweave';

export default function Home() {
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hightlightTop, setHighLightTop] = useState(false);
  const [txs, setTxs] = useState<IEdge[]>([]);
  const [featuredTxs, setFeaturedTxs] = useState<IEdge[]>([]);
  const target = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(target);
  const filterValue = useContext(FilterContext);
  const theme = useTheme();
  const elementsPerPage = 5;

  const {
    data,
    loading,
    error,
    networkStatus: featuredNetworkStatus,
  } = useQuery(LIST_LATEST_MODELS_QUERY, {
    variables: {
      first: 4,
    },
  });

  const {
    data: listData,
    loading: listLoading,
    error: listError,
    fetchMore,
    networkStatus,
  } = useQuery(LIST_MODELS_QUERY, {
    variables: {
      first: elementsPerPage,
    },
  });

  const handleHighlight = (value: boolean) => setHighLightTop(value);

  useEffect(() => {
    if (isOnScreen && hasNextPage) {
      fetchMore({
        variables: {
          after: txs.length > 0 ? txs[txs.length - 1].cursor : undefined,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          const newData = fetchMoreResult.transactions.edges;

          const merged: IEdge[] =
            prev && prev.transactions?.edges ? prev.transactions.edges.slice(0) : [];
          for (let i = 0; i < newData.length; ++i) {
            if (!merged.find((el: IEdge) => el.node.id === newData[i].node.id)) {
              merged.push(newData[i]);
            }
          }
          const newResult = Object.assign({}, prev, {
            transactions: {
              edges: merged,
              pageInfo: fetchMoreResult.transactions.pageInfo,
            },
          });
          return newResult;
        },
      });
    }
  }, [ isOnScreen, txs ]);

  useEffect(() => {
    const asyncWrapper = async () => {
      const filtered: IEdge[] = [];
      await Promise.all(
        listData.transactions.edges.map(async (el: IEdge) => {
          const confirmed = await isTxConfirmed(el.node.id);
          const correctFee = parseInt(el.node.quantity.ar) === parseInt(MARKETPLACE_FEE);
          if (confirmed && correctFee) {
            filtered.push(el);
          }
        }),
      );
      setHasNextPage(listData.transactions.pageInfo.hasNextPage);
      setTxs(filtered);
    };

    if (listData && networkStatus === NetworkStatus.ready) {
      asyncWrapper();
    }
  }, [listData]);

  useEffect(() => {
    const asyncWrapper = async () => {
      if (data && featuredNetworkStatus === NetworkStatus.ready) {
        const filtered: IEdge[] = [];
        await Promise.all(
          data.transactions.edges.map(async (el: IEdge) => {
            const confirmed = await isTxConfirmed(el.node.id);
            const correctFee = parseInt(el.node.quantity.ar) === parseInt(MARKETPLACE_FEE);
            if (confirmed && correctFee) {
              filtered.push(el);
            }
          }),
        );
        setFeaturedTxs(filtered);
      }
    };
    asyncWrapper();
  }, [data]);

  useEffect(() => {
    const asyncWrapper = async () => {
      if (listData && filterValue) {
        const filtered: IEdge[] = [];
        await Promise.all(
          listData.transactions.edges.map(async (el: IEdge) => {
            const confirmed = await isTxConfirmed(el.node.id);
            const correctFee = parseInt(el.node.quantity.ar) === parseInt(MARKETPLACE_FEE);
            if (
              confirmed &&
              correctFee &&
              (findTag(el, 'modelName')?.includes(filterValue) || filterValue === '')
            ) {
              filtered.push(el);
            }
          }),
        );
        setTxs(filtered);
      }
    };
    asyncWrapper();
  }, [filterValue]);

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
        <Featured data={featuredTxs} loading={loading} error={error} />
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
              <Box
                height={'6px'}
                position='absolute'
                sx={{
                  width: hightlightTop ? '55px' : '119px',
                  left: hightlightTop ? '166px' : 0,
                  background: theme.palette.primary.main,
                  borderRadius: '8px',
                }}
              />
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
        <Stack spacing={4}>
          {txs.map((el, idx) => (
            <AiListCard
              model={el}
              key={el.node.id}
              index={idx}
              loading={listLoading}
              error={listError}
            />
          ))}
          <Box ref={target} sx={{ paddingBottom: '16px'}}></Box>
        </Stack>
      </Container>
      <Outlet />
    </>
  );
}
