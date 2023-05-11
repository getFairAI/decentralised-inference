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
  const mockArray = genLoadingArray(5);
  const theme = useTheme();

  const hasNoErrorsFragment = () => {
    return messages.length > 0 && !messagesLoading ? (
      <>
        <Divider textAlign='center' sx={{ ml: '24px', mr: '24px' }}>
          {new Date(messages[0].timestamp * 1000).toLocaleDateString()}
        </Divider>
        {messages.map((el: IMessage, index: number) => (
          <Container
            key={el.id}
            maxWidth={false}
            sx={{ paddingTop: '16px' }}
            className='message-container'
          >
            <Message message={el} index={index} pendingTxs={pendingTxs} />
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
                    {new Date(messages[index + 1].timestamp * 1000).toLocaleDateString()}
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
                      <LoadingContainer className='dot-pulse' sx={{ marginBottom: '0.35em' }} />
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
                    The last request has not received a response in the defined amount of time,
                    please consider retrying with a new operator
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Container>
        )}
      </>
    ) : (
      hasNoMessagesFragment()
    );
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
