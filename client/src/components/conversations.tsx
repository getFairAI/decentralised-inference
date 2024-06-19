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
  Icon,
  Tooltip,
  List,
  ListItemButton,
  Typography,
  useTheme,
  Button,
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
import AddIcon from '@mui/icons-material/Add';
import { LoadingContainer } from '@/styles/components';
import DebounceIconButton from './debounce-icon-button';
import { Timeout } from 'react-number-format/types/types';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { EVMWalletContext } from '@/context/evm-wallet';
import { Query } from '@irys/query';
import { useLocation } from 'react-router-dom';

const ConversationElement = ({
  cid,
  currentConversationId,
  setCurrentConversationId,
}: {
  cid: number;
  currentConversationId: number;
  setCurrentConversationId: Dispatch<SetStateAction<number>>;
}) => {
  const theme = useTheme();
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
        borderRadius: '8px',
        border: 'solid 0.5px',
        width: '100%',
        justifyContent: 'center',
        height: '91px',
        color: theme.palette.neutral.main,
        borderColor: theme.palette.neutral.main,
        '&.Mui-selected, &.Mui-selected:hover': {
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          borderColor: theme.palette.text.primary,
        },
      }}
      className='plausible-event-name=Change+Conversation+Click'
    >
      <Typography
        sx={{
          fontStyle: 'normal',
          fontWeight: 700,
          fontSize: '15px',
          lineHeight: '20px',
          display: 'flex',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
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
        enqueueSnackbar('message', {});
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
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        // opacity: '0.3',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '16px',
          height: '100%',
        }}
      >
        <Box marginTop={'16px'} width={'100%'} padding={'0px 20px'}>
          <Box
            id={'searchConversation'}
            sx={{
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '3px 20px 3px 20px',
              alignItems: 'center',
              border: 'solid 0.5px',
              width: '100%',
            }}
          >
            <InputBase
              fullWidth
              sx={{
                color: theme.palette.text.primary,
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '16px',
              }}
              placeholder='Search Conversations...'
              onChange={handleFilterChange}
            />
            <Icon
              sx={{
                height: '30px',
              }}
            >
              <img src='./search-icon.svg'></img>
            </Icon>
          </Box>
        </Box>
        <Tooltip title='Start a new Conversation'>
          <DebounceIconButton
            id={'addConversation'}
            onClick={handleAddConversation}
            sx={{
              width: 'fit-content',
              borderRadius: '8px',
            }}
            className='plausible-event-name=Add+Conversation+Click'
          >
            <AddIcon />
          </DebounceIconButton>
        </Tooltip>
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
          }}
        >
          {conversationsLoading && <LoadingContainer theme={theme} className='dot-pulse' />}
          {filteredConversationIds.map((cid) => (
            <ConversationElement
              cid={cid}
              key={cid}
              currentConversationId={currentConversationId}
              setCurrentConversationId={setCurrentConversationId}
            />
          ))}
          <Box sx={{ paddingBottom: '8px' }}></Box>
        </List>
        <Box flexGrow={1}></Box>
        <Button
          variant='outlined'
          sx={{ mb: '8px', borderWidth: '0.5px' }}
          onClick={toggleDrawer}
          className='plausible-event-name=Hide+Conversation+Click'
        >
          <Typography>Hide</Typography>
        </Button>
      </Box>
    </Paper>
  );
};

export default Conversations;
