import {
  Box,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  IconButton,
  InputBase,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { NetworkStatus, useLazyQuery } from '@apollo/client';
import { ChangeEvent, useContext, useEffect, useRef, useState } from 'react';
import {
  APP_VERSION,
  DEFAULT_TAGS,
  INFERENCE_PERCENTAGE_FEE,
  TAG_NAMES,
  APP_NAME,
  INFERENCE_PAYMENT,
  N_PREVIOUS_BLOCKS,
  SCRIPT_INFERENCE_RESPONSE,
  SCRIPT_INFERENCE_REQUEST,
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
import { useSnackbar } from 'notistack';
import { WalletContext } from '@/context/wallet';
import usePrevious from '@/hooks/usePrevious';
import arweave, { getData } from '@/utils/arweave';
import { findTag, genLoadingArray } from '@/utils/common';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import _ from 'lodash';
import '@/styles/main.css';
import { WorkerContext } from '@/context/worker';
import { BundlrContext } from '@/context/bundlr';
import useOnScreen from '@/hooks/useOnScreen';
import Conversations from '@/components/conversations';
import { LoadingContainer } from '@/styles/components';
import useScroll from '@/hooks/useScroll';

interface Message {
  id: string;
  msg: string;
  type: 'response' | 'request';
  timestamp: number;
  height: number;
  cid?: number;
}

const Chat = () => {
  const [currentConversationId, setCurrentConversationId] = useState(0);
  const { address } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { currentAddress: userAddr, isWalletLoaded } = useContext(WalletContext);
  const previousAddr = usePrevious<string>(userAddr);
  const [messages, setMessages] = useState<Message[]>([]);
  const [polledMessages, setPolledMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [pendingTxs] = useState<Transaction[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { height } = useWindowDimensions();
  const [chatMaxHeight, setChatMaxHeight] = useState('100%');
  const mockArray = genLoadingArray(5);
  const { enqueueSnackbar } = useSnackbar();
  const elementsPerPage = 5;
  const scrollableRef = useRef<HTMLDivElement>(null);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [responseTimeout, setResponseTimeout] = useState(false);
  const theme = useTheme();
  const { startJob } = useContext(WorkerContext);
  const { nodeBalance, upload, getPrice } = useContext(BundlrContext);
  const target = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(target);
  const [hasRequestNextPage, setHasRequestNextPage] = useState(false);
  const [hasResponseNextPage, setHasResponseNextPage] = useState(false);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [previousResponses, setPreviousResponses] = useState<IEdge[]>([]);
  const [lastEl, setLastEl] = useState<Element | undefined>(undefined);
  const { isTopHalf } = useScroll(scrollableRef);

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
  }, [height]);

  useEffect(() => {
    if (previousAddr && previousAddr !== userAddr) {
      navigate(0);
    } else if (!userAddr) {
      navigate('/');
    }
  }, [userAddr]);

  useEffect(() => {
    if (!isWalletLoaded) navigate('/');
  }, [isWalletLoaded]);

  useEffect(() => {
    if (requestsData && requestNetworkStatus === NetworkStatus.ready) {
      const commonTags = [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.scriptName, values: [state.scriptName] },
        { name: TAG_NAMES.scriptCurator, values: [state.scriptCurator] },
      ];
      const tagsResponses = [
        ...commonTags,
        { name: TAG_NAMES.operationName, values: [SCRIPT_INFERENCE_RESPONSE] },
        // { name: 'Conversation-Identifier', values: [currentConversationId] },
        { name: TAG_NAMES.scriptUser, values: [userAddr] },
        {
          name: TAG_NAMES.requestTransaction,
          values: requestsData.transactions.edges.map((el: IEdge) => el.node.id),
        }, // slice from end to get latest requests
      ];
      const owners = Array.from(
        new Set(requestsData.transactions.edges.map((el: IEdge) => findTag(el, 'scriptOperator'))),
      );
      getChatResponses({
        variables: {
          first: elementsPerPage,
          after:
            previousResponses.length > 0
              ? previousResponses[previousResponses.length - 1].cursor
              : undefined,
          tagsResponses,
          owners,
        },
        notifyOnNetworkStatusChange: true,
      });

      setHasRequestNextPage(requestsData?.transactions?.pageInfo?.hasNextPage);
    }
  }, [requestsData]);

  useEffect(() => {
    if (responsesData && responseNetworkStatus === NetworkStatus.ready) {
      const newResponses = responsesData.transactions.edges.filter(
        (previous: IEdge) =>
          !previousResponses.find((current: IEdge) => current.node.id === previous.node.id),
      );
      setPreviousResponses([...previousResponses, ...newResponses]);
      reqData([...previousResponses, ...newResponses]);
      setHasResponseNextPage(responsesData?.transactions?.pageInfo?.hasNextPage || false);
    }
  }, [responsesData]);

  useEffect(() => {
    if (isOnScreen && hasRequestNextPage) {
      if (!requestsData) return;
      const messages = document.querySelectorAll('.message-container');
      setLastEl(messages.item(0));
      requestFetchMore({
        variables: {
          after:
            requestsData.transactions.edges.length > 0
              ? requestsData.transactions.edges[requestsData.transactions.edges.length - 1].cursor
              : undefined,
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
    }
  }, [isOnScreen, hasRequestNextPage]);

  useEffect(() => {
    if (hasResponseNextPage) {
      responsesFetchMore({
        variables: {
          after:
            responsesData.transactions.edges.length > 0
              ? responsesData.transactions.edges[responsesData.transactions.edges.length - 1].cursor
              : undefined,
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
    }
  }, [hasResponseNextPage]);

  useEffect(() => {
    // start polling only on latest messages
    if (!isTopHalf || isFirstPage) {
      scrollToBottom();
    } else {
      scrollToLast();
    }
    if (messages && requestsData && !messagesLoading && isFirstPage) {
      setIsFirstPage(false);
      stopRequestPolling();
      const pollTags = [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.scriptName, values: [state.scriptName] },
        { name: TAG_NAMES.scriptCurator, values: [state.scriptCurator] },
      ];

      const tagsRequests = [
        ...pollTags,
        { name: TAG_NAMES.operationName, values: [SCRIPT_INFERENCE_REQUEST] },
      ];

      pollRequests({
        variables: {
          first: elementsPerPage,
          tagsRequests,
          address: userAddr,
        },
        pollInterval: 5000,
      });
      stopResponsePolling();
      const commonTags = [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.scriptName, values: [state.scriptName] },
        { name: TAG_NAMES.scriptCurator, values: [state.scriptCurator] },
      ];
      const tagsResponses = [
        ...commonTags,
        { name: TAG_NAMES.operationName, values: [SCRIPT_INFERENCE_RESPONSE] },
        // { name: 'Conversation-Identifier', values: [currentConversationId] },
        { name: TAG_NAMES.scriptUser, values: [userAddr] },
        {
          name: TAG_NAMES.requestTransaction,
          values: messages.map((el) => el.id).slice(-1), // last 5 requests
        }, // slice from end to get latest requests
      ];
      const owners = Array.from(
        new Set(
          requestsData.transactions.edges
            .filter((el: IEdge) => messages.slice(-1).find((msg) => msg.id === el.node.id))
            .map((el: IEdge) => findTag(el, 'scriptOperator')),
        ),
      );

      pollResponses({
        variables: {
          tagsResponses,
          owners,
        },
        pollInterval: 5000,
      });
    } else if (messages && requestsData && !messagesLoading) {
      // restart responses polling on new messages
      stopResponsePolling();
      const commonTags = [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.scriptName, values: [state.scriptName] },
        { name: TAG_NAMES.scriptCurator, values: [state.scriptCurator] },
      ];
      const tagsResponses = [
        ...commonTags,
        { name: TAG_NAMES.operationName, values: [SCRIPT_INFERENCE_RESPONSE] },
        // { name: 'Conversation-Identifier', values: [currentConversationId] },
        { name: TAG_NAMES.scriptUser, values: [userAddr] },
        {
          name: TAG_NAMES.requestTransaction,
          values: messages.map((el) => el.id).slice(-1), // last 5 requests
        }, // slice from end to get latest requests
      ];
      const owners = Array.from(
        new Set(
          requestsData.transactions.edges
            .filter((el: IEdge) => messages.slice(-1).find((msg) => msg.id === el.node.id))
            .map((el: IEdge) => findTag(el, 'scriptOperator')),
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
    if (currentConversationId) {
      setMessagesLoading(true);
      setPreviousResponses([]); // clear previous responses
      setIsFirstPage(true);
      // get messages for current conversation
      const commonTags = [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.scriptName, values: [state.scriptName] },
        { name: TAG_NAMES.scriptCurator, values: [state.scriptCurator] },
      ];
      const tagsRequests = [
        ...commonTags,
        { name: TAG_NAMES.operationName, values: [SCRIPT_INFERENCE_REQUEST] },
        { name: TAG_NAMES.conversationIdentifier, values: [`${currentConversationId}`] },
      ];
      getChatRequests({
        variables: {
          first: elementsPerPage,
          tagsRequests,
          address: userAddr,
          after: null,
        },
        notifyOnNetworkStatusChange: true,
      });
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
    else {
      emptyPolling();
    }
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
          parseInt(findTag(el, 'unixTime') || '') || el.node.block?.timestamp || Date.now() / 1000;
        const cid = findTag(el, 'conversationIdentifier') as string;
        const currentHeight = (await arweave.blocks.getCurrent()).height;
        if (el.node.owner.address === userAddr) {
          temp.push({
            id: el.node.id,
            msg: data,
            type: 'request',
            timestamp: timestamp,
            cid: parseInt(cid?.split('-')?.length > 1 ? cid?.split('-')[1] : cid),
            height: el.node.block ? el.node.block.height : currentHeight,
          });
        } else {
          temp.push({
            id: el.node.id,
            msg: data,
            type: 'response',
            timestamp: timestamp,
            cid: parseInt(cid?.split('-')?.length > 1 ? cid?.split('-')[1] : cid),
            height: el.node.block ? el.node.block.height : currentHeight,
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

    const filteredNewMsgs = newMessages.filter((el) => el.cid === currentConversationId);
    if (!_.isEqual(messages, newMessages)) {
      setMessages(filteredNewMsgs);
    }
    if (filteredNewMsgs[filteredNewMsgs.length - 1]?.type === 'response') {
      setIsWaitingResponse(false);
      setResponseTimeout(false);
    }
  };

  const handleMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewMessage(event.target.value);
  };

  const handleSend = async () => {
    if (!currentConversationId) return;
    const dataSize = new TextEncoder().encode(newMessage).length;

    try {
      const messagePrice = await getPrice(dataSize);
      if (!nodeBalance || messagePrice.toNumber() > nodeBalance) {
        enqueueSnackbar('Not Enough Bundlr Funds to send message', { variant: 'error' });
        return;
      }
    } catch (error) {
      enqueueSnackbar('Bundlr Error', { variant: 'error' });
      return;
    }

    const inferenceFee = (
      parseFloat(state.fee) +
      parseFloat(state.fee) * INFERENCE_PERCENTAGE_FEE
    ).toString();

    const tags = [];
    tags.push({ name: TAG_NAMES.appName, value: APP_NAME });
    tags.push({ name: TAG_NAMES.appVersion, value: APP_VERSION });
    tags.push({ name: TAG_NAMES.scriptName, value: state.scriptName });
    tags.push({ name: TAG_NAMES.scriptCurator, value: state.scriptCurator });
    tags.push({ name: TAG_NAMES.scriptTransaction, value: state.scriptTransaction });
    tags.push({ name: TAG_NAMES.scriptOperator, value: address });
    tags.push({ name: TAG_NAMES.operationName, value: SCRIPT_INFERENCE_REQUEST });
    tags.push({ name: TAG_NAMES.conversationIdentifier, value: `${currentConversationId}` });
    tags.push({ name: TAG_NAMES.paymentQuantity, value: inferenceFee });
    tags.push({ name: TAG_NAMES.paymentTarget, value: address });
    const tempDate = Date.now() / 1000;
    tags.push({ name: TAG_NAMES.unixTime, value: tempDate.toString() });
    tags.push({ name: TAG_NAMES.contentType, value: 'text/plain' });
    try {
      const bundlrRes = await upload(newMessage, tags);

      const temp = [...messages];
      temp.push({
        msg: newMessage,
        type: 'request',
        timestamp: tempDate,
        id: bundlrRes.id,
        cid: currentConversationId,
        height: (await arweave.blocks.getCurrent()).height,
      });
      setMessages(temp);
      setNewMessage('');
      setIsWaitingResponse(true);
      setResponseTimeout(false);
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

      const tx = await arweave.createTransaction({
        target: address,
        quantity: inferenceFee,
      });

      tx.addTag(TAG_NAMES.appName, APP_NAME);
      tx.addTag(TAG_NAMES.appVersion, APP_VERSION);
      tx.addTag(TAG_NAMES.operationName, INFERENCE_PAYMENT);
      tx.addTag(TAG_NAMES.scriptName, state.scriptName);
      tx.addTag(TAG_NAMES.scriptCurator, state.scriptCurator);
      tx.addTag(TAG_NAMES.scriptTransaction, state.scriptTransaction);
      tx.addTag(TAG_NAMES.scriptOperator, address || '');
      tx.addTag(TAG_NAMES.conversationIdentifier, `${currentConversationId}`);
      tx.addTag(TAG_NAMES.inferenceTransaction, bundlrRes.id);
      tx.addTag(TAG_NAMES.unixTime, (Date.now() / 1000).toString());
      tx.addTag(TAG_NAMES.contentType, 'text/plain');

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
        startJob({
          address: userAddr,
          operationName: SCRIPT_INFERENCE_REQUEST,
          tags,
          txid: bundlrRes.id,
          encodedTags: false,
        });
      } else {
        enqueueSnackbar(res.statusText, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar(JSON.stringify(error), { variant: 'error' });
    }
  };

  const keyDownHandler = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.code === 'Enter') {
      event.preventDefault();
      const dataSize = new TextEncoder().encode(newMessage).length;
      if (dataSize > 0) {
        handleSend();
      }
    }
  };

  const reqData = async (allResponses: IEdge[]) => {
    // slice number of responses = to number of requests
    const limitResponses = allResponses.slice(requestsData.transactions.length);
    const allData = [...requestsData.transactions.edges, ...limitResponses];

    const temp: Message[] = [];
    await Promise.all(
      allData
        .filter((el: IEdge) => {
          const cid = findTag(el, 'conversationIdentifier');
          if (cid && cid.split('-').length > 1) {
            return parseInt(cid.split('-')[1]) === currentConversationId;
          } else if (cid) {
            return parseInt(cid) === currentConversationId;
          } else {
            return false;
          }
        })
        .map(async (el: IEdge) => {
          const msgIdx = messages.findIndex((msg) => msg.id === el.node.id);
          const data = msgIdx < 0 ? await getData(el.node.id) : messages[msgIdx].msg;
          const timestamp =
            parseInt(findTag(el, 'unixTime') || '') ||
            el.node.block?.timestamp ||
            Date.now() / 1000;
          const cid = findTag(el, 'conversationIdentifier') as string;
          const currentHeight = (await arweave.blocks.getCurrent()).height;
          if (el.node.owner.address === userAddr) {
            temp.push({
              id: el.node.id,
              msg: data,
              type: 'request',
              timestamp: timestamp,
              cid: parseInt(cid?.split('-')?.length > 1 ? cid?.split('-')[1] : cid),
              height: el.node.block ? el.node.block.height : currentHeight,
            });
          } else {
            temp.push({
              id: el.node.id,
              msg: data,
              type: 'response',
              timestamp: timestamp,
              cid: parseInt(cid?.split('-')?.length > 1 ? cid?.split('-')[1] : cid),
              height: el.node.block ? el.node.block.height : currentHeight,
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

    const filteredNewMsgs = newMessages.filter((el) => el.cid === currentConversationId);
    if (!_.isEqual(newMessages, messages)) {
      // remove duplicates
      setMessages(filteredNewMsgs);
    }

    if (filteredNewMsgs[filteredNewMsgs.length - 1]?.type === 'response') {
      setIsWaitingResponse(false);
      setResponseTimeout(false);
    }

    // setIsLocked(false);
    setMessagesLoading(false);
  };

  const emptyPolling = async () => {
    const currentBlockHeight = (await arweave.blocks.getCurrent()).height;
    const lastMessage = [...messages.filter((el) => el.cid === currentConversationId)].pop();
    if (lastMessage && lastMessage.type === 'request') {
      if (currentBlockHeight - lastMessage.height > N_PREVIOUS_BLOCKS) {
        setIsWaitingResponse(false);
        setResponseTimeout(true);
      } else {
        setIsWaitingResponse(true);
        setResponseTimeout(false);
      }
    }
  };

  const scrollToBottom = async () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToLast = async () => {
    lastEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const getTimePassed = (unixTimestamp: number, index: number) => {
    const timestampNow = Date.now() / 1000;
    const secondsDiff = timestampNow - unixTimestamp;

    const min = 60;
    const hour = 60 * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = week * 4;
    const year = day * 365;

    if (secondsDiff < min) {
      const timer = setInterval(() => {
        const elements = document.querySelectorAll('.timeLabel');
        const current = elements.item(index);
        if (!current) {
          clearInterval(timer);
          return;
        }
        const newTimestamp = Date.now() / 1000;
        const newSecondsDiff = newTimestamp - unixTimestamp;
        if (newSecondsDiff < 60) {
          current.textContent = `${newSecondsDiff.toFixed(0)} Seconds Ago `;
        } else {
          current.textContent = '1 Minute Ago';
          clearInterval(timer);
        }
      }, 5000);
      return secondsDiff === 1 ? '1 Second Ago ' : `${secondsDiff.toFixed(0)} Seconds Ago `;
    } else if (secondsDiff < hour) {
      return secondsDiff === min
        ? '1 Minute Ago '
        : `${(secondsDiff / min).toFixed(0)} Minutes Ago `;
    } else if (secondsDiff < day) {
      return secondsDiff === hour ? '1 Hour Ago ' : `${(secondsDiff / hour).toFixed(0)} Hours Ago `;
    } else if (secondsDiff < week) {
      return secondsDiff === day ? '1 Day Ago ' : `${(secondsDiff / day).toFixed(0)} Days Ago `;
    } else if (secondsDiff < month) {
      return secondsDiff === week ? '1 Week Ago ' : `${(secondsDiff / week).toFixed(0)} Weeks Ago `;
    } else if (secondsDiff < year) {
      return secondsDiff === month
        ? '1 Month Ago '
        : `${(secondsDiff / month).toFixed(0)} Months Ago `;
    } else {
      return secondsDiff >= year && secondsDiff < 2 * year ? '1 Year Ago' : 'Over an Year Ago';
    }
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
          <Conversations
            currentConversationId={currentConversationId}
            setCurrentConversationId={setCurrentConversationId}
            state={state}
            userAddr={userAddr}
          />
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
            background: theme.palette.background.default,
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
                background: theme.palette.background.default,
                boxShadow: 'none',
              }}
            >
              <Box
                sx={{
                  overflow: 'auto',
                  maxHeight: chatMaxHeight,
                  pt: '150px',
                  paddingBottom: '24px',
                }}
                ref={scrollableRef}
              >
                <Box ref={target} sx={{ padding: '8px' }}></Box>
                {(messagesLoading || requestsLoading || responsesLoading) &&
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
                      <Container
                        key={el.id}
                        maxWidth={false}
                        sx={{ paddingTop: '16px' }}
                        className='message-container'
                      >
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
                                      ? theme.palette.mode === 'dark'
                                        ? 'rgba(204, 204, 204, 0.8)'
                                        : theme.palette.terciary.main
                                      : theme.palette.mode === 'dark'
                                      ? 'rgba(52, 52, 52, 0.7)'
                                      : theme.palette.secondary.main,
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
                                      color:
                                        el.type === 'response'
                                          ? theme.palette.secondary.contrastText
                                          : theme.palette.terciary.contrastText,
                                      whiteSpace: 'pre-wrap',
                                    }}
                                    gutterBottom
                                    component={'pre'}
                                  >
                                    {el.msg}
                                  </Typography>
                                  <Box display={'flex'}>
                                    <Typography
                                      className='timeLabel'
                                      sx={{
                                        fontStyle: 'normal',
                                        fontWeight: 300,
                                        fontSize: '20px',
                                        lineHeight: '27px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color:
                                          el.type === 'response'
                                            ? theme.palette.secondary.contrastText
                                            : theme.palette.terciary.contrastText,
                                      }}
                                    >
                                      {getTimePassed(el.timestamp, index)}
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
                                        color:
                                          el.type === 'response'
                                            ? theme.palette.secondary.contrastText
                                            : theme.palette.terciary.contrastText,
                                      }}
                                    >
                                      {el.type === 'response' ? state.scriptName : 'You'}
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
                    {isWaitingResponse && !responseTimeout && (
                      <Container maxWidth={false} sx={{ paddingTop: '16px' }}>
                        <Stack spacing={4} flexDirection='row'>
                          <Box display={'flex'} flexDirection='column' margin='8px' width='100%'>
                            <Box display={'flex'} alignItems='center' justifyContent={'flex-start'}>
                              <Card
                                elevation={8}
                                raised={true}
                                sx={{
                                  width: 'fit-content',
                                  maxWidth: '75%',
                                  // background: el.type === 'response' ? 'rgba(96, 96, 96, 0.7);' : 'rgba(52, 52, 52, 0.7);',
                                  border: '4px solid transparent',
                                  background:
                                    theme.palette.mode === 'dark'
                                      ? 'rgba(52, 52, 52, 0.7)'
                                      : theme.palette.secondary.main,
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
                                    alignItems: 'flex-start',
                                  }}
                                >
                                  <LoadingContainer
                                    className='dot-pulse'
                                    sx={{ marginBottom: '0.35em' }}
                                  />
                                </CardContent>
                              </Card>
                            </Box>
                          </Box>
                        </Stack>
                      </Container>
                    )}
                    {responseTimeout && !isWaitingResponse && (
                      <Container maxWidth={false} sx={{ paddingTop: '16px' }}>
                        <Stack spacing={4} flexDirection='row'>
                          <Box display={'flex'} flexDirection='column' margin='8px' width='100%'>
                            <Box display={'flex'} alignItems='center' justifyContent={'center'}>
                              <Typography
                                sx={{
                                  fontStyle: 'normal',
                                  fontWeight: 600,
                                  fontSize: '30px',
                                  lineHeight: '41px',
                                  display: 'block',
                                  textAlign: 'center',
                                  color: '#F4BA61',
                                }}
                              >
                                The last request has not received a response in the defined amount
                                of time, please consider retrying with a new operator
                              </Typography>
                            </Box>
                          </Box>
                        </Stack>
                      </Container>
                    )}
                  </>
                ) : !(messagesLoading || requestsLoading || responsesLoading) ? (
                  <Typography alignItems='center' display='flex' flexDirection='column'>
                    Starting a new conversation.
                  </Typography>
                ) : (
                  <></>
                )}
                <Box ref={messagesEndRef} sx={{ padding: '8px' }}></Box>
              </Box>
            </Paper>
          </Box>
          <Box
            sx={{
              background: theme.palette.mode === 'dark' ? '#1A1A1A' : 'transparent',
              border: '2px solid',
              borderRadius: '20px',
              margin: '0 32px',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '3px 20px 0px 50px',
              alignItems: 'center',
            }}
          >
            <InputBase
              sx={{
                color:
                  theme.palette.mode === 'dark' ? '#1A1A1A' : theme.palette.neutral.contrastText,
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '20px',
                lineHeight: '16px',
                width: '100%',
              }}
              value={newMessage}
              onChange={handleMessageChange}
              onKeyDown={keyDownHandler}
              fullWidth
              placeholder='Start Chatting...'
            />
            <IconButton
              onClick={handleSend}
              sx={{ height: '60px', width: '60px', color: theme.palette.neutral.contrastText }}
              disabled={!newMessage || newMessage === '' || !currentConversationId}
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
