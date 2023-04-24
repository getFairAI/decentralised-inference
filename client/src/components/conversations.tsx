import { APP_NAME, APP_VERSION, CONVERSATION_START, DEFAULT_TAGS, TAG_NAMES } from '@/constants';
import useOnScreen from '@/hooks/useOnScreen';
import { IEdge } from '@/interfaces/arweave';
import { NavigationState } from '@/interfaces/router';
import { QUERY_CONVERSATIONS } from '@/queries/graphql';
import arweave from '@/utils/arweave';
import { findTag } from '@/utils/common';
import { useQuery } from '@apollo/client';
import { Paper, Box, InputBase, Icon, Tooltip, IconButton, List, ListItemButton, Typography, useTheme } from '@mui/material';
import { useSnackbar } from 'notistack';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';

const Conversations = ({ currentConversationId, setCurrentConversationId, state, userAddr }: { currentConversationId: number, setCurrentConversationId: Dispatch<SetStateAction<number>>, state: NavigationState, userAddr: string }) => {
  const [ hasConversationNextPage, setHasConversationNextPage ] = useState(false);
  const [ conversationIds, setConversationIds ] = useState<number[]>([]);
  const [ filteredConversationIds, setFilteredConversationIds ] = useState<number[]>([]);
  const [filterConversations, setFilterConversations] = useState('');
  const conversationsTarget = useRef<HTMLDivElement>(null);
  const isConversationOnScreen = useOnScreen(conversationsTarget);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const { data: conversationsData, loading: conversationsLoading, fetchMore: conversationsFetchMore, refetch: conversationsRefetch } = useQuery(QUERY_CONVERSATIONS, {
    variables: {
      address: userAddr,
      tags: [
        ...DEFAULT_TAGS,
        {
          name: TAG_NAMES.operationName, values: [ CONVERSATION_START ]
        },
        {
          name: TAG_NAMES.modelTransaction, values: [ state.modelTransaction ]
        },
        { name: TAG_NAMES.modelName, values: [state.modelName] },
        { name: TAG_NAMES.modelCreator, values: [state.modelCreator] },
      ]
    },
    skip: !userAddr || !state
  });

  const createNewConversation = async (id: number) => {
    try {
      const tx = await arweave.createTransaction({ data: 'Conversation Start' });
      tx.addTag(TAG_NAMES.appName, APP_NAME);
      tx.addTag(TAG_NAMES.appVersion, APP_VERSION);
      tx.addTag(TAG_NAMES.operationName, CONVERSATION_START);
      tx.addTag(TAG_NAMES.modelName, state.modelName);
      tx.addTag(TAG_NAMES.modelCreator, state.modelCreator);
      tx.addTag(TAG_NAMES.modelTransaction, state.modelTransaction as string);
      tx.addTag(TAG_NAMES.unixTime, (Date.now() / 1000).toString());
      tx.addTag(TAG_NAMES.conversationIdentifier, `${id}`);
      const result = await window.arweaveWallet.dispatch(tx);
      console.log('conversation start' + result.id);
      conversationsRefetch();
    } catch (error) {
      enqueueSnackbar('Could not Start Conversation', { variant: 'error' });
    }
  };

  useEffect(() => {
    if (conversationsData && conversationsData.transactions.edges.length > 0) {
      setHasConversationNextPage(conversationsData.transactions.pageInfo.hasNextPage);
      const cids: number[] = conversationsData.transactions.edges.map((el: IEdge) => parseFloat(findTag(el, 'conversationIdentifier') as string ));
      setConversationIds(Array.from(new Set(cids)));
      setFilteredConversationIds(Array.from(new Set(cids)));
      setCurrentConversationId(Array.from(new Set(cids))[0]);
    } else if (conversationsData && conversationsData.transactions.edges.length === 0) {
      setHasConversationNextPage(false);
      // no conversations yet, create new
      createNewConversation(1);
      setCurrentConversationId(1);
    }
  }, [ conversationsData ]);

  useEffect(() => {
    if (isConversationOnScreen && hasConversationNextPage) {
      const conversations = conversationsData.transactions.edges;
      conversationsFetchMore({
        variables: {
          after: conversations.length > 0 ? conversations[conversations.length - 1].cursor : undefined,
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
  }, [ isConversationOnScreen, hasConversationNextPage ]);

  useEffect(() => {
    if (conversationIds && conversationIds.length > 0) {
      setFilteredConversationIds(
        conversationIds.filter((el) => `${el}`.includes(filterConversations)),
      );
    }
  }, [filterConversations]);

  useEffect(() => {
    if (currentConversationId) {
      setCurrentConversationId(currentConversationId);
    }
  }, [ currentConversationId ]);;

  const handleListItemClick = (cid: number) => {
    setCurrentConversationId(cid);
  };

  const handleAddConversation = async () => {
    const last: IEdge = conversationsData.transactions.edges[conversationsData.transactions.edges.length - 1];
    const cid = findTag(last, 'conversationIdentifier') as string;
    await createNewConversation(parseFloat(cid) + 1);
    setFilterConversations('');
    setCurrentConversationId(parseFloat(cid) + 1);
  };

  return (
    <Paper
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        height: '100%',
        // background: 'rgba(21, 21, 21, 1)',
        gap: '16px',
        background: theme.palette.secondary.main,
        // opacity: '0.3',
        borderRadius: ' 0px 20px 20px 0px',
      }}
      elevation={4}
    >
      <Box marginTop={'16px'}>
        <Box
          sx={{
            background: theme.palette.common.white,
            borderRadius: '30px',
            margin: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '3px 20px 3px 50px',
            alignItems: 'center',
          }}
        >
          <InputBase
            sx={{
              color: theme.palette.text.primary,
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: '16px',
            }}
            placeholder='Search Conversations...'
            value={filterConversations}
            onChange={(event) => setFilterConversations(event.target.value)}
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
        <IconButton
          onClick={handleAddConversation}
          sx={{
            margin: '0 20px',
            borderRadius: '30px',
            color: theme.palette.primary.contrastText,
          }}
        >
          <AddIcon />
        </IconButton>
      </Tooltip>
      <List
        sx={{
          display: 'flex',
          gap: '16px',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          padding: '0 20px',
        }}
      >
        {conversationsLoading && <div className='dot-pulse'></div>}
        {filteredConversationIds.map((cid, idx) => (
          <ListItemButton
            key={idx}
            alignItems='center'
            selected={cid === currentConversationId}
            onClick={() => handleListItemClick(cid)}
            sx={{
              background:
                theme.palette.mode === 'dark' ? '#434343' : theme.palette.primary.main,
              borderRadius: '21px',
              width: '100%',
              justifyContent: 'center',
              height: '91px',
              color: theme.palette.secondary.contrastText,
              '&.Mui-selected, &.Mui-selected:hover': {
                opacity: 1,
                backdropFilter: 'brightness(0.5)',
                color: theme.palette.primary.contrastText,
                // border: '4px solid transparent',
                // background: 'linear-gradient(#434343, #434343) padding-box, linear-gradient(170.66deg, rgba(14, 255, 168, 0.29) -38.15%, rgba(151, 71, 255, 0.5) 30.33%, rgba(84, 81, 228, 0) 93.33%) border-box',
              },
              '&:hover': {
                backdropFilter: 'brightness(0.5)',
              },
            }}
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
                color: 'inherit',
              }}
            >
              Conversation {cid}
            </Typography>
          </ListItemButton>
        ))}
        <Box sx={{paddingBottom: '8px'}} ref={conversationsTarget}></Box>
      </List>
      <Box flexGrow={1}></Box>
    </Paper>
  );
};

export default Conversations;