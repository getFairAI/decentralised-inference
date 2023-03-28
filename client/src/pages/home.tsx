import { NetworkStatus, useQuery } from '@apollo/client';
import {
  Box,
  Button,
  Container,
  MenuItem,
  Select,
  Stack,
  Typography,
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

export default function Home() {
  const [ hasNextPage, setHasNextPage ] = useState(false);
  const [ txs, setTxs ] = useState<IEdge[]>([]);
  const elementsPerPage = 5;
  const target = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(target);
  const filterValue = useContext(FilterContext);
  const [ hightlightTop, setHighLightTop ] = useState(false);

  const { data, loading, error } = useQuery(LIST_LATEST_MODELS_QUERY, {
    variables: {
      first: 4,
    }
  });

  const { data: listData, loading: listLoading, error: listError, fetchMore, networkStatus, refetch } = useQuery(LIST_MODELS_QUERY, {
    variables: {
      first: elementsPerPage
    }
  });

  const handleHighlight = (value: boolean) => setHighLightTop(value);
  
  useEffect(() => {
    if (isOnScreen && hasNextPage) {
      fetchMore({
        variables: {
          after: txs[txs.length - 1].cursor,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          const newData = fetchMoreResult.transactions.edges;
          
          const merged: IEdge[] = prev && prev.transactions?.edges ? prev.transactions.edges.slice(0) : [];
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
  }, [ useOnScreen, txs ]);

  useEffect(() => {
    if (listData && networkStatus === NetworkStatus.ready) {
      setHasNextPage(listData.transactions.pageInfo.hasNextPage);
      setTxs(listData.transactions.edges.filter((el: IEdge) => el.node.quantity.ar !== MARKETPLACE_FEE));
    }
  }, [listData]);

  useEffect(() => {
    if (listData && filterValue)
      setTxs(listData.transactions.edges.filter(((el: IEdge) => el.node.tags.find(tag => tag.name === 'Model-Name')?.value.includes(filterValue))));
  }, [ filterValue ]);

  return (
    <><Container
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
      <Typography sx={{
        fontStyle: 'normal',
        fontWeight: 300,
        fontSize: '30px',
        lineHeight: '41px',
        /* identical to box height */
        // background: 'linear-gradient(101.22deg, rgba(14, 255, 168, 0.58) 30.84%, #9747FF 55.47%, rgba(84, 81, 228, 0) 78.13%), linear-gradient(0deg, #FFFFFF, #FFFFFF)',
      }}>Choose your AI Model to start using.</Typography>
      <Featured data={data && data.transactions.edges || []} loading={loading} error={error} />
      <Box className={'filter-box'} sx={{ display: 'flex' }}>
        <Box display='flex' gap={'50px'}>
          <Typography sx={{
            fontStyle: 'normal',
            fongWeight: 500,
            fontSize: '30px',
            fontHeight: '41px',
          }}
            className={hightlightTop ? 'trending-text' : 'trending-text highlight'}
            onClick={() => handleHighlight(false)}
          >Trending</Typography>
          <Typography sx={{
            fontStyle: 'normal',
            fongWeight: 500,
            fontSize: '30px',
            fontHeight: '41px',
          }}
            className={hightlightTop ? 'trending-text highlight' : 'trending-text'}
            onClick={() => handleHighlight(true)}
          >Top</Typography>
          <div className='underline'></div>
          <Box flexGrow={1} />
        </Box>
        <Box flexGrow={1} />
        <Box display='flex' gap={'50px'}>
          <Select sx={{
            padding: '0px 8px',
            border: '1px solid transparent',
            borderRadius: '10px',
            textTransform: 'none',
            background: 'linear-gradient(#000, #000) padding-box, linear-gradient(170.66deg, rgba(14, 255, 168, 0.29) -38.15%, rgba(151, 71, 255, 0.5) 30.33%, rgba(84, 81, 228, 0) 93.33%) border-box',
            '& .MuiOutlinedInput-notchedOutline': {
              borderWidth: 0
            },
          }}
            value={'24h'}
          >
            <MenuItem value={'24h'}>
              <Typography sx={{
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '20px',
                lineHeight: '27px',
                textAlign: 'center',
                color: '#F4F4F4',
              }}>24H</Typography>
            </MenuItem>
            <MenuItem value={'week'}>
              <Typography>1 Week</Typography>
            </MenuItem>
          </Select>
          <Button sx={{
            borderRadius: '10px',
            border: '1px solid transparent',
            padding: '8px',
            textTransform: 'none',
            background: 'linear-gradient(#000, #000) padding-box, linear-gradient(170.66deg, rgba(14, 255, 168, 0.29) -38.15%, rgba(151, 71, 255, 0.5) 30.33%, rgba(84, 81, 228, 0) 93.33%) border-box'
          }}>
            <Typography sx={{
              padding: '0px 8px',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '20px',
              lineHeight: '27px',
              textAlign: 'center',
              color: '#F4F4F4',
            }}>
              View All
            </Typography>
          </Button>
        </Box>
      </Box>
      <Stack spacing={4}>
        {txs.map((el, idx) => <AiListCard model={el} key={el.node.id} index={idx} loading={listLoading} error={listError} />)}
        <div ref={target}></div>
      </Stack>
    </Container><Outlet /></>
  );
}
