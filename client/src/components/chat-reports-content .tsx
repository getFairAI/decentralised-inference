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

import { IMessage } from '@/interfaces/common';
// import { LoadingContainer } from '@/styles/components';
import {
  // Container,
  // Stack,
  // Box,
  // Card,
  // CardContent,
  Typography,
  useTheme,
  Divider,
  Backdrop,
  CircularProgress,
  FormControl,
  TextField,
  Tooltip,
  Container,
  Card,
  CardContent,
} from '@mui/material';
// import { useCallback } from 'react';
// import { motion } from 'framer-motion';

import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { ArbitrumLoadingContainer, StyledMuiButton } from '@/styles/components';
import {
  ArticleRounded,
  ChatRounded,
  CloseRounded,
  HourglassBottomRounded,
  NoteAddRounded,
  SendRounded,
} from '@mui/icons-material';
import { ChangeEvent, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ThrowawayContext } from '@/context/throwaway';
import { enqueueSnackbar } from 'notistack';
import { EVMWalletContext } from '@/context/evm-wallet';
import { sendThrowawayUSDC } from '@fairai/evm-sdk';
import useRequests from '@/hooks/useRequests';
import useResponses from '@/hooks/useResponses';
import { getData } from '@/utils/arweave';
import DOMPurify from 'dompurify';
import Markdown from 'react-markdown';
import { useLazyQuery } from '@apollo/client';
import { irysQuery, responsesQuery } from '@/queries/graphql';
import {
  INFERENCE_REQUEST,
  INFERENCE_RESPONSE,
  PROTOCOL_NAME,
  PROTOCOL_VERSION,
  RETROSPECTIVE_SOLUTION,
  TAG_NAMES,
  secondInMS,
} from '@/constants';
import { IEdge, ITag } from '@/interfaces/arweave';
import { findTag } from '@/utils/common';
import Message from './message';
import { debounce } from 'lodash';

const ChatReportsContent = ({
  currentConversationId,
}: // isWaitingResponse,
// responseTimeout,
{
  messages: IMessage[];
  isWaitingResponse: boolean;
  responseTimeout: boolean;
  currentConversationId: number;
}) => {
  // const defaultJustifyContent = 'flex-start';
  const theme = useTheme();
  const { state } = useLocation();
  const { throwawayAddr, customUpload } = useContext(ThrowawayContext);
  const { currentAddress } = useContext(EVMWalletContext);
  const [, /* requestIds, */ setRequestIds] = useState([] as string[]);
  const [safeHtmlStr, setSafeHtmlStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [currentReportId, setCurrentReportId] = useState('');
  const [messages, setMessages] = useState([] as IMessage[]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);

  const [reportIsGenerated, setReportIsGenerated] = useState(false);
  const [requestParams, setRequestParams] = useState({
    userAddrs: [] as string[],
    solutionTx: state.solution.node.id,
    conversationId: currentConversationId,
    first: 1,
  });
  const [responseParams, setResponseParams] = useState({
    reqIds: [] as string[],
    conversationId: currentConversationId,
    lastRequestId: '',
  });

  const { requestsData /* requestError, requestNetworkStatus */ } = useRequests(requestParams);

  const {
    responsesPollingData,
    stopResponsePolling /* responseError, responseNetworkStatus, responsesPollingData */,
  } = useResponses(responseParams);

  const [
    getReportPrompts,
    {
      data: reportPromptsData,
      /* loading: requestsLoading,
      error: requestError,
      networkStatus: requestNetworkStatus,
      fetchMore: requestFetchMore, */
    },
  ] = useLazyQuery(irysQuery);

  const [
    getReportAnswers,
    {
      data: reportAnswersData,
      /* error: responseError,
      loading: responsesLoading,
      networkStatus: responseNetworkStatus,
      fetchMore: responsesFetchMore, */
      stopPolling: stopReportAnswersPolling,
    },
  ] = useLazyQuery(responsesQuery);

  useEffect(() => {
    if (throwawayAddr && currentAddress) {
      setRequestParams((previousParams) => ({
        ...previousParams,
        userAddrs: [throwawayAddr],
        requestCaller: currentAddress,
      }));
    }
  }, [throwawayAddr, currentAddress]);

  useEffect(() => {
    setRequestParams((previousParams) => ({
      ...previousParams,
      conversationId: currentConversationId,
    }));
  }, [currentConversationId]);

  useEffect(() => {
    if (requestsData?.transactions?.edges && requestsData.transactions.edges.length > 0) {
      const lastRequest = requestsData.transactions.edges[0];
      setCurrentReportId(lastRequest.node.id);
      setResponseParams({
        ...responseParams,
        reqIds: [],
        lastRequestId: lastRequest.node.id,
      });
      setLoading(true);
    } else {
      setLoading(false);
      setGenerateLoading(false);
      stopResponsePolling();
      setResponseParams((previousParams) => ({
        ...previousParams,
        lastRequestId: '',
        reqIds: ['none'],
      }));
      setReportIsGenerated(false);
      setSafeHtmlStr('');

      loadExistingChatPrompts();
    }
  }, [requestsData]);

  useEffect(() => {
    (async () => {
      if (
        responsesPollingData?.transactions?.edges &&
        responsesPollingData.transactions.edges.length > 0
      ) {
        const id = responsesPollingData.transactions.edges[0].node.id;
        const data = await getData(id);
        if (typeof data === 'string') {
          const { response } = JSON.parse(data);
          const safeHtml = DOMPurify.sanitize(response);
          setSafeHtmlStr(
            safeHtml
              .replaceAll('<p>', '')
              .replaceAll('</p>', '\n\n')
              .replaceAll('<br>', '\n\n')
              .replaceAll(' **', '**')
              .replaceAll('** ', '**'),
          );
          setReportIsGenerated(true);
          setLoading(false);
          setGenerateLoading(false);
        }
        stopResponsePolling(); // stop polling after receiving response
      }
    })();
  }, [
    responsesPollingData,
    stopResponsePolling,
    getData,
    setLoading,
    setReportIsGenerated,
    setGenerateLoading,
    setSafeHtmlStr,
  ]);

  const handleSetReportGenerated = debounce(
    useCallback(async () => {
      try {
        setGenerateLoading(true);
        const tags = [
          { name: 'Protocol-Name', value: 'FairAI' },
          { name: 'Protocol-Version', value: '2.0' },
          { name: 'Request-Type', value: 'Report' },
          { name: 'Operation-Name', value: 'Inference Request' },
          { name: 'Model-Name', value: 'Llama3:70B' },
          { name: 'Request-Caller', value: currentAddress },
          { name: 'Conversation-ID', value: currentConversationId.toString() },
          { name: 'Solution-Transaction', value: state.solution.node.id },
          { name: 'Solution-Operator', value: state.defaultOperator.arweaveWallet },
          { name: 'Transaction-Origin', value: 'FairAI Browser' },
          { name: 'Content-Type', value: 'text/plain' },
          { name: 'Unix-Time', value: Date.now().toString() },
        ];

        const id = await customUpload('Generate Report', tags);
        setRequestIds([id]);
        await sendThrowawayUSDC(
          currentAddress as `0x${string}`,
          state.defaultOperator.evmWallet,
          state.defaultOperator.operatorFee,
          id,
        );

        enqueueSnackbar('Report generation request sent.', { variant: 'success' });
        // update balance after payments
        // activate polling
        setResponseParams((previousParams) => ({
          ...previousParams,
          lastRequestId: id,
          conversationId: currentConversationId,
        }));
      } catch (error) {
        setGenerateLoading(false);
        console.error(error);
        enqueueSnackbar('An error ocurred.', {
          variant: 'error',
        });
      }
    }, [currentConversationId, state, currentAddress, customUpload]),
    secondInMS,
  );

  const newPrompt = debounce(
    useCallback(async () => {
      if (!inputValue) {
        return;
      }
      setIsWaitingResponse(true);

      try {
        const timestamp = Date.now() / 1000;
        const tags = [
          { name: 'Protocol-Name', value: 'FairAI' },
          { name: 'Protocol-Version', value: '2.0' },
          { name: 'Request-Type', value: 'Prompt' },
          { name: 'Operation-Name', value: 'Inference Request' },
          { name: 'Model-Name', value: 'Llama3:70B' },
          { name: 'Request-Caller', value: currentAddress },
          { name: 'Conversation-ID', value: currentConversationId.toString() },
          { name: 'Solution-Transaction', value: state.solution.node.id },
          { name: 'Solution-Operator', value: state.defaultOperator.arweaveWallet },
          { name: 'Transaction-Origin', value: 'FairAI Browser' },
          { name: 'Content-Type', value: 'text/plain' },
          { name: 'Unix-Time', value: timestamp.toString() },
          { name: 'Report-Transaction', value: currentReportId },
        ];

        const id = await customUpload(inputValue, tags);
        setRequestIds([id]);
        await sendThrowawayUSDC(
          currentAddress as `0x${string}`,
          state.defaultOperator.evmWallet,
          state.defaultOperator.operatorFee,
          id,
        );

        enqueueSnackbar('Report prompt request sent.', { variant: 'success' });
        setInputValue('');
        const newMessage: IMessage = {
          id,
          timestamp,
          msg: inputValue,
          type: 'request',
          contentType: 'text/plain',
          cid: currentConversationId,
          from: currentAddress,
          to: state.defaultOperator.arweaveWallet,
          tags: tags,
        };
        // update balance after payments
        setMessages((prev) => prev.concat([newMessage]));
        // activate polling
        stopReportAnswersPolling(); // stop any previous polling
        const variables = {
          tags: [
            { name: 'Request-Transaction', values: [id] },
            { name: 'Operation-Name', values: [INFERENCE_RESPONSE] },
            { name: 'Protocol-Version', values: [PROTOCOL_VERSION] },
            { name: 'Protocol-Name', values: [PROTOCOL_NAME] },
          ],
          owner: 'SsoNc_AAEgS1S0cMVUUg3qRUTuNtwQyzsQbGrtTAs-Q',
          first: 10,
        };
        getReportAnswers({ variables, pollInterval: 10000, notifyOnNetworkStatusChange: true });
      } catch (error) {
        setIsWaitingResponse(false);
        console.error(error);
        enqueueSnackbar('An error ocurred.', {
          variant: 'error',
        });
      }
    }, [
      currentConversationId,
      inputValue,
      currentReportId,
      state,
      currentAddress,
      customUpload,
      setIsWaitingResponse,
    ]),
    secondInMS,
  );

  const [showLearnMoreChat, setShowLearnMoreChat] = useState(false);

  const loadExistingChatPrompts = useCallback(() => {
    // load prompts
    const tags = [
      { name: TAG_NAMES.solutionTransaction, values: [RETROSPECTIVE_SOLUTION] },
      { name: 'Conversation-ID', values: [currentConversationId.toString()] },
      { name: 'Request-Type', values: ['Prompt'] },
      { name: 'Request-Caller', values: [currentAddress] },
      { name: TAG_NAMES.operationName, values: [INFERENCE_REQUEST] },
      { name: TAG_NAMES.protocolVersion, values: [PROTOCOL_VERSION] },
      { name: TAG_NAMES.protocolName, values: [PROTOCOL_NAME] },
    ];

    getReportPrompts({
      variables: {
        tags,
        owners: [throwawayAddr],
        first: 10,
      },
      context: {
        clientName: 'irys',
      },
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
      notifyOnNetworkStatusChange: true,
    });
  }, [currentAddress, currentConversationId, throwawayAddr, getReportPrompts]);

  const handleSetShowChat = useCallback(() => {
    setShowLearnMoreChat((prev) => !prev);
    // get reportPrompts
    loadExistingChatPrompts();
  }, [throwawayAddr, currentConversationId, setShowLearnMoreChat, loadExistingChatPrompts]);

  useEffect(() => {
    (async () => {
      const temp: IMessage[] = [];
      if (
        reportAnswersData?.transactions.edges &&
        reportAnswersData.transactions.edges.length > 0
      ) {
        const newMessages = reportAnswersData.transactions.edges.filter(
          (el: IEdge) => !messages.find((msg) => msg.id === el.node.id),
        );

        setLoadingMessages(true);
        for (const tx of newMessages) {
          const data = await getData(tx.node.id);
          const newMessage: IMessage = {
            id: tx.node.id,
            msg: data,
            timestamp: Number(findTag(tx, 'unixTime')) || Date.now() / 1000,
            type: 'response',
            contentType: 'text/plain',
            cid: currentConversationId,
            from: tx.node.owner.address,
            to:
              tx.node.tags.find((tag: ITag) => tag.name === 'Request-Caller')?.value ||
              throwawayAddr,
            tags: tx.node.tags,
          };

          temp.push(newMessage);
        }
        setLoadingMessages(false);

        // sort messages by timestamp
        temp.sort((a, b) => a.timestamp - b.timestamp);

        setMessages((prev) => prev.concat(temp)); // add new messages to the list
      }
    })();
  }, [reportAnswersData]);

  useEffect(() => {
    const temp: IMessage[] = [];
    (async () => {
      if (
        reportPromptsData?.transactions.edges &&
        reportPromptsData.transactions.edges.length > 0
      ) {
        const requestIds: string[] = [];
        const newMessages = reportPromptsData.transactions.edges.filter(
          (el: IEdge) => !messages.find((msg) => msg.id === el.node.id),
        );
        // setMessages((prev) => prev.concat(newMessages));

        setLoadingMessages(true);
        for (const tx of newMessages) {
          const data = await getData(tx.node.id);
          const newMessage: IMessage = {
            id: tx.node.id,
            msg: data,
            timestamp: Number(findTag(tx, 'unixTime')) || Date.now() / 1000,
            type: 'request',
            contentType: 'text/plain',
            cid: currentConversationId,
            from:
              tx.node.tags.find((tag: ITag) => tag.name === 'Request-Caller')?.value ||
              currentAddress,
            to: state.defaultOperator.arweaveWallet,
            tags: tx.node.tags,
          };
          requestIds.push(tx.node.id);
          temp.push(newMessage);
        }
        if (requestIds.length > 0) {
          stopReportAnswersPolling();
          getReportAnswers({
            variables: {
              tags: [
                { name: 'Request-Transaction', values: requestIds },
                { name: 'Operation-Name', values: [INFERENCE_RESPONSE] },
                { name: 'Protocol-Version', values: [PROTOCOL_VERSION] },
                { name: 'Protocol-Name', values: [PROTOCOL_NAME] },
              ],
              owner: 'SsoNc_AAEgS1S0cMVUUg3qRUTuNtwQyzsQbGrtTAs-Q',
              first: 1,
            },
            pollInterval: 10000,
            notifyOnNetworkStatusChange: true,
          });
        }
        setLoadingMessages(false);
      }
      // sort messages by timestamp
      temp.sort((a, b) => a.timestamp - b.timestamp);

      setMessages((prev) => prev.concat(temp)); // add new messages to the list
    })();
  }, [reportPromptsData]);

  useEffect(() => {
    const lastRequest = messages.filter((el) => el.type === 'request').pop();
    const hasResponse =
      lastRequest &&
      messages.find(
        (el) =>
          el.type === 'response' &&
          el.tags.find((tag) => tag.name === 'Request-Transaction')?.value === lastRequest.id,
      );

    setIsWaitingResponse(!!lastRequest && !hasResponse);
  }, [messages]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setInputValue(event.target.value),
    [setInputValue],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCopySettings = useCallback((_: ITag[]) => {}, []);

  const waitingResponseFragment = useCallback(() => {
    return (
      <Container maxWidth={false} sx={{ paddingTop: '16px', opacity: '0.8', mb: '16px' }}>
        {isWaitingResponse && (
          <div
            className={'flex w-full gap-4 md:flex-nowrap items-end justify-start flex-wrap-reverse'}
          >
            <Card
              raised={true}
              className={
                'transition-all rounded-lg py-2 px-4 w-fit md:max-w-[80%] whitespace-pre-wrap'
              }
            >
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  ':last-child': { paddingBottom: '12px' },
                }}
              >
                <ArbitrumLoadingContainer className='dot-pulse' />
              </CardContent>
            </Card>
          </div>
        )}
      </Container>
    );
  }, [isWaitingResponse]);

  if (loading || generateLoading) {
    return (
      <Backdrop
        sx={{
          position: 'absolute',
          zIndex: theme.zIndex.drawer + 1,
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255,255,255,0.4)',
          color: theme.palette.backdropContrast.main,
          display: 'flex',
          gap: 3,
          left: 0,
          right: 0,
        }}
        open={true}
      >
        <CircularProgress sx={{ color: theme.palette.backdropContrast.main }} size='2rem' />
        <Typography variant='h2' color={theme.palette.backdropContrast.main}>
          {generateLoading ? 'Generating Report...' : 'Loading Existing Report...'}
        </Typography>
      </Backdrop>
    );
  } else if (reportIsGenerated) {
    return (
      <div className='animate-slide-down'>
        <Divider
          textAlign='center'
          sx={{
            ml: '24px',
            mr: '24px',
            '&::before, &::after': {
              borderTop: `thin solid ${theme.palette.primary.main}`,
            },
          }}
        >
          <div>
            <p className='text-center flex gap-1'>
              <ArticleRounded className='primary-text-color' />
              <strong>
                Report -{' '}
                {findTag(responsesPollingData.transactions.edges[0], 'unixTime')
                  ? new Date(
                      Number(findTag(responsesPollingData.transactions.edges[0], 'unixTime')) *
                        1000,
                    ).toLocaleString()
                  : '(New)'}
              </strong>
            </p>
          </div>
        </Divider>

        <Markdown className='flex flex-col gap-3 p-5 m-4 lg:m-10 bg-slate-200 rounded-xl'>
          {safeHtmlStr}
        </Markdown>

        {showLearnMoreChat && messages.length > 0 && (
          <div className='px-4'>
            {messages.map((el: IMessage, index: number) => (
              <Container
                key={el.id}
                maxWidth={false}
                sx={{ paddingTop: '16px', mb: '16px' }}
                className='message-container'
              >
                <Message message={el} index={index} copySettings={handleCopySettings} />
              </Container>
            ))}
          </div>
        )}

        {waitingResponseFragment()}

        {loadingMessages && (
          <div className='w-full flex gap-2 justify-center p-4 font-bold'>
            <HourglassBottomRounded className='primary-text-color' /> Loading previous messages ...
          </div>
        )}

        {showLearnMoreChat && (
          <div className='w-100 px-10 mb-6 flex gap-3 items-center'>
            <Tooltip title='Hide this chat box'>
              <StyledMuiButton
                className='secondary fully-rounded smaller animate-slide-left animation-delay-300ms'
                onClick={handleSetShowChat}
              >
                <CloseRounded />
              </StyledMuiButton>
            </Tooltip>
            <FormControl variant='outlined' fullWidth className='animate-scale-in'>
              <TextField
                value={inputValue}
                onChange={handleInputChange}
                disabled={false}
                placeholder='Type any question about this report'
                multiline
                minRows={1}
                maxRows={3}
              ></TextField>
            </FormControl>
            <StyledMuiButton
              className='primary animate-slide-right animation-delay-300ms'
              onClick={newPrompt}
              disabled={isWaitingResponse || inputValue.length === 0}
            >
              Send <SendRounded />
            </StyledMuiButton>
          </div>
        )}

        {!showLearnMoreChat && (
          <div className='flex justify-center p-2 mb-6 animate-scale-in animation-delay-200ms'>
            <StyledMuiButton className='primary' onClick={handleSetShowChat}>
              <ChatRounded style={{ width: '20px' }} />
              Learn or ask more about this report
            </StyledMuiButton>
          </div>
        )}
        {/* {showResponseTimeoutFragment()} */}
      </div>
    );
  } else {
    return (
      <>
        <Typography
          display='flex'
          justifyContent={'center'}
          gap={1}
          padding={'0px 15px'}
          fontWeight={500}
        >
          <StarRoundedIcon className='primary-text-color' />
          Your report is ready to be generated. <br />
          Bellow is an example of what your report will look like. <br />
          When you are ready, click the button to generate a report.
        </Typography>

        <div className='flex flex-col gap-3 p-5 m-4 lg:m-10 bg-slate-200 rounded-xl animate-slide-down'>
          <p className='text-center'>
            <strong>Example Report - {new Date().toLocaleDateString()}</strong>
          </p>
          <p>
            <strong>1. How many times did reports get generated?</strong>
          </p>
          <p className='italic'>(Answer)</p>
          <p>
            <strong>2. How many times did the report got downloaded?</strong>
          </p>
          <p className='italic'>(Answer)</p>
          <p>
            <strong>3. How much revenue did Google get last week?</strong>
          </p>
          <p className='italic'>(Answer)</p>
        </div>

        <div
          className='flex justify-center p-2 mb-4 animate-slide-down'
          style={{ animationDelay: '0.2s' }}
        >
          <StyledMuiButton
            className='primary'
            onClick={handleSetReportGenerated}
            disabled={loading || generateLoading}
          >
            <NoteAddRounded style={{ width: '20px' }} />
            Generate Report
          </StyledMuiButton>
        </div>
      </>
    );
  }
};

export default ChatReportsContent;
