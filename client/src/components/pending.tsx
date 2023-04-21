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
import { useEffect, useContext, useState, useRef, SyntheticEvent, forwardRef, RefObject, SetStateAction, Dispatch } from 'react';
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  ClickAwayListener,
  Fab,
  Grow,
  IconButton,
  Paper,
  Popper,
  Typography,
  Zoom,
  useTheme,
} from '@mui/material';
import PendingCard from './pending-card';
import RefreshIcon from '@mui/icons-material/Refresh';
import useScroll from '@/hooks/useScroll';
import { useNavigate } from 'react-router-dom';

const Content = ({ scrollableRef, setOpen }: { scrollableRef: RefObject<HTMLElement>, setOpen: Dispatch<SetStateAction<boolean>> }) => {
  const elementsPerPage = 10;
  const { currentAddress } = useContext(WalletContext);
  const [minHeight, setMinHeight] = useState(0);
  const theme = useTheme();
  const isAtBottom = useScroll(scrollableRef);
  const navigate = useNavigate();

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
    fetchPolicy: 'network-only',
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

  const handleViewAll = () => {
    setOpen(false);
    navigate('/payments');
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

          {
            data && data.transactions.edges.map((tx: IEdge) => <PendingCard tx={tx} key={tx.node.id} autoRetry={true} />)
          }
          <Zoom
            in={isAtBottom}
            timeout={500}
            mountOnEnter
            unmountOnExit
          >
            <Box display={'flex'} justifyContent={'center'} padding={'8px'}
              sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
            >
              <Fab variant="extended" size="medium" color="primary" aria-label="view all" onClick={handleViewAll}>
                <Typography>View All</Typography>
              </Fab>
            </Box>
          </Zoom> 
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ContentForwardRef = forwardRef(function ContentForward({ scrollableRef, setOpen }: { scrollableRef: RefObject<HTMLElement>, setOpen: Dispatch<SetStateAction<boolean>> }, _ref) {
  return <Content scrollableRef={scrollableRef} setOpen={setOpen} />;
});

const Pending = () => {
  const ITEM_HEIGHT = 64;

  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const scrollableRef = useRef<HTMLDivElement>(null);

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
            ref={scrollableRef}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <ContentForwardRef scrollableRef={scrollableRef} setOpen={setOpen}/>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};

export default Pending;
