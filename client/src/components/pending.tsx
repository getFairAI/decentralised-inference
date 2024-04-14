/*
 * Fair Protocol, open source decentralised inference marketplace for artificial intelligence.
 * Copyright (C) 2023 Fair Protocol
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 */

import {
  TAG_NAMES,
  INFERENCE_PAYMENT,
  MODEL_CREATION_PAYMENT,
  REGISTER_OPERATION,
  SCRIPT_CREATION_PAYMENT,
  U_CONTRACT_ID,
} from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { FIND_BY_TAGS } from '@/queries/graphql';
import { useQuery } from '@apollo/client';
import {
  useEffect,
  useContext,
  useState,
  useRef,
  SyntheticEvent,
  forwardRef,
  RefObject,
  SetStateAction,
  Dispatch,
} from 'react';
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
import { EVMWalletContext } from '@/context/evm-wallet';

const Content = ({
  scrollableRef,
  setOpen,
}: {
  scrollableRef: RefObject<HTMLElement>;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const elementsPerPage = 10;
  const { currentAddress } = useContext(EVMWalletContext);
  const theme = useTheme();
  const { isAtBottom } = useScroll(scrollableRef);
  const navigate = useNavigate();

  const { data, error, loading, refetch } = useQuery(FIND_BY_TAGS, {
    variables: {
      tags: [
        {
          name: TAG_NAMES.sequencerOwner,
          values: [currentAddress],
        },
        {
          name: TAG_NAMES.contract,
          values: [U_CONTRACT_ID],
        },
        {
          name: TAG_NAMES.operationName,
          values: [
            MODEL_CREATION_PAYMENT,
            SCRIPT_CREATION_PAYMENT,
            REGISTER_OPERATION,
            INFERENCE_PAYMENT,
          ],
        },
      ],
      first: elementsPerPage,
    },
    skip: !currentAddress,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  const refreshClick = () => {
    refetch();
  };

  const handleViewAll = () => {
    setOpen(false);
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
          <Zoom in={isAtBottom} timeout={500} mountOnEnter unmountOnExit>
            <Box
              display={'flex'}
              justifyContent={'center'}
              padding={'8px'}
              sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
            >
              <Fab
                variant='extended'
                size='medium'
                color='primary'
                aria-label='view all'
                onClick={handleViewAll}
              >
                <Typography>View All</Typography>
              </Fab>
            </Box>
          </Zoom>
        </>
      )}
      {loading && (
        <Backdrop
          sx={{
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

const ContentForwardRef = forwardRef(function ContentForward(
  {
    scrollableRef,
    setOpen,
  }: { scrollableRef: RefObject<HTMLElement>; setOpen: Dispatch<SetStateAction<boolean>> },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ref,
) {
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
        <img src='./icon-empty-wallet.svg' width={'27px'} height={'27px'} />
      </IconButton>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        placement='bottom-end'
        transition
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
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
                <ContentForwardRef scrollableRef={scrollableRef} setOpen={setOpen} />
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};

export default Pending;
