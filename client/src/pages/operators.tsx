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
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import ReplayIcon from '@mui/icons-material/Replay';
import ModelCard from '@/components/model-card';
import useOnScreen from '@/hooks/useOnScreen';

const Operators = () => {
  const [txs, setTxs] = useState<IEdge[]>([]);
  const [ hasNextPage, setHasNextPage ] = useState(false);
  const target = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(target);
  const elementsPerPage = 5;

  const mockArray = genLoadingArray(6);

  const {
    data,
    loading,
    error,
    networkStatus,
    refetch,
    fetchMore,
  } = useQuery(LIST_MODELS_QUERY, {
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
              edges: [ ...prev.transactions.edges, ...fetchMoreResult.transactions.edges],
              pageInfo: fetchMoreResult.transactions.pageInfo,
            }
          });
          return newResult;
        }
      });
    }
  }, [isOnScreen, txs]);

  useEffect(() => {
    if (data && networkStatus === NetworkStatus.ready) {
      setHasNextPage(data.transactions.pageInfo.hasNextPage);
      setTxs(data.transactions.edges.filter((el: IEdge) => el.node.quantity.ar !== MARKETPLACE_FEE));
    }
  }, [ data ]);

  return <Container>
    <Box>
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
          txs.map((el: IEdge) => <ModelCard modelTx={el} key={el.node.id}/>)
        )}
        {
          loading && mockArray.map((val) =>
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
          )
        }
      </Stack>
      <div ref={target}></div>
    </Box>
  </Container>;
};

export default Operators;
