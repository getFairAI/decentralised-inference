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
  textContentType,
  TAG_NAMES,
  INFERENCE_REQUEST,
  PROTOCOL_VERSION,
  PROTOCOL_NAME,
} from '@/constants';
import { QUERY_CONVERSATIONS_TX_ID } from '@/queries/graphql';
import { getTextData } from '@/utils/arweave';
import { useLazyQuery } from '@apollo/client';
import {
  Paper,
  Box,
  InputBase,
  Tooltip,
  List,
  ListItemButton,
  Typography,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { LoadingContainer, StyledMuiButton } from '@/styles/components';
import { Timeout } from 'react-number-format/types/types';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { EVMWalletContext } from '@/context/evm-wallet';
import { Query } from '@irys/query';
import { useLocation } from 'react-router-dom';

// icons
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import { motion } from 'framer-motion';

const ConversationElement = ({
  cid,
  currentConversationId,
  setCurrentConversationId,
}: {
  cid: number;
  currentConversationId: number;
  setCurrentConversationId: Dispatch<SetStateAction<number>>;
}) => {
  const handleListItemClick = useCallback(
    () => setCurrentConversationId(cid),
    [setCurrentConversationId],
  );

  return (
    <ListItemButton
      alignItems='center'
      selected={cid === currentConversationId}
      onClick={handleListItemClick}
      sx={{
        flexGrow: 0,
        borderRadius: '10px',
        width: '100%',
        justifyContent: 'center',
        height: '60px',
        fontWeight: 600,
        color: 'rgb(70,70,70)',
        boxShadow: '0px 0px 6px rgba(0,0,0,0.2)',
        backgroundColor: 'white !important',
        transition: '0.2s all',
        '&.Mui-selected': {
          backgroundColor: '#3aaaaa !important',
          borderRadius: '30px',
          color: '#fff',
        },
        '&:hover': {
          transform: 'translateX(8px)',
          backgroundColor: '#43bfbf !important',
          color: '#fff',
        },
      }}
      className='plausible-event-name=Change+Conversation+Click'
    >
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          textAlign: 'center',
          gap: 1,
        }}
      >
        <ChatBubbleRoundedIcon style={{ width: 18 }} />
        Conversation {cid}
      </Typography>
    </ListItemButton>
  );
};

const Conversations = ({
  currentConversationId,
  setCurrentConversationId,
  userAddr,
  drawerOpen,
  setDrawerOpen,
  setLayoverOpen,
}: {
  currentConversationId: number;
  setCurrentConversationId: Dispatch<SetStateAction<number>>;
  userAddr: string;
  drawerOpen: boolean;
  setDrawerOpen: Dispatch<SetStateAction<boolean>>;
  setLayoverOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const [conversationIds, setConversationIds] = useState<number[]>([]);
  const [filteredConversationIds, setFilteredConversationIds] = useState<number[]>([]);
  const [filterConversations, setFilterConversations] = useState('');
  const [conversationsLoading, setConversationsLoading] = useState(false);
  /* const conversationsTarget = useRef<HTMLDivElement>(null); */
  /* const isConversationOnScreen = useOnScreen(conversationsTarget); */
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const { startConversation, currentAddress } = useContext(EVMWalletContext);
  const { state } = useLocation();
  const [getConversationHistory] = useLazyQuery(QUERY_CONVERSATIONS_TX_ID);
  const { height } = useWindowDimensions();
  const [chatMaxHeight, setChatMaxHeight] = useState('100%');

  const createNewConversation = async (id: number) => {
    try {
      const result = await startConversation(state.solution.node.id, id.toString());

      if (!result) {
        // user rejected the wallet extension signature permission
        enqueueSnackbar(
          'You chose to reject the request, or an error occurred. The feature you were trying to access might get disabled.',
          {
            variant: 'warning',
            autoHideDuration: 12000,
            style: { fontWeight: 700 },
          },
        );
      }

      setConversationIds([id, ...conversationIds]);
      setFilteredConversationIds([id, ...conversationIds]);
      setCurrentConversationId(id);
    } catch (error) {
      enqueueSnackbar('Could not Start Conversation', { variant: 'error' });
    }
  };

  useEffect(() => {
    (async () => {
      if (currentAddress) {
        setConversationsLoading(true);
        const irysQquery = new Query();
        const results = await irysQquery
          .search('irys:transactions')
          .tags([
            {
              name: TAG_NAMES.protocolName,
              values: [PROTOCOL_NAME],
            },
            {
              name: TAG_NAMES.protocolVersion,
              values: [PROTOCOL_VERSION],
            },
            {
              name: TAG_NAMES.operationName,
              values: ['Conversation Start'],
            },
            {
              name: TAG_NAMES.solutionTransaction,
              values: [state.solution.node.id],
            },
          ])
          .from([currentAddress]);

        if (results.length === 0) {
          setLayoverOpen(true);
          // no conversations yet, create new
          await createNewConversation(1);
          setCurrentConversationId(1);
          setConversationIds([1]);
          setFilteredConversationIds([1]);
          setLayoverOpen(false);
        } else {
          const cids = Array.from(
            new Set(
              results.map((el) =>
                parseFloat(
                  el.tags.find((tag) => tag.name === 'Conversation-Identifier')?.value as string,
                ),
              ),
            ),
          );
          setConversationIds(cids);
          setFilteredConversationIds(cids);
          setCurrentConversationId(cids[cids.length - 1]);
        }
        setConversationsLoading(false);
      }
    })();
  }, [currentAddress]);

  useEffect(() => {
    (async () => {
      if (conversationIds && conversationIds.length > 0) {
        const filteredIds = [];
        let hasMatch = false;
        for (const el of conversationIds) {
          hasMatch = false;
          const includesFilter =
            filterConversations.trim() === '' || filterConversations.includes(`${el}`);
          if (!includesFilter) {
            const checkTransactions = await getConversationHistory({
              variables: {
                address: userAddr,
                first: 100,
                tags: [
                  {
                    name: TAG_NAMES.protocolName,
                    values: [PROTOCOL_NAME],
                  },
                  {
                    name: TAG_NAMES.protocolVersion,
                    values: [PROTOCOL_VERSION],
                  },
                  {
                    name: TAG_NAMES.operationName,
                    values: [INFERENCE_REQUEST],
                  },
                  {
                    name: TAG_NAMES.contentType,
                    values: [textContentType],
                  },
                  {
                    name: TAG_NAMES.conversationIdentifier,
                    values: [el.toString()],
                  },
                  {
                    name: TAG_NAMES.solutionTransaction,
                    values: [state.solution.node.id],
                  },
                ],
              },
            });
            for (const item of checkTransactions.data.transactions.edges) {
              const txData = await getTextData(item.node.id);
              if (txData.toLowerCase().includes(filterConversations.toLowerCase())) {
                hasMatch = true;
                break;
              }
            }
          }

          if (includesFilter || hasMatch) {
            filteredIds.push(el);
          }
        }
        setFilteredConversationIds(filteredIds);
      }
    })();
  }, [filterConversations]);

  useEffect(() => {
    if (currentConversationId) {
      setCurrentConversationId(currentConversationId);
    }
  }, [currentConversationId]);

  const handleAddConversation = useCallback(async () => {
    setLayoverOpen(true);
    const last = Math.max(...conversationIds);
    await createNewConversation(last + 1);
    setFilterConversations('');
    setCurrentConversationId(last + 1);
    setLayoverOpen(false);
  }, [setFilterConversations, setCurrentConversationId, createNewConversation]);

  let keyTimeout: Timeout;
  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    clearTimeout(keyTimeout);
    keyTimeout = setTimeout(() => {
      setFilterConversations(event.target.value);
    }, 500);
  };

  useEffect(() => {
    const currHeaderHeight = document.querySelector('header')?.clientHeight as number;
    const searchbarHeight = document.querySelector('#searchConversation')?.clientHeight as number;
    const addButtonHeight = document.querySelector('#addConversation')?.clientHeight as number;
    const margins = 72; // 16 from search, 16 from button and 8 from bottom +16px * 3 for gaps
    setChatMaxHeight(
      `${height - (currHeaderHeight + searchbarHeight + addButtonHeight + margins)}px`,
    );
  }, [height]);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen(!drawerOpen);
  }, [drawerOpen, setDrawerOpen]);

  return (
    <Paper
      sx={{
        height: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <div className='flex w-full justify-center px-2 mb-2 mt-2'>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '23px',
              lineHeight: '31px',
              display: 'flex',
              gap: 1,
              alignItems: 'center',
            }}
          >
            <ChatBubbleRoundedIcon style={{ color: '#3aaaaa', width: 20 }} />
            Conversations
          </Typography>
        </div>
        <Box marginTop={'16px'} width={'100%'} padding={'0px 20px'}>
          <Box
            id={'searchConversation'}
            sx={{
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '5px 12px',
              alignItems: 'center',
              backgroundColor: '#fff',
              width: '100%',
            }}
          >
            <InputBase
              fullWidth
              color='primary'
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 400,
                fontSize: '14px',
              }}
              placeholder='Search...'
              onChange={handleFilterChange}
            />
            <img src='./search-icon.svg' style={{ width: '18px' }}></img>
          </Box>
        </Box>

        <List
          sx={{
            display: 'flex',
            gap: '16px',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            paddingLeft: '20px',
            paddingRight: '20px',
            overflow: 'auto',
            maxHeight: chatMaxHeight,
            flexFlow: 'wrap',
            marginTop: '20px',
          }}
        >
          {conversationsLoading && <LoadingContainer theme={theme} className='dot-pulse' />}
          {filteredConversationIds
            .map((cid) => (
              <ConversationElement
                cid={cid}
                key={cid}
                currentConversationId={currentConversationId}
                setCurrentConversationId={setCurrentConversationId}
              />
            ))
            .sort()}
          <Box sx={{ paddingBottom: '8px' }}></Box>
        </List>

        <div
          id={'addConversation'}
          onClick={handleAddConversation}
          className='plausible-event-name=Add+Conversation+Click'
        >
          <Tooltip title='Start a new Conversation'>
            <StyledMuiButton className='secondary'>
              <AddIcon style={{ width: '16px' }} />
              Start New
            </StyledMuiButton>
          </Tooltip>
        </div>

        <Box flexGrow={1}></Box>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{
              opacity: 1,
              x: 0,
              transition: { delay: 0.3, duration: 0.5, type: 'spring' },
            }}
            className='w-full flex justify-end p-5'
          >
            <Tooltip title={'Hide the conversations drawer'}>
              <StyledMuiButton
                onClick={toggleDrawer}
                className='plausible-event-name=Hide+Conversation+Click secondary'
              >
                <ArrowBackIosNewRoundedIcon style={{ width: 18 }} />
                Hide
              </StyledMuiButton>
            </Tooltip>
          </motion.div>
        )}
      </Box>
    </Paper>
  );
};

export default Conversations;
