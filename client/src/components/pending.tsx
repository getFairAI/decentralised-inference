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
import { useEffect, useContext, useState, useRef, SyntheticEvent, forwardRef } from 'react';
import { Box, ClickAwayListener, Grow, IconButton, Paper, Popper, Typography } from '@mui/material';
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

const ContentForwardRef = forwardRef(function ContentForward() { return <Content />; });

const Pending = () => {
  const ITEM_HEIGHT = 64;

  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event | SyntheticEvent) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  // return focus to the button when we transitioned from !open -> open
  const prevOpen =  useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false && anchorRef.current) {
      anchorRef.current.focus();
    }

    prevOpen.current = open;
  }, [open]);

  return <>
    <IconButton
      ref={anchorRef}
      id="composition-button"
      aria-controls={open ? 'composition-menu' : undefined}
      aria-expanded={open ? 'true' : undefined}
      aria-haspopup="true"
      onClick={handleToggle}
    >
      <img src='./icon-empty-wallet.svg' />
    </IconButton>
    <Popper
      open={open}
      anchorEl={anchorRef.current}
      role={undefined}
      placement='bottom-end'
      transition
      disablePortal
    >
      {({ TransitionProps }) => (
        <Grow
          {...TransitionProps}
          style={{
            transformOrigin: 'left-bottom',
            minHeight: ITEM_HEIGHT * 3,
            maxHeight: ITEM_HEIGHT * 5,
            overflowY: 'auto'
          }}
        >
          <Paper>
            <ClickAwayListener onClickAway={handleClose}>
              <ContentForwardRef />
            </ClickAwayListener>
          </Paper>
        </Grow>
      )}
    </Popper>
  </>;
};

export default Pending;
