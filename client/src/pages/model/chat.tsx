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
  Alert,
  Box,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputBase,
  Paper,
  Snackbar,
  TextField,
  Tooltip,
  useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { NetworkStatus, useLazyQuery } from '@apollo/client';
import { ChangeEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  successStatusCode,
  textContentType,
  OPERATOR_PERCENTAGE_FEE,
  MARKETPLACE_PERCENTAGE_FEE,
  CREATOR_PERCENTAGE_FEE,
  CURATOR_PERCENTAGE_FEE,
  VAULT_ADDRESS,
} from '@/constants';
import {
  QUERY_CHAT_REQUESTS,
  QUERY_CHAT_REQUESTS_POLLING,
  QUERY_CHAT_RESPONSES,
  QUERY_CHAT_RESPONSES_POLLING,
} from '@/queries/graphql';
import { IEdge } from '@/interfaces/arweave';
import Transaction from 'arweave/node/lib/transaction';
import { useSnackbar } from 'notistack';
import { WalletContext } from '@/context/wallet';
import usePrevious from '@/hooks/usePrevious';
import arweave, { getData } from '@/utils/arweave';
import { commonUpdateQuery, findTag, printSize } from '@/utils/common';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import _ from 'lodash';
import '@/styles/main.css';
import { BundlrContext } from '@/context/bundlr';
import useOnScreen from '@/hooks/useOnScreen';
import Conversations from '@/components/conversations';
import useScroll from '@/hooks/useScroll';
import { IMessage } from '@/interfaces/common';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ClearIcon from '@mui/icons-material/Clear';
import CustomProgress from '@/components/progress';
import { ChunkError, ChunkInfo } from '@/interfaces/bundlr';
import ChatBubble from '@/components/chat-bubble';
import DebounceIconButton from '@/components/debounce-icon-button';
import { parseUBalance, sendU } from '@/utils/u';

const Chat = () => {
  const [currentConversationId, setCurrentConversationId] = useState(0);
  const { address } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { currentAddress: userAddr, updateUBalance, currentUBalance } = useContext(WalletContext);
  const previousAddr = usePrevious<string>(userAddr);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [polledMessages, setPolledMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [pendingTxs] = useState<Transaction[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { height } = useWindowDimensions();
  const [chatMaxHeight, setChatMaxHeight] = useState('100%');
  const { enqueueSnackbar } = useSnackbar();
  const elementsPerPage = 5;
  const scrollableRef = useRef<HTMLDivElement>(null);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [responseTimeout, setResponseTimeout] = useState(false);
  const theme = useTheme();
  const { nodeBalance, upload, chunkUpload, getPrice } = useContext(BundlrContext);
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
  const totalChunks = useRef(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  const sendDisabled = useMemo(() => {
    if (!currentConversationId || loading) {
      return true;
    } else {
      return newMessage.length === 0 && !file;
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
      setHasResponseNextPage(responsesData?.transactions?.pageInfo?.hasNextPage || false);
      (async () => reqData([...previousResponses, ...newResponses]))();
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
        updateQuery: commonUpdateQuery,
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
        updateQuery: commonUpdateQuery,
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
      msgIdx < 0 ? await getData(el.node.id, findTag(el, 'fileName')) : polledMessages[msgIdx].msg;
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
      contentType,
      timestamp,
    };

    return msg;
  };

  const asyncMap = async (newData: IEdge[]) => {
    const temp: IMessage[] = [];
    await Promise.all(newData.map(async (el) => temp.push(await mapTransactionsToMessages(el))));

    if (!_.isEqual(temp, polledMessages)) {
      setPolledMessages([...polledMessages, ...temp]);
    }

    const uniqueNewMessages = [...polledMessages, ...temp].filter(
      (el) => !messages.find((msg) => msg.id === el.id),
    );
    const newMessages = [...messages, ...uniqueNewMessages];

    sortMessages(newMessages);

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

  const checkCanSend = async (isFile = false) => {
    if (!currentConversationId) {
      return false;
    }

    let dataSize;
    if (isFile && file) {
      dataSize = file.size;
    } else if (isFile && !file) {
      return false;
    } else {
      dataSize = new TextEncoder().encode(newMessage).length;
    }

    try {
      const messagePrice = await getPrice(dataSize);
      if (!nodeBalance || messagePrice.toNumber() > nodeBalance) {
        enqueueSnackbar('Not Enough Bundlr Funds to send message', { variant: 'error' });
        return false;
      }

      if (currentUBalance < parseUBalance(state.fee)) {
        enqueueSnackbar('Not Enough U tokens to pay Operator', { variant: 'error' });
        return;
      }

      return true;
    } catch (error) {
      enqueueSnackbar('Bundlr Error', { variant: 'error' });
      return false;
    }
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
      enqueueSnackbar(<>Paid Inference costs: {parseUBalance(inferenceFee)} U.</>, {
        variant: 'success',
      });
    } catch (error) {
      enqueueSnackbar('An Error Occurred', { variant: 'error' });
    }
  };

  const handleSend = async (isFile = false) => {
    if (!(await checkCanSend(isFile))) {
      return;
    }

    const contentType = isFile && file ? file?.type : textContentType;
    const content = isFile && file ? file : newMessage;

    const tags = [];
    tags.push({ name: TAG_NAMES.appName, value: APP_NAME });
    tags.push({ name: TAG_NAMES.appVersion, value: APP_VERSION });
    tags.push({ name: TAG_NAMES.scriptName, value: state.scriptName });
    tags.push({ name: TAG_NAMES.scriptCurator, value: state.scriptCurator });
    tags.push({ name: TAG_NAMES.scriptTransaction, value: state.scriptTransaction });
    tags.push({ name: TAG_NAMES.scriptOperator, value: address });
    tags.push({ name: TAG_NAMES.operationName, value: SCRIPT_INFERENCE_REQUEST });
    tags.push({ name: TAG_NAMES.conversationIdentifier, value: `${currentConversationId}` });
    tags.push({ name: TAG_NAMES.paymentQuantity, value: state.fee });
    tags.push({ name: TAG_NAMES.paymentTarget, value: address });
    const tempDate = Date.now() / secondInMS;
    tags.push({ name: TAG_NAMES.unixTime, value: tempDate.toString() });
    tags.push({ name: TAG_NAMES.contentType, value: contentType });
    try {
      let bundlrId;
      if (content instanceof File) {
        setSnackbarOpen(true);
        const finishedPercentage = 100;
        /** Register Event Callbacks */
        // event callback: called for every chunk uploaded
        const handleUpload = (chunkInfo: ChunkInfo) => {
          const chunkNumber = chunkInfo.id + 1;
          // update the progress bar based on how much has been uploaded
          setProgress((chunkNumber / totalChunks.current) * finishedPercentage);
        };

        // event callback: called if an error happens
        const handleError = (e: ChunkError) => {
          setSnackbarOpen(false);
          enqueueSnackbar(
            `Error uploading chunk number ${e.id} - ${
              (e.res as { statusText: string }).statusText
            }`,
            { variant: 'error' },
          );
        };

        // event callback: called when file is fully uploaded
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const handleDone = (_finishRes: unknown) => {
          // set the progress bar to 100
          setProgress(finishedPercentage);
          setSnackbarOpen(false);
        };

        // add file name tag
        tags.push({ name: TAG_NAMES.fileName, value: content.name });
        const bundlrRes = await chunkUpload(
          content,
          tags,
          totalChunks,
          handleUpload,
          handleError,
          handleDone,
        );
        if (bundlrRes.status === successStatusCode) {
          bundlrId = bundlrRes.data.id;
        } else {
          enqueueSnackbar(`Could Not Upload File: ${bundlrRes.statusText}`, { variant: 'error' });
          return;
        }
      } else {
        const bundlrRes = await upload(newMessage, tags);
        bundlrId = bundlrRes.id;
      }

      const temp = [...messages];
      temp.push({
        msg: content,
        type: 'request',
        timestamp: tempDate,
        id: bundlrId,
        cid: currentConversationId,
        height: (await arweave.blocks.getCurrent()).height,
        to: address as string,
        from: userAddr,
        contentType,
      });
      setMessages(temp);
      setNewMessage('');
      setFile(undefined);
      setIsWaitingResponse(true);
      setResponseTimeout(false);
      enqueueSnackbar(
        <>
          Inference Request
          <br></br>
          <a
            href={`https://viewblock.io/arweave/tx/${bundlrId}`}
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

      await handlePayment(bundlrId, state.fee, contentType);
    } catch (error) {
      enqueueSnackbar(JSON.stringify(error), { variant: 'error' });
    }
  };

  const keyDownHandler = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.code === 'Enter') {
      event.preventDefault();
      if (!sendDisabled) {
        await handleSend();
      }
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
    const limitResponses = allResponses.slice(requestsData.transactions.length);
    const allData = [...requestsData.transactions.edges, ...limitResponses];

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
    if (!_.isEqual(newMessages, messages)) {
      // remove duplicates
      setMessages(filteredNewMsgs);
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
    if (file) {
      // handle send file
      await handleSend(true);
    } else {
      await handleSend();
    }
  }, [handleSend, file]);

  const handleCloseSnackbar = useCallback(() => setSnackbarOpen(false), [setSnackbarOpen]);

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
                disabled={!allowText}
                placeholder='Start Chatting...'
              />
            )}
            <Tooltip
              title={!allowFiles ? 'Script does not support Uploading files' : 'File Loaded'}
            >
              <span>
                <IconButton component='label' disabled={uploadDisabled} onClick={handleUploadClick}>
                  <AttachFileIcon />
                  <input type='file' hidden multiple={false} onInput={handleFileUpload} />
                </IconButton>
              </span>
            </Tooltip>

            <DebounceIconButton
              onClick={handleSendClick}
              sx={{ height: '60px', width: '60px', color: theme.palette.neutral.contrastText }}
              disabled={sendDisabled}
            >
              <SendIcon />
            </DebounceIconButton>
          </Box>
          <Snackbar
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            open={snackbarOpen}
            onClose={handleCloseSnackbar}
            ClickAwayListenerProps={{ onClickAway: () => null }}
          >
            <Alert severity='info' sx={{ width: '100%', minWidth: '300px' }}>
              Uploading...
              <CustomProgress value={progress}></CustomProgress>
            </Alert>
          </Snackbar>
        </Grid>
      </Grid>
      <Outlet />
    </>
  );
};

export default Chat;
