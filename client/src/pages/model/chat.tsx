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
  Box,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { NetworkStatus, useLazyQuery } from '@apollo/client';
import {
  ChangeEvent,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  APP_VERSION,
  DEFAULT_TAGS,
  TAG_NAMES,
  APP_NAME,
  INFERENCE_PAYMENT,
  N_PREVIOUS_BLOCKS,
  SCRIPT_INFERENCE_RESPONSE,
  SCRIPT_INFERENCE_REQUEST,
  secondInMS,
  textContentType,
  OPERATOR_PERCENTAGE_FEE,
  MARKETPLACE_PERCENTAGE_FEE,
  CREATOR_PERCENTAGE_FEE,
  CURATOR_PERCENTAGE_FEE,
  VAULT_ADDRESS,
  MAX_MESSAGE_SIZE,
  DEFAULT_TAGS_FOR_TOKENS,
  TX_ORIGIN,
} from '@/constants';
import {
  QUERY_CHAT_REQUESTS,
  QUERY_CHAT_REQUESTS_POLLING,
  QUERY_CHAT_RESPONSES,
  QUERY_CHAT_RESPONSES_POLLING,
} from '@/queries/graphql';
import { IEdge, ITag } from '@/interfaces/arweave';
import Transaction from 'arweave/node/lib/transaction';
import { useSnackbar } from 'notistack';
import { WalletContext } from '@/context/wallet';
import usePrevious from '@/hooks/usePrevious';
import arweave, { getData } from '@/utils/arweave';
import { commonUpdateQuery, findTag, printSize } from '@/utils/common';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import _, { debounce } from 'lodash';
import '@/styles/main.css';
import useOnScreen from '@/hooks/useOnScreen';
import Conversations from '@/components/conversations';
import useScroll from '@/hooks/useScroll';
import { IMessage } from '@/interfaces/common';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ClearIcon from '@mui/icons-material/Clear';
import ChatBubble from '@/components/chat-bubble';
import DebounceIconButton from '@/components/debounce-icon-button';
import { parseUBalance, sendU } from '@/utils/u';

const Chat = () => {
  const [currentConversationId, setCurrentConversationId] = useState(0);
  const { address } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    currentAddress: userAddr,
    updateUBalance,
    currentUBalance,
    dispatchTx,
  } = useContext(WalletContext);
  const previousAddr = usePrevious<string>(userAddr);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [polledMessages, setPolledMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [pendingTxs] = useState<Transaction[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { width, height } = useWindowDimensions();
  const [chatMaxHeight, setChatMaxHeight] = useState('100%');
  const { enqueueSnackbar } = useSnackbar();
  const elementsPerPage = 5;
  const scrollableRef = useRef<HTMLDivElement>(null);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [responseTimeout, setResponseTimeout] = useState(false);
  const theme = useTheme();
  const target = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(target);
  const [hasRequestNextPage, setHasRequestNextPage] = useState(false);
  const [hasResponseNextPage, setHasResponseNextPage] = useState(false);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [previousResponses, setPreviousResponses] = useState<IEdge[]>([]);
  const [lastEl, setLastEl] = useState<Element | undefined>(undefined);
  const { isTopHalf } = useScroll(scrollableRef);
  const [file, setFile] = useState<File | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [inputWidth, setInputWidth] = useState(0);
  const [inputHeight, setInputHeight] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendDisabled = useMemo(() => {
    if (!currentConversationId || loading) {
      return true;
    } else {
      return (newMessage.length === 0 || newMessage.length >= MAX_MESSAGE_SIZE) && !file;
    }
  }, [newMessage, file, currentConversationId, loading]);

  const allowFiles = useMemo(() => findTag(state.fullState, 'allowFiles') === 'true', [state]);
  const allowText = useMemo(
    () =>
      !findTag(state.fullState, 'allowText')
        ? true
        : findTag(state.fullState, 'allowText') === 'true',
    [state],
  );
  const uploadDisabled = useMemo(
    () => file instanceof File || loading || !allowFiles,
    [file, loading, allowFiles],
  );

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

  const showLoading = useMemo(
    () => messagesLoading || requestsLoading || responsesLoading,
    [messagesLoading, requestsLoading, responsesLoading],
  );

  const showError = useMemo(() => !!requestError || !!responseError, [requestError, responseError]);

  useEffect(() => {
    const currHeaderHeight = document.querySelector('header')?.clientHeight as number;
    setChatMaxHeight(`${height - currHeaderHeight}px`);
  }, [height]);

  useEffect(() => {
    if (previousAddr && previousAddr !== userAddr) {
      navigate(0);
    } else if (!localStorage.getItem('wallet') && !userAddr) {
      navigate('/');
    } else {
      // ignore
    }
  }, [userAddr]);

  useEffect(() => {
    if (requestsData && requestNetworkStatus === NetworkStatus.ready) {
      const tagsResponses = [
        ...DEFAULT_TAGS_FOR_TOKENS,
        { name: TAG_NAMES.scriptName, values: [state.scriptName] },
        { name: TAG_NAMES.scriptCurator, values: [state.scriptCurator] },
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
      setHasResponseNextPage(responsesData?.transactions?.pageInfo?.hasNextPage || false);
      (async () => reqData([...previousResponses, ...newResponses]))();
    }
  }, [responsesData]);

  useEffect(() => {
    if (isOnScreen && hasRequestNextPage) {
      if (!requestsData) return;
      requestFetchMore({
        variables: {
          after:
            requestsData.transactions.edges.length > 0
              ? requestsData.transactions.edges[requestsData.transactions.edges.length - 1].cursor
              : undefined,
        },
        updateQuery: commonUpdateQuery,
      });
    }
  }, [isOnScreen, hasRequestNextPage]);

  useEffect(() => {
    if (messages.length > 0) {
      const msgElements = document.querySelectorAll('.message-container');
      setLastEl(msgElements.item(0));
    }
  }, [messages]);

  useEffect(() => {
    if (responsesData && hasResponseNextPage) {
      responsesFetchMore({
        variables: {
          after:
            responsesData.transactions.edges.length > 0
              ? responsesData.transactions.edges[responsesData.transactions.edges.length - 1].cursor
              : undefined,
        },
        updateQuery: commonUpdateQuery,
      });
    }
  }, [responsesData, hasResponseNextPage]);

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

      const tagsRequests = [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.scriptName, values: [state.scriptName] },
        { name: TAG_NAMES.scriptCurator, values: [state.scriptCurator] },
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
      const tagsResponses = [
        ...DEFAULT_TAGS_FOR_TOKENS,
        { name: TAG_NAMES.scriptName, values: [state.scriptName] },
        { name: TAG_NAMES.scriptCurator, values: [state.scriptCurator] },
        { name: TAG_NAMES.operationName, values: [SCRIPT_INFERENCE_RESPONSE] },
        // { name: 'Conversation-Identifier', values: [currentConversationId] },
        { name: TAG_NAMES.scriptUser, values: [userAddr] },
        {
          name: TAG_NAMES.requestTransaction,
          values: messages
            .filter((el) => el.type === 'request')
            .map((el) => el.id)
            .slice(-1), // last request
        }, // slice from end to get latest requests
      ];
      const owners = Array.from(
        new Set(
          requestsData.transactions.edges
            .filter((el: IEdge) =>
              messages
                .filter((el) => el.type === 'request')
                .slice(-1)
                .find((msg) => msg.id === el.node.id),
            )
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
      const tagsResponses = [
        ...DEFAULT_TAGS_FOR_TOKENS,
        { name: TAG_NAMES.scriptName, values: [state.scriptName] },
        { name: TAG_NAMES.scriptCurator, values: [state.scriptCurator] },
        { name: TAG_NAMES.operationName, values: [SCRIPT_INFERENCE_RESPONSE] },
        // { name: 'Conversation-Identifier', values: [currentConversationId] },
        { name: TAG_NAMES.scriptUser, values: [userAddr] },
        {
          name: TAG_NAMES.requestTransaction,
          values: messages
            .filter((el) => el.type === 'request')
            .map((el) => el.id)
            .slice(-1), // last request
        }, // slice from end to get latest requests
      ];
      const owners = Array.from(
        new Set(
          requestsData.transactions.edges
            .filter((el: IEdge) =>
              messages
                .filter((el) => el.type === 'request')
                .slice(-1)
                .find((msg) => msg.id === el.node.id),
            )
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
    (async () => {
      if (newValidResponses.length > 0) {
        await asyncMap(newValidResponses);
      } else {
        await emptyPolling();
      }
    })();
  }, [responsesPollingData]);

  useEffect(() => {
    if (!requestsPollingData || !requestsData || messagesLoading) return;

    const requests = requestsPollingData?.transactions?.edges || [];
    const currentRequests = requestsData.transactions.edges;
    const newValidRequests = requests.filter(
      (res: IEdge) => !currentRequests.find((el: IEdge) => el.node.id === res.node.id),
    );
    if (newValidRequests.length > 0) {
      (async () => asyncMap(newValidRequests))();
    }
  }, [requestsPollingData]);

  const mapTransactionsToMessages = async (el: IEdge) => {
    const msgIdx = polledMessages.findIndex((msg) => msg.id === el.node.id);

    const contentType = findTag(el, 'contentType');
    const data =
      msgIdx <= 0 ? await getData(el.node.id, findTag(el, 'fileName')) : polledMessages[msgIdx].msg;
    const timestamp =
      parseInt(findTag(el, 'unixTime') || '', 10) || el.node.block?.timestamp || Date.now() / 1000;
    const cid = findTag(el, 'conversationIdentifier') as string;
    const currentHeight = (await arweave.blocks.getCurrent()).height;
    const isRequest = el.node.owner.address === userAddr;

    const msg: IMessage = {
      id: el.node.id,
      msg: data,
      type: isRequest ? 'request' : 'response',
      cid: parseInt(cid?.split('-')?.length > 1 ? cid?.split('-')[1] : cid, 10),
      height: el.node.block ? el.node.block.height : currentHeight,
      to: isRequest ? (findTag(el, 'scriptOperator') as string) : userAddr,
      from: isRequest ? userAddr : el.node.owner.address,
      tags: el.node.tags,
      contentType,
      timestamp,
    };

    return msg;
  };

  const asyncMap = async (newData: IEdge[]) => {
    const temp: IMessage[] = [];
    await Promise.all(newData.map(async (el) => temp.push(await mapTransactionsToMessages(el))));

    if (!_.isEqual(temp, polledMessages)) {
      // only add new polled messages
      setPolledMessages([
        ...polledMessages,
        ...temp.filter((tmp) => !polledMessages.find((el) => el.id === tmp.id)),
      ]);
    }

    const uniqueNewMessages = [...polledMessages, ...temp].filter(
      (el) => !messages.find((msg) => msg.id === el.id),
    );
    const newMessages = [...messages, ...uniqueNewMessages];

    sortMessages(newMessages);

    const filteredNewMsgs = newMessages.filter((el) => el.cid === currentConversationId);
    const uniqueMsgs: IMessage[] = [];

    // filter registratiosn for same model (only keep latest one per operator)
    filteredNewMsgs.forEach((msg: IMessage) =>
      uniqueMsgs.filter((unique) => unique.id === msg.id).length > 0
        ? undefined
        : uniqueMsgs.push(msg),
    );
    if (!_.isEqual(messages, uniqueMsgs)) {
      setMessages(uniqueMsgs);
    }
    if (filteredNewMsgs[filteredNewMsgs.length - 1]?.type === 'response') {
      setIsWaitingResponse(false);
      setResponseTimeout(false);
    }
  };

  const checkCanSend = (dataSize: number) => {
    try {
      if (!currentConversationId) {
        return false;
      }

      if (dataSize > MAX_MESSAGE_SIZE) {
        enqueueSnackbar('Message Too Long', { variant: 'error' });
        return false;
      }

      if (currentUBalance < parseUBalance(state.fee)) {
        enqueueSnackbar('Not Enough $U tokens to pay Operator', { variant: 'error' });
        return false;
      }

      return true;
    } catch (error) {
      enqueueSnackbar('Something went wrong', { variant: 'error' });
      return false;
    }
  };

  const getUploadTags = (contentType: string, fileName?: string) => {
    const tags = [];
    tags.push({ name: TAG_NAMES.appName, value: APP_NAME });
    tags.push({ name: TAG_NAMES.appVersion, value: APP_VERSION });
    tags.push({ name: TAG_NAMES.scriptName, value: state.scriptName });
    tags.push({ name: TAG_NAMES.scriptCurator, value: state.scriptCurator });
    tags.push({ name: TAG_NAMES.scriptTransaction, value: state.scriptTransaction });
    tags.push({ name: TAG_NAMES.scriptOperator, value: address });
    tags.push({ name: TAG_NAMES.operationName, value: SCRIPT_INFERENCE_REQUEST });
    tags.push({ name: TAG_NAMES.conversationIdentifier, value: `${currentConversationId}` });
    if (fileName) {
      tags.push({ name: TAG_NAMES.fileName, value: fileName });
    }
    const tempDate = Date.now() / secondInMS;
    tags.push({ name: TAG_NAMES.unixTime, value: tempDate.toString() });
    tags.push({ name: TAG_NAMES.contentType, value: contentType });
    tags.push({ name: TAG_NAMES.txOrigin, value: TX_ORIGIN });

    return tags;
  };

  const handlePayment = async (bundlrId: string, inferenceFee: string, contentType: string) => {
    const parsedUFee = parseFloat(inferenceFee);
    try {
      const paymentTags = [
        { name: TAG_NAMES.appName, value: APP_NAME },
        { name: TAG_NAMES.appVersion, value: APP_VERSION },
        { name: TAG_NAMES.operationName, value: INFERENCE_PAYMENT },
        { name: TAG_NAMES.scriptName, value: state.scriptName },
        { name: TAG_NAMES.scriptCurator, value: state.scriptCurator },
        { name: TAG_NAMES.scriptTransaction, value: state.scriptTransaction },
        { name: TAG_NAMES.scriptOperator, value: address as string },
        { name: TAG_NAMES.modelCreator, value: state.modelCreator },
        { name: TAG_NAMES.conversationIdentifier, value: `${currentConversationId}` },
        { name: TAG_NAMES.inferenceTransaction, value: bundlrId },
        { name: TAG_NAMES.unixTime, value: (Date.now() / secondInMS).toString() },
        { name: TAG_NAMES.contentType, value: contentType },
        { name: TAG_NAMES.txOrigin, value: TX_ORIGIN },
      ];

      const operatorFeeShare = parsedUFee * OPERATOR_PERCENTAGE_FEE;
      const marketPlaceFeeShare = parsedUFee * MARKETPLACE_PERCENTAGE_FEE;
      const creatorFeeShare = parsedUFee * CREATOR_PERCENTAGE_FEE;
      const curatorFeeShare = parsedUFee * CURATOR_PERCENTAGE_FEE;

      // pay operator
      await sendU(address as string, parseInt(operatorFeeShare.toString(), 10), paymentTags);
      // pay curator
      await sendU(state.scriptCurator, parseInt(curatorFeeShare.toString(), 10), paymentTags);
      // pay model creator
      await sendU(state.modelCreator, parseInt(creatorFeeShare.toString(), 10), paymentTags);
      // pay marketplace
      await sendU(VAULT_ADDRESS, parseInt(marketPlaceFeeShare.toString(), 10), paymentTags);

      // update balance after payments
      await updateUBalance();
      enqueueSnackbar(<>Paid Inference costs: {parseUBalance(inferenceFee)} $U.</>, {
        variant: 'success',
      });
    } catch (error) {
      enqueueSnackbar('An Error Occurred', { variant: 'error' });
    }
  };

  const updateMessagesAndPay = async (
    content: string | File,
    contentType: string,
    txid: string,
    tags: ITag[],
  ) => {
    const temp = [...messages];
    temp.push({
      msg: content,
      type: 'request',
      timestamp: parseFloat(tags.find((tag) => tag.name === TAG_NAMES.unixTime)?.value as string),
      id: txid,
      cid: currentConversationId,
      height: (await arweave.blocks.getCurrent()).height,
      to: address as string,
      from: userAddr,
      contentType,
      tags,
    });
    setMessages(temp);
    setNewMessage('');
    if (inputRef?.current) {
      inputRef.current.value = '';
    }
    setFile(undefined);
    setIsWaitingResponse(true);
    setResponseTimeout(false);
    enqueueSnackbar(
      <>
        Inference Request
        <br></br>
        <a href={`https://viewblock.io/arweave/tx/${txid}`} target={'_blank'} rel='noreferrer'>
          <u>View Transaction in Explorer</u>
        </a>
      </>,
      {
        variant: 'success',
      },
    );

    await handlePayment(txid, state.fee, contentType);
  };

  const handleSendFile = async () => {
    if (!file) {
      return;
    }

    const dataSize = file.size;

    if (!checkCanSend(dataSize)) {
      return;
    }

    const contentType = file.type;
    const content = file;

    try {
      const tags: ITag[] = getUploadTags(content.name, contentType);
      // upload with dispatch
      const data = await content.arrayBuffer(); // it's safe to convert to arrayBuffer bc max size is 100kb
      const tx = await arweave.createTransaction({ data });
      tags.forEach((tag) => tx.addTag(tag.name, tag.value));

      const { id: txid } = await dispatchTx(tx);

      if (!txid) {
        enqueueSnackbar('An Error Occurred', { variant: 'error' });
        return;
      }
      updateMessagesAndPay(content, contentType, txid, tags);
    } catch (error) {
      enqueueSnackbar(JSON.stringify(error), { variant: 'error' });
    }
  };

  const handleSendText = async () => {
    if (!newMessage) {
      return;
    }

    const dataSize = new TextEncoder().encode(newMessage).length;

    if (!checkCanSend(dataSize)) {
      return;
    }

    const contentType = textContentType;
    const content = newMessage;

    try {
      const tags: ITag[] = getUploadTags(contentType);
      // upload with dispatch
      const tx = await arweave.createTransaction({ data: newMessage });
      tags.forEach((tag) => tx.addTag(tag.name, tag.value));

      const { id: txid } = await dispatchTx(tx);
      if (!txid) {
        enqueueSnackbar('An Error Occurred.', { variant: 'error' });
        return;
      }
      await updateMessagesAndPay(content, contentType, txid, tags);
    } catch (error) {
      enqueueSnackbar(JSON.stringify(error), { variant: 'error' });
    }
  };

  const sortMessages = (messages: IMessage[]) => {
    messages.sort((a, b) => {
      if (a.timestamp === b.timestamp && a.type !== b.type) {
        return a.type === 'request' ? -1 : 1;
      } else if (a.timestamp === b.timestamp) {
        return a.id < b.id ? -1 : 1;
      }
      return a.timestamp - b.timestamp;
    });
  };

  const reqData = async (allResponses: IEdge[]) => {
    // slice number of responses = to number of requests
    const allData = [...requestsData.transactions.edges, ...allResponses];

    const filteredData = allData.filter((el: IEdge) => {
      const cid = findTag(el, 'conversationIdentifier');
      if (cid && cid.split('-').length > 1) {
        return parseInt(cid.split('-')[1], 10) === currentConversationId;
      } else if (cid) {
        return parseInt(cid, 10) === currentConversationId;
      } else {
        return false;
      }
    });

    const temp: IMessage[] = [];
    await Promise.all(
      filteredData.map(async (el: IEdge) => temp.push(await mapTransactionsToMessages(el))),
    );

    const uniquePolledMessages = polledMessages.filter(
      (el) => !messages.find((msg) => msg.id === el.id) && !temp.find((msg) => msg.id === el.id),
    );
    const newMessages = [...temp, ...uniquePolledMessages];
    sortMessages(newMessages);

    const filteredNewMsgs = newMessages.filter((el) => el.cid === currentConversationId);
    // remove duplicates
    const uniqueMsgs: IMessage[] = [];

    // filter registratiosn for same model (only keep latest one per operator)
    filteredNewMsgs.forEach((msg: IMessage) =>
      uniqueMsgs.filter((unique) => unique.id === msg.id).length > 0
        ? undefined
        : uniqueMsgs.push(msg),
    );
    if (!_.isEqual(uniqueMsgs, messages)) {
      setMessages(uniqueMsgs);
    }

    if (filteredNewMsgs[filteredNewMsgs.length - 1]?.type === 'response') {
      setIsWaitingResponse(false);
      setResponseTimeout(false);
    }
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToLast = () => {
    lastEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const onFileLoad = (fr: FileReader, newFile: File) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return () => {
      setLoading(false);
      fr.removeEventListener('error', onFileError(fr, newFile));
      fr.removeEventListener('load', onFileLoad(fr, newFile));
    };
  };

  const onFileError = (fr: FileReader, newFile: File) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (_event: ProgressEvent) => {
      setFile(undefined);
      setLoading(false);
      fr.removeEventListener('error', onFileError(fr, newFile));
      fr.removeEventListener('load', onFileLoad(fr, newFile));
    };
  };

  const handleFileUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
        const newFile = event.target.files[0];
        const fr = new FileReader();
        setFile(newFile);
        fr.addEventListener('load', onFileLoad(fr, newFile));
        fr.addEventListener('error', onFileError(fr, newFile));
        fr.readAsArrayBuffer(newFile);
      } else {
        setFile(undefined);
        setLoading(false);
      }
    },
    [file, setFile, setLoading, onFileError, onFileLoad],
  );

  const handleUploadClick = useCallback(() => setLoading(true), [setLoading]);

  const handleRemoveFile = useCallback(() => {
    setFile(undefined);
  }, [setFile]);

  const handleSendClick = useCallback(async () => {
    if (isSending) {
      return;
    } else {
      // continue
    }
    setIsSending(true);

    if (file) {
      // handle send file
      await handleSendFile();
    } else {
      await handleSendText();
    }

    setIsSending(false);
  }, [handleSendFile, handleSendText, file, isSending]);

  const keyDownHandler = debounce(async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.code === 'Enter') {
      event.preventDefault();
      if (!sendDisabled && !isSending) {
        setIsSending(true);
        if (file) {
          // handle send file
          await handleSendFile();
        } else {
          await handleSendText();
        }
        setIsSending(false);
      }
    }
  }, secondInMS);

  const handleMessageChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setNewMessage(event.target.value),
    [setNewMessage],
  );

  useLayoutEffect(() => {
    const currContentWidth = document.querySelector('#chat')?.clientWidth;
    if (currContentWidth) {
      const margins = 32; // 16px on each side
      setInputWidth(currContentWidth - margins); // subtract margins from size
    }
    const currInputHeight = document.querySelector('#chat-input')?.clientHeight;
    if (currInputHeight) {
      const margins = 16; // 8px on each side
      setInputHeight(currInputHeight + margins);
    }
  }, [width]);

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
          id='chat'
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
                  paddingBottom: `${inputHeight}px`,
                }}
                ref={scrollableRef}
              >
                <Box ref={target} sx={{ padding: '8px' }}></Box>
                <ChatBubble
                  messages={messages}
                  showError={showError}
                  showLoading={showLoading}
                  isWaitingResponse={isWaitingResponse}
                  responseTimeout={responseTimeout}
                  pendingTxs={pendingTxs}
                  messagesLoading={messagesLoading}
                />
                <Box ref={messagesEndRef} sx={{ padding: '8px' }}></Box>
              </Box>
            </Paper>
          </Box>
          <Box
            id={'chat-input'}
            sx={{
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '23px',
              justifyContent: 'flex-start',
              position: 'absolute',
              margin: '8px 16px',
              width: inputWidth,
            }}
          >
            {loading || file ? (
              <FormControl variant='outlined' fullWidth>
                {file && (
                  <TextField
                    value={file?.name}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <IconButton aria-label='Remove' onClick={handleRemoveFile}>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position='start'>{printSize(file)}</InputAdornment>
                      ),
                      sx: {
                        borderWidth: '1px',
                        borderColor: theme.palette.text.primary,
                        borderRadius: '23px',
                      },
                      readOnly: true,
                    }}
                  />
                )}
                {loading && <CircularProgress variant='indeterminate' />}
              </FormControl>
            ) : (
              <>
                <TextField
                  inputRef={inputRef}
                  sx={{
                    color:
                      theme.palette.mode === 'dark'
                        ? '#1A1A1A'
                        : theme.palette.neutral.contrastText,
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '20px',
                    lineHeight: '16px',
                    width: '100%',
                    boxShadow:
                      '0px 15px 50px rgba(0,0,0,0.4), 0px -15px 50px rgba(0,0,0,0.4), 15px 0px 50px rgba(0,0,0,0.4), -15px 0px 50px rgba(0,0,0,0.4)',
                    background: theme.palette.background.default,
                    borderRadius: '23px',
                  }}
                  InputProps={{
                    endAdornment: (
                      <>
                        <Tooltip
                          title={
                            !allowFiles ? 'Script does not support Uploading files' : 'File Loaded'
                          }
                        >
                          <span>
                            <IconButton
                              component='label'
                              disabled={uploadDisabled}
                              onClick={handleUploadClick}
                            >
                              <AttachFileIcon />
                              <input
                                type='file'
                                hidden
                                multiple={false}
                                onInput={handleFileUpload}
                              />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <DebounceIconButton
                          onClick={handleSendClick}
                          sx={{
                            height: '60px',
                            width: '60px',
                            color: theme.palette.neutral.contrastText,
                          }}
                          disabled={sendDisabled}
                        >
                          <SendIcon />
                        </DebounceIconButton>
                      </>
                    ),
                  }}
                  error={newMessage.length >= MAX_MESSAGE_SIZE}
                  onChange={handleMessageChange}
                  onKeyDown={keyDownHandler}
                  fullWidth
                  disabled={!allowText}
                  placeholder='Start Chatting...'
                />
              </>
            )}
            {newMessage.length >= MAX_MESSAGE_SIZE && (
              <Typography
                variant='subtitle1'
                sx={{ color: theme.palette.error.main, fontWeight: 500, paddingLeft: '20px' }}
              >
                Message Too Long
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
      <Outlet />
    </>
  );
};

export default Chat;
