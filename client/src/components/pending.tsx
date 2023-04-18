import {
  DEFAULT_TAGS,
  MODEL_CREATION,
  MODEL_FEE_PAYMENT_SAVE,
  MODEL_INFERENCE_REQUEST,
  MODEL_INFERENCE_RESPONSE,
  N_PREVIOUS_BLOCKS,
  SAVE_REGISTER_OPERATION,
  TAG_NAMES,
} from '@/constants';
import { WalletContext } from '@/context/wallet';
import useOnScreen from '@/hooks/useOnScreen';
import { IEdge } from '@/interfaces/arweave';
import { QUERY_USER_INTERACTIONS } from '@/queries/graphql';
import arweave from '@/utils/arweave';
import { useQuery } from '@apollo/client';
import { useEffect, useContext, useState, useRef, MouseEvent } from 'react';
import { Badge, Box, IconButton, Menu, Typography } from '@mui/material';
import PendingCard from './pending-card';

const Content = () => {
  const elementsPerPage = 5;
  const { currentAddress } = useContext(WalletContext);
  const [minHeight, setMinHeight] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [lastProcessedIdx, setLastProcessedIdx] = useState(0);
  const target = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(target);

  const { data, error, loading, fetchMore } = useQuery(QUERY_USER_INTERACTIONS, {
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
  });

  useEffect(() => {
    const asyncWrapper = async () => {
      const currentHeight = (await arweave.blocks.getCurrent()).height;
      setMinHeight(currentHeight - N_PREVIOUS_BLOCKS);
    };
    asyncWrapper();
  });

  useEffect(() => {
    if (isOnScreen && hasNextPage && lastProcessedIdx) {
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
  }, [useOnScreen, lastProcessedIdx]);

  /**
   * @description Effect that runs on data changes
   */
  useEffect(() => {
    if (!data) return;
    // pick only transactions from last index to avoid duplicate requests
    setHasNextPage(data.transactions.pageInfo.hasNextPage);
    setLastProcessedIdx(data.transactions.edges.length - 1);
  }, [data]);

  return (
    <>
      {error ? (
        <Box display={'flex'} flexDirection={'column'} alignItems={'center'}>
          <Typography textAlign={'center'}>
            There Was a Problem Fetching previous payments...
          </Typography>
        </Box>
      ) : loading ? (
        <Box display={'flex'} flexDirection={'column'} alignItems={'center'}>
          <Typography textAlign={'center'}>Fetching Latest Payments</Typography>
          <div className='dot-pulse'></div>
          <div ref={target}></div>
        </Box>
      ) : data && data.transactions.edges.length === 0 ? (
        <Box>
          <Typography textAlign={'center'}>You Have No Pending Transactions</Typography>
        </Box>
      ) : (
        data && data.transactions.edges.map((tx: IEdge) => <PendingCard tx={tx} key={tx.node.id} />)
      )}
      <div ref={target}></div>
    </>
  );
};

const Pending = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [badgeInvisible /* setBadgeInvisible */] = useState(true);
  const ITEM_HEIGHT = 64;

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <>
      <IconButton
        aria-label='more'
        id='long-button'
        aria-controls={anchorEl ? 'long-menu' : undefined}
        aria-expanded={anchorEl ? 'true' : undefined}
        aria-haspopup='true'
        onClick={handleClick}
      >
        <Badge color='error' variant='dot' invisible={badgeInvisible} overlap='circular'>
          <img src='./icon-empty-wallet.svg' />
        </Badge>
      </IconButton>
      <Menu
        id='long-menu'
        MenuListProps={{
          'aria-labelledby': 'long-button',
        }}
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={handleClose}
        PaperProps={{
          style: {
            minHeight: ITEM_HEIGHT * 3,
            maxHeight: ITEM_HEIGHT * 5,
          },
        }}
      >
        <Content />
      </Menu>
    </>
  );
};

export default Pending;
