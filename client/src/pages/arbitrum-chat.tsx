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

import React, { ChangeEvent, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
// icons
import { INFERENCE_REQUEST, MAX_MESSAGE_SIZE, N_PREVIOUS_BLOCKS, TAG_NAMES } from '@/constants';
import { InfoOutlined } from '@mui/icons-material';
import { TextField, Typography, useTheme, Box, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Tooltip, SelectChangeEvent, IconButton, Drawer, Backdrop, CircularProgress, Zoom, Fab, Paper } from '@mui/material';
import DebounceIconButton from '@/components/debounce-icon-button';
import { EVMWalletContext } from '@/context/evm-wallet';
import { UserFeedbackContext } from '@/context/user-feedback';
import useRatingFeedback from '@/hooks/useRatingFeedback';
import SendIcon from '@mui/icons-material/Send';
import useOperatorBusy from '@/hooks/useOperatorBusy';
import { useLocation } from 'react-router-dom';
import SettingsIcon from '@mui/icons-material/Settings';
import { IMessage, OperatorData } from '@/interfaces/common';
import { displayShortTxOrAddr, findTag } from '@/utils/common';
import useOperators from '@/hooks/useOperators';
import { findByTagsQuery } from '@fairai/evm-sdk';
import { IEdge, ITag } from '@/interfaces/arweave';
import useRequests from '@/hooks/useRequests';
import useResponses from '@/hooks/useResponses';
import { NetworkStatus } from '@apollo/client';
import _ from 'lodash';
import arweave, { getData } from '@/utils/arweave';
import { useSnackbar } from 'notistack';
import { encryptSafely } from '@metamask/eth-sig-util';
import Query from '@irys/query';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import CloseIcon from '@mui/icons-material/Close';
import useScroll from '@/hooks/useScroll';
import useComponentDimensions from '@/hooks/useComponentDimensions';
import ChatContent from '@/components/chat-content';

const InputField = ({
  newMessage,
  handleSendText,
  handleMessageChange,
  handleSettingsOpen,
}: {
  newMessage: string;
  handleSendText: () => Promise<void>;
  handleMessageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSettingsOpen: () => void;
}) => {
  const theme = useTheme();

  const { setOpen: setOpenRating } = useContext(UserFeedbackContext);
  const { currentAddress: userAddr } = useContext(EVMWalletContext);
  const { showFeedback, setShowFeedback } = useRatingFeedback(userAddr);


  const [isSending, setIsSending] = useState(false);

  const sendDisabled = useMemo(() => {
    if (isSending) {
      return true;
    } else {
      return (newMessage.length === 0 || newMessage.length >= MAX_MESSAGE_SIZE);
    }
  }, [newMessage, isSending]);

  const handleSendClick = useCallback(async () => {
    if (isSending) {
      return;
    } else {
      // continue
    }
    setIsSending(true);

    await handleSendText();

    setIsSending(false);
    // if user is active and has not submitted feedback, show feedback
    if (showFeedback) {
      setTimeout(() => {
        setOpenRating(true);
        setShowFeedback(false);
      }, 2000);
    }
  }, [ handleSendText, setOpenRating, isSending, showFeedback]);

  // avoid send duplicated messages and show the new line if it's only the Enter key
  const keyDownHandler = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.code === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!sendDisabled && !isSending) {
        setIsSending(true);
        await handleSendText();
        setIsSending(false);
      }
    }
  };


  return (
      <Box sx={{ display: 'flex', width: '100%', gap: '8px' }}>
        <TextField
          value={newMessage}
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
            sx: {
              padding: '10px 14px'
            },
            endAdornment: (
              <>
                <DebounceIconButton
                  onClick={handleSendClick}
                  sx={{
                    color: theme.palette.neutral.contrastText,
                  }}
                  disabled={sendDisabled}
                  className='plausible-event-name=Send+Text+Click'
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
          disabled={isSending}
          placeholder='Start Chatting...'
        />
        <IconButton sx={{
          backgroundColor: '#9ecced',
          borderRadius: '8px',
          marginTop: '10px'
        }} onClick={handleSettingsOpen}>
          <SettingsIcon />
        </IconButton>
      </Box>
    );
};

const ArbitrumChat = () => {
  const showOperatorBusy = useOperatorBusy('');
  const {
    state,
  }: {
    state: {
      defaultOperator?: OperatorData;
      solution: findByTagsQuery['transactions']['edges'][0];
      availableOperators: OperatorData[];
    };
  } = useLocation();
  const { currentAddress, usdcBalance, updateUsdcBalance, prompt, getPubKey } = useContext(EVMWalletContext);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const scrollableRef = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLDivElement>(null);
  const [requestIds] = useState<string[]>([]);
  const [ currentPubKey, setCurrentPubKey] = useState('');
  const [previousResponses, setPreviousResponses] = useState<IEdge[]>([]);
  const [ messagesLoading, setMessagesLoading] = useState(false);
  const [ isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [ responseTimeout, setResponseTimeout] = useState(false);
  const [ currentOperator, setCurrentOperator ] = useState(state.defaultOperator);
  const [ privateMode, setPrivateMode ] = useState(false);
  const [ settingsOpen, setSettingsOpen ] = useState(false);
  const [headerHeight, setHeaderHeight] = useState('64px');
  const { width, height } = useWindowDimensions();
  const [ isLayoverOpen, setIsLayoverOpen ] = useState(false);
  const { isNearTop } = useScroll(scrollableRef);
  const [inputWidth, setInputWidth] = useState('');
  const [inputHeight, setInputHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const { width: chatWidth } = useComponentDimensions(chatRef);
  const [chatMaxHeight, setChatMaxHeight] = useState('100%');

  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const defaultConversation = 1;
  const elementsPerPage = 10;

  const [requestParams, setRequestParams] = useState({
    target,
    scrollableRef,
    userAddr: currentAddress,
    solutionTx: state.solution.node.id,
    conversationId: defaultConversation,
    first: elementsPerPage,
  });
  const [responseParams, setResponseParams] = useState({
    userAddr: currentAddress,
    reqIds: requestIds,
    conversationId: defaultConversation,
    lastRequestId: '',
  });

  const { requestsData, requestNetworkStatus, hasRequestNextPage, requestError, fetchMore } =
    useRequests(requestParams);

  const { responsesData, responseNetworkStatus, responsesPollingData, responseError } =
    useResponses(responseParams);

  const showError = useMemo(() => !!requestError || !!responseError, [requestError, responseError]);
  const showLoadMore = useMemo(
    () => isNearTop && hasRequestNextPage && !messagesLoading,
    [isNearTop, hasRequestNextPage, messagesLoading],
  );

  const { validTxs: operatorsData } = useOperators([ state.solution ]);

  useEffect(() => {
    if (operatorsData.length > 0) {
      setCurrentOperator(operatorsData[0]);
    }
  }, [ operatorsData ]);

  const handleMessageChange = useCallback((event: ChangeEvent<HTMLInputElement>) => setNewMessage(event.target.value), [ setNewMessage ]);

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

  useEffect(() => {
    const pubKey = localStorage.getItem(`pubKeyFor:${currentAddress}`);

    if (!pubKey) {
      (async () => {
        const key = await getPubKey();
        localStorage.setItem(`pubKeyFor:${currentAddress}`, key);
        setCurrentPubKey(key);
      })();
    } else {
      setCurrentPubKey(pubKey);
    }
  }, [currentAddress, setCurrentPubKey]);

  useEffect(() => {
    if (currentAddress) {
      setMessagesLoading(true);
      setRequestParams((previousParams) => ({
        ...previousParams,
        userAddr: currentAddress,
      }));
    } else {
      // ignore
    }
  }, [ currentAddress ]);

  useEffect(() => {
    if (requestsData && requestNetworkStatus === NetworkStatus.ready) {
      //
      const reqIds = requestsData.transactions.edges.map((el: IEdge) => el.node.id);

      if (reqIds.length > 0) {
        (async () => reqData())();
        setResponseParams({
          ...responseParams,
          userAddr: currentAddress,
          reqIds,
        });
      } else {
        setResponseParams({
          ...responseParams,
          reqIds,
          lastRequestId: '',
        });
        setMessagesLoading(false);
        setMessages([]);
      }
    }
  }, [requestsData, requestNetworkStatus, currentAddress ]);

  useEffect(() => {
    // only update messages after getting all responses
    const hasResponsesNextPage = responsesData?.transactions.pageInfo.hasNextPage;
    if (responsesData && responseNetworkStatus === NetworkStatus.ready && !hasResponsesNextPage) {
      const newResponses = responsesData.transactions.edges.filter(
        (previous: IEdge) =>
          !previousResponses.find((current: IEdge) => current.node.id === previous.node.id),
      );
      if (newResponses.length > 0) {
        setPreviousResponses((prev) => [...prev, ...newResponses]);
        (async () => {
          await reqData([...previousResponses, ...newResponses]);
          setMessagesLoading(false);
        })();
      } else {
        setMessagesLoading(false);
      }
    }
  }, [responsesData, responseNetworkStatus]);

  useEffect(() => {
    if (!responsesPollingData) {
      return;
    }

    const responses = responsesPollingData?.transactions?.edges || [];
    const currentRespones = previousResponses;
    const newValidResponses = responses.filter(
      (res: IEdge) => !currentRespones.find((el: IEdge) => el.node.id === res.node.id),
    );
    (async () => {
      if (newValidResponses.length > 0) {
        setPreviousResponses([...currentRespones, ...newValidResponses]);
        await asyncMap(newValidResponses);
      } else {
        await emptyPolling();
      }
    })();
  }, [responsesPollingData]);

  const mapTransactionsToMessages = async (el: IEdge) => {
    const msgIdx = messages.findIndex((m) => m.id === el.node.id);

    const contentType = findTag(el, 'contentType');
    const data =
      msgIdx <= 0 ? await getData(el.node.id, findTag(el, 'fileName')) : messages[msgIdx].msg;
    const timestamp =
      parseInt(findTag(el, 'unixTime') || '', 10) || el.node.block?.timestamp || Date.now() / 1000;
    const cid = findTag(el, 'conversationIdentifier') as string;
    const currentHeight = (await arweave.blocks.getCurrent()).height;
    const isRequest = findTag(el, 'operationName') === INFERENCE_REQUEST;

    const msg: IMessage = {
      id: el.node.id,
      msg: data,
      type: isRequest ? 'request' : 'response',
      cid: parseInt(cid?.split('-')?.length > 1 ? cid?.split('-')[1] : cid, 10),
      height: el.node.block ? el.node.block.height : currentHeight,
      to: isRequest ? (findTag(el, 'solutionOperator') as string) : currentAddress,
      from: isRequest ? currentAddress : el.node.address,
      tags: el.node.tags,
      contentType,
      timestamp,
    };

    return msg;
  };

  const asyncMap = async (newData: IEdge[]) => {
    const temp: IMessage[] = [];

    const filteredData = newData.filter((el: IEdge) => {
      const cid = findTag(el, 'conversationIdentifier');
      if (cid && cid.split('-').length > 1) {
        return parseInt(cid.split('-')[1], 10) === defaultConversation;
      } else if (cid) {
        return parseInt(cid, 10) === defaultConversation;
      } else {
        return false;
      }
    });

    await Promise.all(
      filteredData.map(async (el) => temp.push(await mapTransactionsToMessages(el))),
    );

    const allnewMessages = [...temp, ...messages];
    setMessages((prev) => {
      const uniqueNewMsgs = _.uniqBy([...prev, ...allnewMessages], 'id').filter(
        (el) => el.cid === defaultConversation,
      );
      sortMessages(uniqueNewMsgs);

      checkIsWaitingResponse(uniqueNewMsgs);
      return uniqueNewMsgs;
    });
  };

  const checkIsWaitingResponse = (filteredNewMsgs: IMessage[]) => {
    const lastRequest = filteredNewMsgs.findLast((el) => el.type === 'request');
    if (lastRequest) {
      const responses = filteredNewMsgs.filter(
        (el) =>
          el.type === 'response' &&
          el.tags.find((tag) => tag.name === TAG_NAMES.requestTransaction)?.value ===
            lastRequest.id,
      );

      setIsWaitingResponse(responses.length < 1);
      setResponseTimeout(false);
    }
  };

  const reqData = async (allResponses?: IEdge[]) => {
    const previousRequest = requestsData?.transactions?.edges ?? [];
    let allData = [...previousRequest];
    if (allResponses && allResponses.length > 0) {
      allData = allData.concat(allResponses);
    }

    const filteredData = allData.filter((el: IEdge) => {
      const cid = findTag(el, 'conversationIdentifier');
      if (cid && cid.split('-').length > 1) {
        return parseInt(cid.split('-')[1], 10) === defaultConversation;
      } else if (cid) {
        return parseInt(cid, 10) === defaultConversation;
      } else {
        return false;
      }
    });

    const temp: IMessage[] = [];
    await Promise.all(
      filteredData.map(async (el: IEdge) => temp.push(await mapTransactionsToMessages(el))),
    );

    const allnewMessages = [...temp, ...messages];

    setMessages((prev) => {
      const uniqueNewMsgs = _.uniqBy([...prev, ...allnewMessages], 'id').filter(
        (el) => el.cid === defaultConversation,
      );
      sortMessages(uniqueNewMsgs);

      checkIsWaitingResponse(uniqueNewMsgs);
      return uniqueNewMsgs;
    });
  };

  const emptyPolling = async () => {
    const currentBlockHeight = (await arweave.blocks.getCurrent()).height;
    const lastMessage = [...messages.filter((el) => el.cid === defaultConversation)].pop();
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

  const checkCanSend = useCallback((dataSize: number) => {
    try {
      if (dataSize > MAX_MESSAGE_SIZE) {
        enqueueSnackbar(
          'Message Too Long. Message must not be bigger than 50kb, or 50000 characters.',
          { variant: 'error' },
        );
        return false;
      }

      if (!currentOperator) {
        enqueueSnackbar('No Operator Selected', { variant: 'error' });
        return false;
      }
      
      const actualFee = currentOperator.operatorFee;
      
      if (usdcBalance < actualFee) {
        enqueueSnackbar('Not Enough USDC to pay Operator', { variant: 'error' });
        return false;
      }

      return true;
    } catch (error) {
      enqueueSnackbar('Something went wrong', { variant: 'error' });
      return false;
    }
  }, [ currentOperator, usdcBalance ]);

  const handleSendText = useCallback(async () => {
    if (!newMessage) {
      return;
    }
    const dataSize = new TextEncoder().encode(newMessage).length;

    if (!checkCanSend(dataSize)) {
      return;
    }

    try {

      let dataToUpload: string | { promptHistory?: string; prompt: string } = {
        prompt: newMessage,
      };

      if (privateMode) {
        const encrypted = encryptSafely({
          data: dataToUpload,
          publicKey: currentPubKey,
          version: 'x25519-xsalsa20-poly1305',
        });

        const encForOperator = encryptSafely({
          data: dataToUpload,
          publicKey: currentOperator?.evmPublicKey ?? '',
          version: 'x25519-xsalsa20-poly1305',
        });

        dataToUpload = JSON.stringify({
          encPrompt: encrypted,
          encForOperator,
        });
      }

      if (dataToUpload instanceof Object) {
        dataToUpload = JSON.stringify(dataToUpload);
      }

      setIsLayoverOpen(true);
      const { arweaveTxId } = await prompt(
        dataToUpload,
        state.solution.node.id,
        {
          arweaveWallet: currentOperator?.arweaveWallet ?? '',
          evmWallet: currentOperator?.evmWallet ?? ('' as `0x${string}`),
          operatorFee: currentOperator?.operatorFee ?? 0,
        },
        defaultConversation,
        {
          privateMode,
          ...privateMode && { userPubKey: currentPubKey },
          modelName: ''
        },
      );
      // update balance after payments
      updateMessages(arweaveTxId, newMessage, 'text/plain');
      updateUsdcBalance(usdcBalance - (currentOperator?.operatorFee ?? 0));
      setIsLayoverOpen(false);
      enqueueSnackbar('Request Successfull', {
        variant: 'success',
      });
    } catch (error) {
      if (error instanceof Object) {
        enqueueSnackbar(JSON.stringify(error), { variant: 'error' });
      } else if (error instanceof String) {
        enqueueSnackbar(error, { variant: 'error' });
      } else {
        enqueueSnackbar('Something Went Wrong', { variant: 'error' });
      }
    }
  }, [ newMessage, currentOperator, currentPubKey, privateMode, state, usdcBalance, checkCanSend ]);

  const updateMessages = async (txid: string, content: string | File, contentType: string) => {
    setNewMessage('');
    setIsWaitingResponse(true);
    setResponseTimeout(false);
    const irysQuery = new Query();

    const [{ tags }] = await irysQuery.search('irys:transactions').ids([txid]).limit(1);
    const url = `https://gateway.irys.xyz/${txid}`;

    enqueueSnackbar(
      <>
        Inference Request
        <br></br>
        <a href={url} target={'_blank'} rel='noreferrer'>
          <u>View Transaction in Explorer</u>
        </a>
      </>,
      {
        variant: 'success',
      },
    );
    const temp = messages.length > 0 ? [...messages] : [];
    const currentHeight = (await arweave.blocks.getCurrent()).height;

    temp.push({
      msg: content,
      type: 'request',
      timestamp: parseFloat(tags.find((tag: ITag) => tag.name === TAG_NAMES.unixTime)?.value as string),
      id: txid,
      cid: defaultConversation,
      height: currentHeight,
      to: currentOperator?.arweaveWallet ?? '',
      from: currentAddress,
      contentType,
      tags,
    });
    setMessages(temp);
    setResponseParams({
      ...responseParams,
      conversationId: defaultConversation,
      lastRequestId: txid,
      reqIds: [],
    });
  };

  const handleOperatorChange = useCallback(
    (event: SelectChangeEvent) => {
      const operator = operatorsData.find(
        (operator) => operator.evmWallet === event.target.value,
      );
      if (operator) {
        setCurrentOperator(operator);
      } else {
        // ifgnore
      }
    },
    [ operatorsData, setCurrentOperator ],
  );

  const handlePrivateModeChanged = useCallback(() => setPrivateMode(prev => !prev), [ setPrivateMode ]);

  const handleSettingsOpen = useCallback(() => setSettingsOpen(!settingsOpen), [ settingsOpen, setSettingsOpen ]);

  const handleLoadMore = useCallback(() => {
    fetchMore();
    setMessagesLoading(true);
  }, [ fetchMore ]);

  useEffect(() => {
    console.log('scrollableRef', scrollableRef);
  }, [ scrollableRef ]);

  useLayoutEffect(() => {
    setInputWidth(`calc(${chatWidth}px - 16px)`);
  }, [chatWidth]);

  useEffect(() => {
    const currHeaderHeight = document.querySelector('header')?.clientHeight as number;
    setChatMaxHeight(`${height - currHeaderHeight}px`);
  }, [height]);

  return (<>
    <Backdrop
      sx={{ color: '#fff', zIndex: (t) => t.zIndex.drawer + 1 }}
      open={isLayoverOpen}
    >
      <Typography>
        {'Please contine on the popup extension.'}
      </Typography>
    </Backdrop>
    <Drawer
      variant='persistent'
      anchor='right'
      open={settingsOpen}
      onClose={handleSettingsOpen}
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '16px',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            paddingTop: '16px',
          },
        }}
      >
        <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
          <IconButton onClick={handleSettingsOpen} className='plausible-event-name=Close+Configuration'>
            <CloseIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 700, fontSize: '23px', lineHeight: '31px' }}>
            {'Configuration'}
          </Typography>
        </Box>
        <FormControl fullWidth margin='none'>
          <InputLabel>{'Solution Operator'}</InputLabel>
          <Select
            label={'Solution Operator'}
            value={currentOperator?.evmWallet || ''}
            onChange={handleOperatorChange}
            renderValue={(value) => (
              <Typography>{displayShortTxOrAddr(value as string)}</Typography>
            )}
          >
            {operatorsData.map((operator: OperatorData) => (
              <MenuItem
                key={operator.evmWallet}
                value={operator.evmWallet}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Typography>{displayShortTxOrAddr(operator.evmWallet)}</Typography>
                <Box display={'flex'} alignItems={'center'} gap={'8px'}>
                  <Typography>{operator.operatorFee}</Typography>
                  <img width='20px' height='20px' src='./usdc-logo.svg' />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          disabled={true}
          value={currentOperator?.operatorFee ?? 0}
          label='Fee'
          sx={{
            '& .MuiInputBase-input': {
              display: 'flex',
              gap: '24px',
              justifyContent: 'space-between',
            },
          }}
          InputProps={{
            endAdornment: <img width='20px' height='29px' src={'./usdc-logo.svg'} />,
          }}
        />
        <FormControl component='fieldset' variant='standard'>
          <FormControlLabel
            control={
              <Checkbox
                value={privateMode}
                onChange={handlePrivateModeChanged}
              />
            }
            label={
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Private Mode
                <Tooltip
                  title={
                    <Typography variant='caption' sx={{ whiteSpace: 'pre-line' }}>
                      {
                        'When this is on, prompts and responses will be encrypted with your keys and will only be acessbile by you.'
                      }
                    </Typography>
                  }
                  placement='bottom'
                >
                  <InfoOutlined fontSize='small' />
                </Tooltip>
              </Typography>
            }
          />
        </FormControl>
      </Box>
    </Drawer>
    <Box sx={{ height: '100%', display: 'flex' }} className='bg-slate-700'>
      <Box
        id='chat'
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexGrow: 1,
          backgroundColor: 'rgb(51 65 85)',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginRight: '0',
          ...(settingsOpen && {
            transition: theme.transitions.create('margin', {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
            marginRight: '30%',
          }),
          alignItems: 'center',
        }}
      >
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
          {messagesLoading && (
            <Backdrop
              sx={{
                position: 'absolute',
                zIndex: theme.zIndex.drawer + 1,
                backdropFilter: 'blur(50px)',
                display: 'flex',
                flexDirection: 'column',
                left: '0px',
                right: settingsOpen ? '30%' : '0px',
              }}
              open={true}
            >
              <Typography variant='h1' fontWeight={500} color={'#9ecced'}>
                Loading Messages...
              </Typography>
              <CircularProgress sx={{ color: '#9ecced' }} size='6rem' />
            </Backdrop>
          )}
          <Box flexGrow={1}>
            <Paper
              elevation={1}
              sx={{
                backgroundColor: 'rgb(51 65 85)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                boxShadow: 'none',
              }}
            >
              <Zoom in={showLoadMore} timeout={100} mountOnEnter unmountOnExit>
                <Box
                  zIndex={'100'}
                  display={'flex'}
                  justifyContent={'center'}
                  padding={'8px'}
                  width={'100%'}
                  sx={{
                    position: 'absolute',
                    top: '40px',
                    width: '100%',
                  }}
                >
                  <Fab
                    variant='extended'
                    size='medium'
                    sx={{ backgroundColor: '#9ecced' }}
                    aria-label='Load More'
                    onClick={handleLoadMore}
                  >
                    <Typography>Load More</Typography>
                  </Fab>
                </Box>
              </Zoom>
              <Box
                sx={{
                  overflow: messagesLoading ? 'hidden' : 'auto',
                  maxHeight: chatMaxHeight,
                  pt: '50px',
                  paddingBottom: `${inputHeight}px`,
                }}
                ref={scrollableRef}
              >
                <Box ref={target} sx={{ padding: '8px' }} />
                <ChatContent
                  messages={messages}
                  showError={showError}
                  isWaitingResponse={isWaitingResponse}
                  responseTimeout={responseTimeout}
                  forArbitrum={true}
                />
                <Box ref={messagesEndRef} sx={{ padding: '1px' }} />
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
              paddingRight: '8px',
              paddingLeft: '8px',
            }}
          >
            {showOperatorBusy && (
              <Box sx={{ display: 'flex', gap: '8px' }}>
                <InfoOutlined color='warning' />
                <Typography color={theme.palette.warning.main}>
                  Operator is currently working on other requests. Waiting time may be
                  increased...
                </Typography>
              </Box>
            )}
            <InputField
              newMessage={newMessage}
              handleSendText={handleSendText}
              handleMessageChange={handleMessageChange}
              handleSettingsOpen={handleSettingsOpen}
            />
            {newMessage.length >= MAX_MESSAGE_SIZE && (
              <Typography
                variant='subtitle1'
                sx={{ color: theme.palette.error.main, fontWeight: 500, paddingLeft: '20px' }}
              >
                Message Too Long. Message must not be bigger than 50kb, or 50000 characters.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  </>);
};

export default ArbitrumChat;
