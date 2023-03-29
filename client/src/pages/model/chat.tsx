import {
  Box,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  Icon,
  IconButton,
  InputBase,
  List,
  ListItemButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { NetworkStatus, useLazyQuery } from '@apollo/client';
import { ChangeEvent, useContext, useEffect, useRef, useState } from 'react';
import {
  APP_VERSION,
  DEFAULT_TAGS,
  NODE1_BUNDLR_URL,
  INFERENCE_PERCENTAGE_FEE,
  TAG_NAMES,
  MODEL_INFERENCE_REQUEST,
  MODEL_INFERENCE_RESPONSE,
} from '@/constants';
import {
  QUERY_CHAT_REQUESTS,
  QUERY_CHAT_REQUESTS_POLLING,
  QUERY_CHAT_RESPONSES,
  QUERY_CHAT_RESPONSES_POLLING,
} from '@/queries/graphql';
import { IEdge, ITransactions } from '@/interfaces/arweave';
import Transaction from 'arweave/node/lib/transaction';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AddIcon from '@mui/icons-material/Add';
import { useSnackbar } from 'notistack';
import { WebBundlr } from 'bundlr-custom';
import { WalletContext } from '@/context/wallet';
import usePrevious from '@/hooks/usePrevious';
import arweave, { getData } from '@/utils/arweave';
import { findTag, genLoadingArray } from '@/utils/common';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import _ from 'lodash';
import useScrollLock from '@/hooks/useScrollLock';
import '@/styles/main.css';

interface Message {
  id: string;
  msg: string;
  type: 'response' | 'request';
  timestamp: number;
  cid?: string;
}

const Chat = () => {
  const { address } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { currentAddress: userAddr } = useContext(WalletContext);
  const previousAddr = usePrevious<string>(userAddr);
  const [messages, setMessages] = useState<Message[]>([]);
  const [polledMessages, setPolledMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [pendingTxs] = useState<Transaction[]>([]);
  const [conversationIds, setConversationIds] = useState<string[]>([]);
  const [filteredConversationIds, setFilteredConversationIds] = useState<string[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { height } = useWindowDimensions();
  const [chatMaxHeight, setChatMaxHeight] = useState('100%');
  const mockArray = genLoadingArray(5);
  const { enqueueSnackbar } = useSnackbar();
  const elementsPerPage = 5;
  const scrollableRef = useRef<HTMLDivElement>(null);
  const setIsLocked = useScrollLock(scrollableRef);
  const [filterConversations, setFilterConversations] = useState('');

  const [
    getChatRequests,
    {
      data: requestsData,
      loading: requestsLoading,
      error: requestError,
      networkStatus: requestNetworkStatus,
      fetchMore: requestFetchMore,
    },
  ] = useLazyQuery(QUERY_CHAT_REQUESTS);
  const [
    getChatResponses,
    {
      data: responsesData,
      error: responseError,
      loading: responsesLoading,
      networkStatus: responseNetworkStatus,
      fetchMore: responsesFetchMore,
    },
  ] = useLazyQuery(QUERY_CHAT_RESPONSES);

  const [pollRequests, { data: requestsPollingData, stopPolling: stopRequestPolling }] =
    useLazyQuery(QUERY_CHAT_REQUESTS_POLLING, {
      fetchPolicy: 'no-cache',
      nextFetchPolicy: 'no-cache',
    });
  const [pollResponses, { data: responsesPollingData, stopPolling: stopResponsePolling }] =
    useLazyQuery(QUERY_CHAT_RESPONSES_POLLING, {
      fetchPolicy: 'no-cache',
      nextFetchPolicy: 'no-cache',
    });

  useEffect(() => {
    setChatMaxHeight(`${height - 94}px`);
    setIsLocked(true);
  }, [height]);

  useEffect(() => {
    if (previousAddr && previousAddr !== userAddr) {
      navigate(0);
    }
  }, [userAddr]);

  useEffect(() => {
    if (state && userAddr) {
      const commonTags = [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.modelName, values: [state.modelName] },
        { name: TAG_NAMES.modelCreator, values: [state.modelCreator] },
      ];
      const tagsRequests = [...commonTags, { name: TAG_NAMES.operationName, values: [ MODEL_INFERENCE_REQUEST ]}];
      getChatRequests({
        variables: {
          first: elementsPerPage,
          tagsRequests,
          address: userAddr,
          adfter: null,
        },
        notifyOnNetworkStatusChange: true,
      });
    }
  }, [state, userAddr]);

  useEffect(() => {
    if (requestsData && requestNetworkStatus === NetworkStatus.ready) {
      const cids: string[] = requestsData.transactions.edges.map(
        (el: IEdge) =>
         findTag(el, 'conversationIdentifier'),
      );
      const uniqueCids = Array.from(new Set(cids));
      uniqueCids.sort((a: string, b: string) => {
        const numberA = parseInt(a?.split('-')[1]);
        const numberB = parseInt(b?.split('-')[1]);

        return numberA < numberB ? -1 : 1;
      });
      setConversationIds(uniqueCids);
      setFilteredConversationIds(uniqueCids);
      setCurrentConversationId(uniqueCids[uniqueCids.length - 1]);

      const commonTags = [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.modelName, values: [state.modelName] },
        { name: TAG_NAMES.modelCreator, values: [state.modelCreator] },
      ];
      const tagsResponses = [
        ...commonTags,
        { name: TAG_NAMES.operationName, values: [ MODEL_INFERENCE_RESPONSE ] },
        // { name: 'Conversation-Identifier', values: [currentConversationId] },
        { name: TAG_NAMES.modelUser, values: [userAddr] },
        {
          name: TAG_NAMES.requestTransaction,
          values: requestsData.transactions.edges.map((el: IEdge) => el.node.id),
        }, // slice from end to get latest requests
      ];
      const owners = Array.from(
        new Set(
          requestsData.transactions.edges.map(
            (el: IEdge) => findTag(el, 'modelOperator'),
          ),
        ),
      );
      getChatResponses({
        variables: {
          first: elementsPerPage,
          after: null,
          tagsResponses,
          owners,
        },
        notifyOnNetworkStatusChange: true,
      });

      if (requestsData?.transactions?.pageInfo?.hasNextPage) {
        requestFetchMore({
          variables: {
            after:
              requestsData.transactions.edges[requestsData.transactions.edges.length - 1].cursor,
          },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult) return prev;
            const newData = fetchMoreResult.transactions.edges;
            newData.sort((a: IEdge, b: IEdge) => {
              const aTimestamp =
                parseInt(findTag(a, 'unixTime') || '') ||
                a.node.block?.timestamp ||
                Date.now() / 1000;
              const bTimestamp =
                parseInt(findTag(b, 'unixTime') || '') ||
                b.node.block?.timestamp ||
                Date.now() / 1000;

              return aTimestamp - bTimestamp;
            });

            const merged = prev && prev.transactions?.edges ? prev.transactions.edges.slice(0) : [];
            for (let i = 0; i < newData.length; ++i) {
              if (!merged.find((el: IEdge) => el.node.id === newData[i].node.id)) {
                merged.push(newData[i]);
              }
            }
            const newResult: { transactions: ITransactions } = Object.assign({}, prev, {
              transactions: {
                edges: merged,
                pageInfo: fetchMoreResult.transactions.pageInfo,
              },
            });

            return newResult;
          },
        });
      } else {
        stopRequestPolling();
        // start polling
        const commonTags = [
          ...DEFAULT_TAGS,
          { name: TAG_NAMES.modelName, values: [state.modelName] },
          { name: TAG_NAMES.modelCreator, values: [state.modelCreator] },
        ];

        const tagsRequests = [...commonTags, { name: TAG_NAMES.operationName, values: [ MODEL_INFERENCE_REQUEST ]}];

        pollRequests({
          variables: {
            first: elementsPerPage,
            tagsRequests,
            address: userAddr,
          },
          pollInterval: 5000,
        });
      }
    }
  }, [requestsData]);

  useEffect(() => {
    if (responsesData && responseNetworkStatus === NetworkStatus.ready) {
      reqData();
      if (responsesData.transactions?.pageInfo?.hasNextPage) {
        responsesFetchMore({
          variables: {
            after:
              responsesData.transactions.edges[responsesData.transactions.edges.length - 1].cursor,
          },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult) return prev;
            const newData = fetchMoreResult.transactions.edges;
            newData.sort((a: IEdge, b: IEdge) => {
              const aTimestamp =
                parseInt(findTag(a, 'unixTime') || '') ||
                a.node.block?.timestamp ||
                Date.now() / 1000;
              const bTimestamp =
                parseInt(findTag(b, 'unixTime') || '') ||
                b.node.block?.timestamp ||
                Date.now() / 1000;

              return aTimestamp - bTimestamp;
            });

            const merged = prev && prev.transactions?.edges ? prev.transactions.edges.slice(0) : [];
            for (let i = 0; i < newData.length; ++i) {
              if (!merged.find((el: IEdge) => el.node.id === newData[i].node.id)) {
                merged.push(newData[i]);
              }
            }
            const newResult: { transactions: ITransactions } = Object.assign({}, prev, {
              transactions: {
                edges: merged,
                pageInfo: fetchMoreResult.transactions.pageInfo,
              },
            });

            return newResult;
          },
        });
      } else {
        stopResponsePolling();
        // start polling
        const commonTags = [
          ...DEFAULT_TAGS,
          { name: TAG_NAMES.modelName, values: [state.modelName] },
          { name: TAG_NAMES.modelCreator, values: [state.modelCreator] },
        ];
        const tagsResponses = [
          ...commonTags,
          { name: TAG_NAMES.operationName, values: [ MODEL_INFERENCE_RESPONSE ] },
          // { name: 'Conversation-Identifier', values: [currentConversationId] },
          { name: TAG_NAMES.modelUser, values: [userAddr] },
          {
            name: TAG_NAMES.requestTransaction,
            values: messages.map((el) => el.id).slice(-1),
          }, // slice from end to get latest requests
        ];
        const owners = Array.from(
          new Set(
            requestsData.transactions.edges
              .filter((el: IEdge) => messages.slice(-1).find((msg) => msg.id === el.node.id))
              .map((el: IEdge) => findTag(el, 'modelOperator')),
          ),
        );

        pollResponses({
          variables: {
            tagsResponses,
            owners,
          },
          pollInterval: 5000,
        });
      }
    }
  }, [responsesData]);

  useEffect(() => {
    scrollToBottom();
    // start polling
    if (messages && requestsData && !messagesLoading) {
      stopResponsePolling();
      const commonTags = [
        ...DEFAULT_TAGS,
        { name: 'Model-Name', values: [state.modelName] },
        { name: 'Model-Creator', values: [state.modelCreator] },
      ];
      const tagsResponses = [
        ...commonTags,
        { name: TAG_NAMES.operationName, values: [ MODEL_INFERENCE_RESPONSE ] },
        // { name: 'Conversation-Identifier', values: [currentConversationId] },
        { name: TAG_NAMES.modelUser, values: [userAddr] },
        {
          name: TAG_NAMES.requestTransaction,
          values: messages.map((el) => el.id).slice(-1), // last 5 requests
        }, // slice from end to get latest requests
      ];
      const owners = Array.from(
        new Set(
          requestsData.transactions.edges
            .filter((el: IEdge) => messages.slice(-1).find((msg) => msg.id === el.node.id))
            .map((el: IEdge) => findTag(el, 'modelOperator')),
        ),
      );

      pollResponses({
        variables: {
          tagsResponses,
          owners,
        },
        pollInterval: 5000,
      });
    }
  }, [messages]);

  useEffect(() => {
    if (currentConversationId && requestsData && responsesData) {
      setIsLocked(true);
      setMessagesLoading(true);
      reqData();
    }
  }, [currentConversationId]);

  useEffect(() => {
    if (!responsesPollingData || !responsesData || messagesLoading) return;

    const responses = responsesPollingData?.transactions?.edges || [];
    const currentRespones = responsesData.transactions.edges;
    const newValidResponses = responses.filter(
      (res: IEdge) => !currentRespones.find((el: IEdge) => el.node.id === res.node.id),
    );
    if (newValidResponses.length > 0) asyncMap(newValidResponses);
  }, [responsesPollingData]);

  useEffect(() => {
    if (!requestsPollingData || !requestsData || messagesLoading) return;

    const requests = requestsPollingData?.transactions?.edges || [];
    const currentRequests = requestsData.transactions.edges;
    const newValidRequests = requests.filter(
      (res: IEdge) => !currentRequests.find((el: IEdge) => el.node.id === res.node.id),
    );
    if (newValidRequests.length > 0) asyncMap(newValidRequests);
  }, [requestsPollingData]);

  const asyncMap = async (newData: IEdge[]) => {
    const temp: Message[] = [];
    await Promise.all(
      newData.map(async (el: IEdge) => {
        const msgIdx = polledMessages.findIndex((msg) => msg.id === el.node.id);
        const data = msgIdx < 0 ? await getData(el.node.id) : polledMessages[msgIdx].msg;
        const timestamp =
          parseInt(findTag(el, 'unixTime') || '') ||
          el.node.block?.timestamp ||
          Date.now() / 1000;
        const cid = findTag(el, 'conversationIdentifier');
        if (el.node.owner.address === userAddr) {
          temp.push({
            id: el.node.id,
            msg: data,
            type: 'request',
            timestamp: timestamp,
            cid,
          });
        } else {
          temp.push({
            id: el.node.id,
            msg: data,
            type: 'response',
            timestamp: timestamp,
            cid,
          });
        }
      }),
    );

    if (!_.isEqual(temp, polledMessages)) {
      setPolledMessages([...polledMessages, ...temp]);
    }

    const uniqueNewMessages = [...polledMessages, ...temp].filter(
      (el) => !messages.find((msg) => msg.id === el.id),
    );
    const newMessages = [...messages, ...uniqueNewMessages];

    newMessages.sort((a, b) => {
      if (a.timestamp === b.timestamp && a.type !== b.type) {
        return a.type === 'request' ? -1 : 1;
      } else if (a.timestamp === b.timestamp) {
        return a.id < b.id ? -1 : 1;
      }
      return a.timestamp - b.timestamp;
    });

    if (!_.isEqual(messages, newMessages)) {
      setMessages(newMessages.filter((el) => el.cid === currentConversationId));
    }
  };

  useEffect(() => {
    if (conversationIds && conversationIds.length > 0) {
      setFilteredConversationIds(conversationIds.filter((el) => el.includes(filterConversations)));
    }
  }, [filterConversations]);

  const handleListItemClick = (cid: string) => {
    setCurrentConversationId(cid);
  };

  const handleAddConversation = () => {
    const lastConversation = conversationIds[conversationIds.length - 1];
    const number = lastConversation?.split('-')[1];
    const newConversationId = `C-${+number + 1}`;
    setConversationIds([...conversationIds, newConversationId]);
    setFilteredConversationIds([...conversationIds, newConversationId]);
    setFilterConversations('');
    setCurrentConversationId(newConversationId);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  const handleMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewMessage(event.target.value);
  };

  const handleSend = async () => {
    if (!currentConversationId) return;
    const bundlr = new WebBundlr(NODE1_BUNDLR_URL, 'arweave', window.arweaveWallet);
    await bundlr.ready();
    const atomicBalance = await bundlr.getLoadedBalance();

    // Convert balance to an easier to read format
    const convertedBalance = bundlr.utils.unitConverter(atomicBalance).toNumber();
    const dataSize = new TextEncoder().encode(newMessage).length;
    const dataPrice = (await bundlr.getPrice(dataSize)).toNumber();
    if (dataPrice < convertedBalance) {
      // bundlr does not have enough funds
      enqueueSnackbar('Bundlr Node does not have enough funds for upload', { variant: 'error' });
      return;
    }
    const tags = [];
    tags.push({ name: 'App-Name', value: 'Fair Protocol' });
    tags.push({ name: 'App-Version', value: APP_VERSION });
    tags.push({ name: 'Model-Name', value: state.modelName });
    tags.push({ name: 'Model-Creator', value: state.modelCreator });
    tags.push({ name: 'Model-Transaction', value: state.modelTransaction });
    tags.push({ name: 'Model-Operator', value: address });
    tags.push({ name: 'Operation-Name', value: 'Model Inference Request' });
    tags.push({ name: 'Conversation-Identifier', value: currentConversationId });
    const tempDate = Date.now() / 1000;
    tags.push({ name: 'Unix-Time', value: tempDate.toString() });
    try {
      const bundlrRes = await bundlr.upload(newMessage, { tags });

      const temp = [...messages];
      temp.push({
        msg: newMessage,
        type: 'request',
        timestamp: tempDate,
        id: bundlrRes.id,
        cid: currentConversationId,
      });
      setMessages(temp);
      setNewMessage('');
      enqueueSnackbar(
        <>
          Inference Request
          <br></br>
          <a
            href={`https://viewblock.io/arweave/tx/${bundlrRes.id}`}
            target={'_blank'}
            rel='noreferrer'
          >
            <u>View Transaction in Explorer</u>
          </a>
        </>,
        {
          variant: 'success',
        },
      );

      const inferenceFee = (
        parseFloat(state.fee) +
        parseFloat(state.fee) * INFERENCE_PERCENTAGE_FEE
      ).toString();

      const tx = await arweave.createTransaction({
        target: address,
        quantity: inferenceFee,
      });

      tx.addTag('App-Name', 'Fair Protocol');
      tx.addTag('App-Version', APP_VERSION);
      tx.addTag('Operation-Name', 'Inference Payment');
      tx.addTag('Model-Name', state.modelName);
      tx.addTag('Model-Creator', state.modelCreator);
      tx.addTag('Model-Transaction', state.modelTransaction);
      tx.addTag('Model-Operator', address || '');
      tx.addTag('Conversation-Identifier', currentConversationId);
      tx.addTag('Inference-Transaction', bundlrRes.id);
      tx.addTag('Unix-Time', (Date.now() / 1000).toString());

      await arweave.transactions.sign(tx);
      const res = await arweave.transactions.post(tx);
      if (res.status === 200) {
        enqueueSnackbar(
          <>
            Paid Operator Fee ${arweave.ar.winstonToAr(inferenceFee)} AR.
            <br></br>
            <a href={`https://viewblock.io/arweave/tx/${tx.id}`} target={'_blank'} rel='noreferrer'>
              <u>View Transaction in Explorer</u>
            </a>
          </>,
          { variant: 'success' },
        );
      } else {
        enqueueSnackbar(res.statusText, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar(JSON.stringify(error), { variant: 'error' });
    }
  };

  const reqData = async () => {
    const allData = [...requestsData.transactions.edges, ...responsesData.transactions.edges];

    const temp: Message[] = [];
    await Promise.all(
      allData
        .filter(
          (el: IEdge) =>
            findTag(el, 'conversationIdentifier') ===
            currentConversationId,
        )
        .map(async (el: IEdge) => {
          const msgIdx = messages.findIndex((msg) => msg.id === el.node.id);
          const data = msgIdx < 0 ? await getData(el.node.id) : messages[msgIdx].msg;
          const timestamp =
            parseInt(findTag(el, 'unixTime') || '') ||
            el.node.block?.timestamp ||
            Date.now() / 1000;
          const cid = findTag(el, 'conversationIdentifier');
          if (el.node.owner.address === userAddr) {
            temp.push({
              id: el.node.id,
              msg: data,
              type: 'request',
              timestamp: timestamp,
              cid,
            });
          } else {
            temp.push({
              id: el.node.id,
              msg: data,
              type: 'response',
              timestamp: timestamp,
              cid,
            });
          }
        }),
    );

    const uniquePolledMessages = polledMessages.filter(
      (el) => !messages.find((msg) => msg.id === el.id) && !temp.find((msg) => msg.id === el.id),
    );
    const newMessages = [...temp, ...uniquePolledMessages];
    newMessages.sort((a, b) => {
      if (a.timestamp === b.timestamp && a.type !== b.type) {
        return a.type === 'request' ? -1 : 1;
      } else if (a.timestamp === b.timestamp) {
        return a.id < b.id ? -1 : 1;
      }
      return a.timestamp - b.timestamp;
    });

    if (!_.isEqual(newMessages, messages)) {
      // remove duplicates
      setMessages(newMessages.filter((el) => el.cid === currentConversationId));
    }

    setIsLocked(false);
    setMessagesLoading(false);
  };

  return (
    <>
      <Grid container spacing={0} sx={{ height: '100%' }}>
        <Grid
          item
          xs
          sx={{
            width: '100%',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <Paper
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              height: '100%',
              // background: 'rgba(21, 21, 21, 1)',
              gap: '16px',
              background: '#242424',
              // opacity: '0.3',
              borderRadius: ' 0px 20px 20px 0px',
            }}
            elevation={4}
          >
            <Box marginTop={'16px'}>
              <Box
                sx={{
                  background: '#B1B1B1',
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
                    color: '#595959',
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
                  <img src='/search-icon.svg'></img>
                </Icon>
              </Box>
            </Box>
            <Tooltip title='Start a new Conversation'>
              <IconButton
                onClick={handleAddConversation}
                sx={{
                  margin: '0 20px',
                  borderRadius: '30px',
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
              {requestsLoading && <div className='dot-pulse'></div>}
              {filteredConversationIds.map((cid, idx) => (
                <ListItemButton
                  key={idx}
                  alignItems='center'
                  selected={cid === currentConversationId}
                  onClick={() => handleListItemClick(cid)}
                  sx={{
                    background: '#434343',
                    borderRadius: '21px',
                    width: '100%',
                    justifyContent: 'center',
                    height: '91px',
                    opacity: 0.5,
                    color: '#f4f4f4',
                    '&.Mui-selected, &.Mui-selected:hover': {
                      opacity: 1,
                      background: 'rgba(204, 204, 204, 0.8)',
                      color: '#000',
                      // border: '4px solid transparent',
                      // background: 'linear-gradient(#434343, #434343) padding-box, linear-gradient(170.66deg, rgba(14, 255, 168, 0.29) -38.15%, rgba(151, 71, 255, 0.5) 30.33%, rgba(84, 81, 228, 0) 93.33%) border-box',
                    },
                    '&:hover': {
                      opacity: 1,
                      background: 'rgba(204, 204, 204, 0.8)',
                      color: '#000',
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
            </List>
            <Box flexGrow={1}></Box>
          </Paper>
        </Grid>
        <Grid
          item
          xs={10}
          sx={{
            width: '100%',
            height: '100%',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            background: '#000',
          }}
        >
          <Box flexGrow={1}>
            <Paper
              elevation={1}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                background: '#000',
              }}
            >
              <Box
                sx={{ overflow: 'auto', maxHeight: chatMaxHeight, pt: '150px' }}
                ref={scrollableRef}
              >
                {messagesLoading &&
                  mockArray.map((el: number) => {
                    return (
                      <Container key={el} maxWidth={false}>
                        <Stack
                          spacing={4}
                          flexDirection='row'
                          justifyContent={el % 2 === 0 ? 'flex-end' : 'flex-start'}
                        >
                          <Skeleton animation={'wave'} width={'40%'}>
                            <Box
                              display={'flex'}
                              justifyContent={el % 2 === 0 ? 'flex-end' : 'flex-start'}
                              flexDirection='column'
                              margin='8px'
                            >
                              <Box display={'flex'} alignItems='center'>
                                <Card
                                  elevation={8}
                                  raised={true}
                                  sx={{ width: 'fit-content', paddingBottom: 0 }}
                                >
                                  <CardContent>
                                    <Typography></Typography>
                                  </CardContent>
                                </Card>
                              </Box>
                            </Box>
                          </Skeleton>
                        </Stack>
                      </Container>
                    );
                  })}
                {requestError || responseError ? (
                  <Typography alignItems='center' display='flex' flexDirection='column-reverse'>
                    Could not Fetch Conversation History.
                  </Typography>
                ) : messages.length > 0 && !messagesLoading ? (
                  <>
                    <Divider textAlign='center' sx={{ ml: '24px', mr: '24px' }}>
                      {new Date(messages[0].timestamp * 1000).toLocaleDateString()}
                    </Divider>
                    {messages.reverse().map((el: Message, index: number) => (
                      <Container key={index} maxWidth={false} sx={{ paddingTop: '16px' }}>
                        <Stack spacing={4} flexDirection='row'>
                          <Box display={'flex'} flexDirection='column' margin='8px' width='100%'>
                            <Box
                              display={'flex'}
                              alignItems='center'
                              justifyContent={el.type === 'response' ? 'flex-start' : 'flex-end'}
                            >
                              {!!pendingTxs.find((pending) => el.id === pending.id) && (
                                <Tooltip
                                  title='This transaction is still not confirmed by the network'
                                  sx={{ margin: '8px' }}
                                >
                                  <PendingActionsIcon />
                                </Tooltip>
                              )}
                              <Card
                                elevation={8}
                                raised={true}
                                sx={{
                                  width: 'fit-content',
                                  maxWidth: '75%',
                                  // background: el.type === 'response' ? 'rgba(96, 96, 96, 0.7);' : 'rgba(52, 52, 52, 0.7);',
                                  border: '4px solid transparent',
                                  background:
                                    el.type !== 'response'
                                      ? 'rgba(204, 204, 204, 0.8)'
                                      : 'rgba(52, 52, 52, 0.7)',
                                  // opacity: '0.4',
                                  borderRadius: '40px',
                                }}
                              >
                                <CardContent
                                  sx={{
                                    padding: '24px 32px',
                                    gap: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: el.type === 'response' ? 'flex-start' : 'flex-end',
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontStyle: 'normal',
                                      fontWeight: 400,
                                      fontSize: '25px',
                                      lineHeight: '34px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      color: el.type === 'response' ? '#F4F4F4' : '#000',
                                    }}
                                    gutterBottom
                                  >
                                    {el.msg}
                                  </Typography>
                                  <Box display={'flex'}>
                                    <Typography
                                      sx={{
                                        fontStyle: 'normal',
                                        fontWeight: 300,
                                        fontSize: '20px',
                                        lineHeight: '27px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: el.type === 'response' ? '#FFF' : '#000',
                                      }}
                                    >
                                      {new Date(el.timestamp * 1000).toLocaleTimeString()}
                                      {' -  '}
                                    </Typography>
                                    <Typography
                                      sx={{
                                        fontStyle: 'normal',
                                        fontWeight: 700,
                                        fontSize: '20px',
                                        lineHeight: '27px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: el.type === 'response' ? '#FFF' : '#222',
                                      }}
                                    >
                                      {el.type === 'response' ? state.modelName : 'You'}
                                    </Typography>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Box>
                          </Box>
                        </Stack>
                        {index < messages.length - 1 &&
                          new Date(el.timestamp * 1000).getDay() !==
                            new Date(messages[index + 1].timestamp * 1000).getDay() && (
                            <Divider textAlign='center'>
                              <Typography
                                sx={{
                                  fontStyle: 'normal',
                                  fontWeight: 300,
                                  fontSize: '20px',
                                  lineHeight: '27px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: '#FFF',
                                }}
                              >
                                {new Date(
                                  messages[index + 1].timestamp * 1000,
                                ).toLocaleDateString()}
                              </Typography>
                            </Divider>
                          )}
                      </Container>
                    ))}
                  </>
                ) : !(messagesLoading || requestsLoading || responsesLoading) ? (
                  <Typography alignItems='center' display='flex' flexDirection='column'>
                    Starting a new conversation.
                  </Typography>
                ) : (
                  <></>
                )}
                <div ref={messagesEndRef} />
              </Box>
            </Paper>
          </Box>
          <Box
            sx={{
              background: '#1A1A1A',
              borderRadius: '20px',
              border: '1px solid #000000',
              margin: '0 20px',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '3px 20px 0px 50px',
              alignItems: 'center',
            }}
          >
            <InputBase
              sx={{
                color: '#F4F4F4',
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '20px',
                lineHeight: '16px',
              }}
              value={newMessage}
              onChange={handleMessageChange}
              fullWidth
              placeholder='Start Chatting...'
            />
            <IconButton
              onClick={handleSend}
              sx={{ height: '60px', width: '60px' }}
              disabled={!newMessage || newMessage === ''}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Grid>
      </Grid>
      <Outlet />
    </>
  );
};

export default Chat;
