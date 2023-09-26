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
  Drawer,
  FormControl,
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
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  PROTOCOL_VERSION,
  TAG_NAMES,
  PROTOCOL_NAME,
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
  DEFAULT_TAGS,
  TX_ORIGIN,
  ATOMIC_ASSET_CONTRACT_SOURCE_ID,
  UDL_ID,
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
import { commonUpdateQuery, findTag, parseCost, printSize } from '@/utils/common';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import _ from 'lodash';
import '@/styles/main.css';
import useOnScreen from '@/hooks/useOnScreen';
import Conversations from '@/components/conversations';
import useScroll from '@/hooks/useScroll';
import { IMessage, IConfiguration } from '@/interfaces/common';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ClearIcon from '@mui/icons-material/Clear';
import ChatBubble from '@/components/chat-bubble';
import DebounceIconButton from '@/components/debounce-icon-button';
import { parseUBalance, sendU } from '@/utils/u';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Configuration from '@/components/configuration';
import useComponentDimensions from '@/hooks/useComponentDimensions';
import { WarpFactory } from 'warp-contracts';
import { DeployPlugin } from 'warp-contracts-plugin-deploy';

const warp = WarpFactory.forMainnet().use(new DeployPlugin());

const InputField = ({
  file,
  loading,
  disabled,
  currentConversationId,
  newMessage,
  inputRef,
  handleAdvanced,
  handleSendFile,
  handleSendText,
  handleRemoveFile,
  handleMessageChange,
  handleUploadClick,
  handleFileUpload,
}: {
  file?: File;
  loading: boolean;
  disabled: boolean;
  currentConversationId: number;
  newMessage: string;
  inputRef: RefObject<HTMLTextAreaElement>;
  handleAdvanced: () => void;
  handleSendFile: () => Promise<void>;
  handleSendText: () => Promise<void>;
  handleRemoveFile: () => void;
  handleMessageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleUploadClick: () => void;
  handleFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) => {
  const theme = useTheme();
  const { state } = useLocation();

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
  const [isSending, setIsSending] = useState(false);

  const sendDisabled = useMemo(() => {
    if (isSending) {
      return true;
    } else if (!currentConversationId || loading) {
      return true;
    } else {
      return (newMessage.length === 0 || newMessage.length >= MAX_MESSAGE_SIZE) && !file;
    }
  }, [newMessage, file, currentConversationId, loading, isSending]);

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

  // avoid send duplicated messages and show the new line if it's only the Enter key
  const keyDownHandler = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.code === 'Enter' && !event.shiftKey) {
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
  };

  if (loading || file) {
    return (
      <FormControl variant='outlined' fullWidth>
        {file && (
          <TextField
            value={file?.name}
            disabled={disabled}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <IconButton aria-label='Remove' onClick={handleRemoveFile}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
              endAdornment: <InputAdornment position='start'>{printSize(file)}</InputAdornment>,
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
    );
  } else {
    return (
      <>
        <TextField
          inputRef={inputRef}
          multiline
          minRows={1}
          maxRows={3}
          sx={{
            background: theme.palette.background.default,
            fontStyle: 'normal',
            fontWeight: 400,
            fontSize: '20px',
            lineHeight: '16px',
            width: '100%',
            marginTop: '10px',
            borderRadius: '8px',
          }}
          InputProps={{
            endAdornment: (
              <>
                <Tooltip title={'Advanced Input configuration'}>
                  <span>
                    <IconButton component='label' onClick={handleAdvanced}>
                      <SettingsIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip
                  title={!allowFiles ? 'Script does not support Uploading files' : 'File Loaded'}
                >
                  <span>
                    <IconButton
                      component='label'
                      disabled={uploadDisabled}
                      onClick={handleUploadClick}
                    >
                      <AttachFileIcon />
                      <input type='file' hidden multiple={false} onInput={handleFileUpload} />
                    </IconButton>
                  </span>
                </Tooltip>

                <DebounceIconButton
                  onClick={handleSendClick}
                  sx={{
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
          disabled={isSending || disabled || !allowText}
          placeholder='Start Chatting...'
        />
      </>
    );
  }
};

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
  const chatRef = useRef<HTMLDivElement>(null);
  const { width, height } = useWindowDimensions();
  const { width: chatWidth } = useComponentDimensions(chatRef);
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

  const [drawerOpen, setDrawerOpen] = useState(true);
  const [configurationDrawerOpen, setConfigurationDrawerOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState('64px');

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const assetNamesRef = useRef<HTMLTextAreaElement>(null);
  const negativePromptRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const nImagesRef = useRef<number>(0);
  const customTagsRef = useRef<{ name: string; value: string }[]>([]);
  const keepConfigRef = useRef<HTMLInputElement>(null);

  const isStableDiffusion = useMemo(
    () => findTag(state.fullState, 'outputConfiguration') === 'stable-diffusion',
    [state],
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
        ...DEFAULT_TAGS,
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
        ...DEFAULT_TAGS,
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
        ...DEFAULT_TAGS,
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

      const tagsRequests = [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.scriptName, values: [state.scriptName] },
        { name: TAG_NAMES.scriptCurator, values: [state.scriptCurator] },
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
    // find latest request
    const lastRequest = filteredNewMsgs.findLast((el) => el.type === 'request');
    if (lastRequest) {
      const responses = filteredNewMsgs.filter(
        (el) =>
          el.type === 'response' &&
          el.tags.find((tag) => tag.name === TAG_NAMES.requestTransaction)?.value ===
            lastRequest.id,
      );
      const nImages = lastRequest.tags.find((tag) => tag.name === TAG_NAMES.nImages)?.value;
      if (nImages && isStableDiffusion) {
        setIsWaitingResponse(responses.length < parseInt(nImages, 10));
        setResponseTimeout(false);
      } else if (isStableDiffusion) {
        const defaultNImages = 4;
        setIsWaitingResponse(responses.length < defaultNImages);
        setResponseTimeout(false);
      } else {
        setIsWaitingResponse(responses.length < 1);
        setResponseTimeout(false);
      }
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

  const getUploadTags = (contentType: string, configuration: IConfiguration, fileName?: string) => {
    const tags = [];
    tags.push({ name: TAG_NAMES.protocolName, value: PROTOCOL_NAME });
    tags.push({ name: TAG_NAMES.protocolVersion, value: PROTOCOL_VERSION });
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

    addConfigTags(tags, configuration);

    // add atomic asset tags
    const manifest = {
      evaluationOptions: {
        sourceType: 'redstone-sequencer',
        allowBigInt: true,
        internalWrites: true,
        unsafeClient: 'skip',
        useConstructor: false,
      },
    };
    const initState = {
      firstOwner: userAddr,
      canEvolve: false,
      balances: {
        [userAddr]: 1,
      },
      name: 'Fair Protocol Prompt Atomic Asset',
      ticker: 'FPPAA',
    };

    tags.push({ name: TAG_NAMES.appName, value: 'SmartWeaveContract' });
    tags.push({ name: TAG_NAMES.appVersion, value: '0.3.0' });
    tags.push({ name: TAG_NAMES.contractSrc, value: ATOMIC_ASSET_CONTRACT_SOURCE_ID }); // use contract source here

    tags.push({
      name: TAG_NAMES.contractManifest,
      value: JSON.stringify(manifest),
    });
    tags.push({
      name: TAG_NAMES.initState,
      value: JSON.stringify(initState),
    });

    tags.push({ name: TAG_NAMES.license, value: UDL_ID });
    tags.push({ name: TAG_NAMES.derivation, value: 'Allowed-With-License-Passthrough' });
    tags.push({ name: TAG_NAMES.commercialUse, value: 'Allowed' });

    return tags;
  };

  const addConfigTags = (tags: ITag[], configuration: IConfiguration) => {
    if (configuration.assetNames && configuration.assetNames.length > 0) {
      tags.push({ name: TAG_NAMES.assetNames, value: JSON.stringify(configuration.assetNames) });
    }

    if (configuration.negativePrompt) {
      tags.push({ name: TAG_NAMES.negativePrompt, value: configuration.negativePrompt });
    }

    if (configuration.description) {
      tags.push({ name: TAG_NAMES.description, value: configuration.description });
    }

    if (configuration.customTags && configuration.customTags?.length > 0) {
      tags.push({
        name: TAG_NAMES.userCustomTags,
        value: JSON.stringify(configuration.customTags),
      });
    }

    if (configuration.nImages && configuration.nImages > 0) {
      tags.push({ name: TAG_NAMES.nImages, value: nImagesRef.current.toString() });
    }
  };

  const handlePayment = async (
    bundlrId: string,
    inferenceFee: string,
    contentType: string,
    configuration: IConfiguration,
  ) => {
    const parsedUFee = parseFloat(inferenceFee);
    try {
      const paymentTags = [
        { name: TAG_NAMES.protocolName, value: PROTOCOL_NAME },
        { name: TAG_NAMES.protocolVersion, value: PROTOCOL_VERSION },
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

      //
      addConfigTags(paymentTags, configuration);

      let adjustedInferenceFee = parsedUFee;
      const nImages = configuration.nImages;
      if (isStableDiffusion && nImages && nImages > 0) {
        // calculate fee for n-images
        adjustedInferenceFee = parsedUFee * nImages;
      } else if (isStableDiffusion) {
        // default n images is 4 if not specified
        const defaultNImages = 4;
        adjustedInferenceFee = parsedUFee * defaultNImages;
      } else {
        // no need to change inference fee
      }

      const operatorFeeShare = adjustedInferenceFee * OPERATOR_PERCENTAGE_FEE;
      const marketPlaceFeeShare = adjustedInferenceFee * MARKETPLACE_PERCENTAGE_FEE;
      const creatorFeeShare = adjustedInferenceFee * CREATOR_PERCENTAGE_FEE;
      const curatorFeeShare = adjustedInferenceFee * CURATOR_PERCENTAGE_FEE;

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
      const nDigits = 4;
      const usdFee = (await parseCost(parseUBalance(adjustedInferenceFee.toString()))).toFixed(
        nDigits,
      );
      enqueueSnackbar(
        <Typography>{`Paid Inference costs: ${usdFee}$ (${parseUBalance(
          adjustedInferenceFee.toString(),
        )} $U)`}</Typography>,
        {
          variant: 'success',
        },
      );
    } catch (error) {
      enqueueSnackbar('An Error Occurred', { variant: 'error' });
    }
  };

  const clearConfigInputs = () => {
    if (assetNamesRef?.current) {
      assetNamesRef.current.value = '';
    }
    if (negativePromptRef?.current) {
      negativePromptRef.current.value = '';
    }
    if (descriptionRef?.current) {
      descriptionRef.current.value = '';
    }
    if (customTagsRef?.current) {
      customTagsRef.current = [];
    }
    if (nImagesRef.current) {
      nImagesRef.current = 4;
    }
  };

  const getConfigValues = () => {
    const assetNames = assetNamesRef?.current?.value
      ? assetNamesRef.current.value.split(';').map((el) => el.trim())
      : undefined;
    const negativePrompt = negativePromptRef?.current?.value;
    const description = descriptionRef?.current?.value;
    const customTags = customTagsRef?.current;
    const nImages = nImagesRef?.current;

    return {
      assetNames,
      negativePrompt,
      description,
      customTags,
      nImages,
    };
  };

  const updateMessages = async (
    txid: string,
    content: string | File,
    contentType: string,
    tags: ITag[],
  ) => {
    setNewMessage('');
    if (inputRef?.current) {
      inputRef.current.value = '';
    }
    if (!keepConfigRef.current?.checked) {
      clearConfigInputs();
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
      const configuration = getConfigValues();
      const tags: ITag[] = getUploadTags(content.name, configuration, contentType);
      // upload with dispatch
      const data = await content.arrayBuffer(); // it's safe to convert to arrayBuffer bc max size is 100kb
      const tx = await arweave.createTransaction({ data });
      tags.forEach((tag) => tx.addTag(tag.name, tag.value));

      const { id: txid } = await dispatchTx(tx);

      if (!txid) {
        enqueueSnackbar('An Error Occurred', { variant: 'error' });
        return;
      }
      await updateMessages(txid, content, contentType, tags);
      await warp.register(txid, 'node2');
      await handlePayment(txid, state.fee, contentType, configuration);
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

    try {
      const configuration = getConfigValues();
      const tags: ITag[] = getUploadTags(contentType, configuration);

      // upload with dispatch
      const tx = await arweave.createTransaction({ data: newMessage });
      tags.forEach((tag) => tx.addTag(tag.name, tag.value));

      const { id: txid } = await dispatchTx(tx);
      if (!txid) {
        enqueueSnackbar('An Error Occurred.', { variant: 'error' });
        return;
      }
      await updateMessages(txid, newMessage, contentType, tags);
      await warp.register(txid, 'node2');
      await handlePayment(txid, state.fee, contentType, configuration);
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

    // find latest request
    const lastRequest = filteredNewMsgs.findLast((el) => el.type === 'request');
    if (lastRequest) {
      const responses = filteredNewMsgs.filter(
        (el) =>
          el.type === 'response' &&
          el.tags.find((tag) => tag.name === TAG_NAMES.requestTransaction)?.value ===
            lastRequest.id,
      );
      const nImages = lastRequest.tags.find((tag) => tag.name === TAG_NAMES.nImages)?.value;
      if (nImages && isStableDiffusion) {
        setIsWaitingResponse(responses.length < parseInt(nImages, 10));
        setResponseTimeout(false);
      } else if (isStableDiffusion) {
        const defaultNImages = 4;
        setIsWaitingResponse(responses.length < defaultNImages);
        setResponseTimeout(false);
      } else {
        setIsWaitingResponse(responses.length < 1);
        setResponseTimeout(false);
      }
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

  const handleMessageChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setNewMessage(event.target.value),
    [setNewMessage],
  );

  useLayoutEffect(() => {
    setInputWidth(chatWidth);
  }, [chatWidth]);

  useLayoutEffect(() => {
    const currInputHeight = document.querySelector('#chat-input')?.clientHeight;
    if (currInputHeight) {
      const margins = 16; // 8px on each side
      setInputHeight(currInputHeight + margins);
    }

    const currHeaderHeight = document.querySelector('header')?.clientHeight;
    if (currHeaderHeight) {
      setHeaderHeight(`${currHeaderHeight}px`);
    }
  }, [width, height]);

  const handleAdvanced = useCallback(() => {
    setConfigurationDrawerOpen((previousValue) => {
      if (!previousValue) {
        setDrawerOpen(false);
      }

      return !previousValue;
    });
  }, [setDrawerOpen, setConfigurationDrawerOpen]);

  const handleAdvancedClose = useCallback(() => {
    setConfigurationDrawerOpen(false);
  }, [setConfigurationDrawerOpen]);

  const handleShowConversations = useCallback(() => {
    setConfigurationDrawerOpen(false);
    setDrawerOpen(true);
  }, [setConfigurationDrawerOpen, setDrawerOpen]);

  return (
    <>
      <Drawer
        variant='persistent'
        anchor='right'
        open={configurationDrawerOpen}
        sx={{
          '& .MuiDrawer-paper': {
            width: '30%',
            boxSizing: 'border-box',
            top: headerHeight,
            height: `calc(100% - ${headerHeight})`,
          },
        }}
        PaperProps={{
          elevation: 24,
        }}
      >
        <Box sx={{ height: '100%', display: 'flex' }}>
          <Configuration
            assetNamesRef={assetNamesRef}
            negativePromptRef={negativePromptRef}
            keepConfigRef={keepConfigRef}
            descriptionRef={descriptionRef}
            nImagesRef={nImagesRef}
            customTagsRef={customTagsRef}
            handleClose={handleAdvancedClose}
          />
        </Box>
      </Drawer>
      <Box sx={{ height: '100%', display: 'flex' }}>
        <Drawer
          variant='persistent'
          anchor='left'
          open={drawerOpen}
          sx={{
            width: '240px',
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: '240px',
              boxSizing: 'border-box',
              top: headerHeight,
              height: `calc(100% - ${headerHeight})`,
              border: 'none',
            },
          }}
        >
          <Conversations
            currentConversationId={currentConversationId}
            setCurrentConversationId={setCurrentConversationId}
            state={state}
            userAddr={userAddr}
            drawerOpen={drawerOpen}
            setDrawerOpen={setDrawerOpen}
          />
        </Drawer>
        <Box
          id='chat'
          sx={{
            width: '100%',
            height: '100%',
            bgcolor: 'background.paper',
            display: 'flex',
            flexGrow: 1,
            background: theme.palette.background.default,
            transition: theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            marginLeft: '-240px',
            ...(drawerOpen && {
              transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
              }),
              marginLeft: 0,
            }),
            marginRight: '0',
            ...(configurationDrawerOpen && {
              transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
              }),
              marginRight: '30%',
            }),
            alignItems: 'center',
          }}
        >
          {!drawerOpen && (
            <Paper
              sx={{
                borderRight: '8px',
                border: '0.5px solid',
                borderTopLeftRadius: '0px',
                borderBottomLeftRadius: '0px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Box>
                <IconButton onClick={handleShowConversations} disableRipple={true}>
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            </Paper>
          )}
          <Box
            ref={chatRef}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              width: '100%',
              height: '100%',
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
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '8px',
                justifyContent: 'flex-start',
                position: 'absolute',
                margin: '8px 0px',
                width: inputWidth,
                paddingRight: '24px',
                paddingLeft: '8px',
              }}
            >
              <InputField
                file={file}
                loading={loading}
                disabled={isWaitingResponse}
                currentConversationId={currentConversationId}
                newMessage={newMessage}
                inputRef={inputRef}
                handleAdvanced={handleAdvanced}
                handleFileUpload={handleFileUpload}
                handleUploadClick={handleUploadClick}
                handleRemoveFile={handleRemoveFile}
                handleSendFile={handleSendFile}
                handleSendText={handleSendText}
                handleMessageChange={handleMessageChange}
              />
              {newMessage.length >= MAX_MESSAGE_SIZE && (
                <Typography
                  variant='subtitle1'
                  sx={{ color: theme.palette.error.main, fontWeight: 500, paddingLeft: '20px' }}
                >
                  Message Too Long
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
      <Outlet />
    </>
  );
};

export default Chat;
