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
import { LoadingContainer } from '@/styles/components';
import { genLoadingArray } from '@/utils/common';
import {
  Container,
  Stack,
  Skeleton,
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  Divider,
} from '@mui/material';
import Message from './message';
import Transaction from 'arweave/node/lib/transaction';
import { secondInMS } from '@/constants';

const ChatBubble = ({
  showLoading,
  showError,
  messages,
  isWaitingResponse,
  responseTimeout,
  pendingTxs,
  messagesLoading,
}: {
  showLoading: boolean;
  showError: boolean;
  messages: IMessage[];
  isWaitingResponse: boolean;
  responseTimeout: boolean;
  pendingTxs: Transaction[];
  messagesLoading: boolean;
}) => {
  const mockElements = 5;
  const pairDivider = 2; // number to divide by to check if even or odd
  const defaultJustifyContent = 'flex-start';
  const mockArray = genLoadingArray(mockElements);
  const theme = useTheme();

  const waitingResponseFragment = () => {
    return (
      <>
        {isWaitingResponse && !responseTimeout && (
          <Container maxWidth={false} sx={{ paddingTop: '16px' }}>
            <Stack spacing={4} flexDirection='row'>
              <Box display={'flex'} flexDirection='column' margin='8px' width='100%'>
                <Box display={'flex'} alignItems='center' justifyContent={defaultJustifyContent}>
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
                        alignItems: defaultJustifyContent,
                      }}
                    >
                      <LoadingContainer className='dot-pulse' sx={{ marginBottom: '0.35em' }} />
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </Stack>
          </Container>
        )}
      </>
    );
  };

  const showDayDivider = (el: IMessage, index: number) => {
    const daysDiffer =
      index < messages.length - 1 &&
      new Date(el.timestamp * secondInMS).getDay() !==
        new Date(messages[index + 1].timestamp * secondInMS).getDay();
    return (
      <>
        {daysDiffer && (
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
              {new Date(messages[index + 1].timestamp * secondInMS).toLocaleDateString()}
            </Typography>
          </Divider>
        )}
      </>
    );
  };

  const showResponseTimeoutFragment = () => {
    if (responseTimeout && !isWaitingResponse) {
      return (
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
                  The last request has not received a response in the defined amount of time, please
                  consider retrying with a new operator
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Container>
      );
    } else {
      return <></>;
    }
  };

  const hasNoErrorsFragment = () => {
    if (messages.length > 0 && !messagesLoading) {
      return (
        <>
          <Divider textAlign='center' sx={{ ml: '24px', mr: '24px' }}>
            {new Date(messages[0].timestamp * secondInMS).toLocaleDateString()}
          </Divider>
          {messages.map((el: IMessage, index: number) => (
            <Container
              key={el.id}
              maxWidth={false}
              sx={{ paddingTop: '16px' }}
              className='message-container'
            >
              <Message message={el} index={index} pendingTxs={pendingTxs} />
              {showDayDivider(el, index)}
            </Container>
          ))}
          {waitingResponseFragment()}
          {showResponseTimeoutFragment()}
        </>
      );
    }

    return hasNoMessagesFragment();
  };

  const hasNoMessagesFragment = () => {
    return (
      showLoading && (
        <Typography alignItems='center' display='flex' flexDirection='column'>
          Starting a new conversation.
        </Typography>
      )
    );
  };

  return (
    <>
      {showLoading &&
        mockArray.map((el: number) => {
          return (
            <Container key={el} maxWidth={false}>
              <Stack
                spacing={4}
                flexDirection='row'
                justifyContent={el % pairDivider === 0 ? 'flex-end' : defaultJustifyContent}
              >
                <Skeleton animation={'wave'} width={'40%'}>
                  <Box
                    display={'flex'}
                    justifyContent={el % pairDivider === 0 ? 'flex-end' : defaultJustifyContent}
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
      {showError ? (
        <Typography alignItems='center' display='flex' flexDirection='column-reverse'>
          Could not Fetch Conversation History.
        </Typography>
      ) : (
        hasNoErrorsFragment()
      )}
    </>
  );
};

export default ChatBubble;
