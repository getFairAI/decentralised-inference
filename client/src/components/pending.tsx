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
import { IEdge } from '@/interfaces/arweave';
import { QUERY_USER_INTERACTIONS } from '@/queries/graphql';
import arweave from '@/utils/arweave';
import { useQuery } from '@apollo/client';
import { useEffect, useContext, useState, useRef, SyntheticEvent, forwardRef } from 'react';
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  ClickAwayListener,
  Grow,
  IconButton,
  Paper,
  Popper,
  Typography,
  useTheme,
} from '@mui/material';
import PendingCard from './pending-card';
import RefreshIcon from '@mui/icons-material/Refresh';

const Content = () => {
  const elementsPerPage = 10;
  const { currentAddress } = useContext(WalletContext);
  const [minHeight, setMinHeight] = useState(0);
  const theme = useTheme();

  const { data, error, loading, refetch } = useQuery(QUERY_USER_INTERACTIONS, {
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
    fetchPolicy: 'no-cache',
  });

  useEffect(() => {
    const asyncWrapper = async () => {
      const currentHeight = (await arweave.blocks.getCurrent()).height;
      setMinHeight(currentHeight - N_PREVIOUS_BLOCKS);
    };
    asyncWrapper();
  });

  const refreshClick = () => {
    refetch();
  };

  return (
    <>
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

          {data &&
            data.transactions.edges.map((tx: IEdge) => <PendingCard tx={tx} key={tx.node.id} />)}
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
    </>
  );
};

const ContentForwardRef = forwardRef(function ContentForward() {
  return <Content />;
});

const Pending = () => {
  const ITEM_HEIGHT = 64;

  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event | SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }

    setOpen(false);
  };

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false && anchorRef.current) {
      anchorRef.current.focus();
    }

    prevOpen.current = open;
  }, [open]);

  return (
    <>
      <IconButton
        ref={anchorRef}
        id='composition-button'
        aria-controls={open ? 'composition-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup='true'
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
              overflowY: 'auto',
              minWidth: '200px',
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
    </>
  );
};

export default Pending;