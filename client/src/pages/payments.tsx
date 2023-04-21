import PendingCard from '@/components/pending-card';
import { DEFAULT_TAGS, TAG_NAMES, MODEL_CREATION, SAVE_REGISTER_OPERATION, MODEL_FEE_PAYMENT_SAVE, MODEL_INFERENCE_RESPONSE, MODEL_INFERENCE_REQUEST, N_PREVIOUS_BLOCKS } from '@/constants';
import { WalletContext } from '@/context/wallet';
import useOnScreen from '@/hooks/useOnScreen';
import { IEdge } from '@/interfaces/arweave';
import { QUERY_USER_INTERACTIONS } from '@/queries/graphql';
import arweave from '@/utils/arweave';
import { useQuery } from '@apollo/client';
import { Box, Typography, Button, Backdrop, CircularProgress, useTheme, Container, Stack } from '@mui/material';
import { useContext, useState, useEffect, useRef } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import _ from 'lodash';

const Payments = () => {
  const elementsPerPage = 10;
  const { currentAddress } = useContext(WalletContext);
  const [minHeight, setMinHeight] = useState(0);
  const [hasNextPage, setHasNextPage ] = useState(false);
  const theme = useTheme();
  const target = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(target);


  const { data, previousData, error, loading, refetch, fetchMore } = useQuery(QUERY_USER_INTERACTIONS, {
    variables: {
      address: currentAddress,
      tags: [
        ...DEFAULT_TAGS,
        {
          name: TAG_NAMES.operationName,
          values: [
            MODEL_CREATION,
            SAVE_REGISTER_OPERATION,
            MODEL_FEE_PAYMENT_SAVE,
            MODEL_INFERENCE_RESPONSE,
            MODEL_INFERENCE_REQUEST,
          ],
        },
      ],
      minBlockHeight: 0,
      first: elementsPerPage,
    },
    skip: !currentAddress || minHeight <= 0,
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    const asyncWrapper = async () => {
      const currentHeight = (await arweave.blocks.getCurrent()).height;
      setMinHeight(currentHeight - N_PREVIOUS_BLOCKS);
    };
    asyncWrapper();
  });

  useEffect(() => {
    if (data && !_.isEqual(data, previousData)) {
      setHasNextPage(data.transactions.pageInfo.hasNextPage);
    }
  }, [ data ]);

  useEffect(() => {
    if (isOnScreen && hasNextPage) {
      const txs = data.transactions.edges;
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
  }, [ isOnScreen, hasNextPage ]);

  const refreshClick = () => {
    refetch();
  };

  return (
    <Container>
      {error ? (
        <Box display={'flex'} flexDirection={'column'} alignItems={'center'} padding={'16px'}>
          <Typography textAlign={'center'}>
            There Was a Problem Fetching previous payments...
          </Typography>
        </Box>
      ) : data && data.transactions.edges.length === 0 ? (
        <Box>
          <Typography textAlign={'center'}>You Have No Pending Transactions</Typography>
        </Box>
      ) : (
        <>
          <Box display={'flex'} justifyContent={'center'} padding={'8px'}>
            <Button onClick={refreshClick} endIcon={<RefreshIcon />} variant='outlined'>
              <Typography>Refresh</Typography>
            </Button>
          </Box>
          <Stack spacing={2}>
              {data && data.transactions.edges.map((tx: IEdge) => <PendingCard tx={tx} key={tx.node.id} autoRetry={false}/>)}
          </Stack>
        </>
      )}
      {loading && (
        <Backdrop
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            borderRadius: '23px',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
          }}
          open={true}
        >
          <Typography variant='h2' color={theme.palette.primary.main}>
            Fetching Latest Payments...
          </Typography>
          <CircularProgress color='primary' />
        </Backdrop>
      )}
      <Box ref={target} sx={{ paddingBottom: '16px'}}></Box>
    </Container>
  );
};

export default Payments;