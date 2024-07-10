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
import { ArbitrumLoadingContainer, LoadingContainer } from '@/styles/components';
import {
  Container,
  Stack,
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  Divider,
} from '@mui/material';
import Message from './message';
import { secondInMS } from '@/constants';
import { useCallback } from 'react';
import { ITag } from '@/interfaces/arweave';
import MessageDisplay from './message-display';
import { motion } from 'framer-motion';

import StarRoundedIcon from '@mui/icons-material/StarRounded';

const ChatContent = ({
  showError,
  messages,
  isWaitingResponse,
  responseTimeout,
  forArbitrum,
  copySettings,
}: {
  showError: boolean;
  messages: IMessage[];
  isWaitingResponse: boolean;
  responseTimeout: boolean;
  forArbitrum?: boolean;
  copySettings?: (tags: ITag[]) => void;
}) => {
  const defaultJustifyContent = 'flex-start';
  const theme = useTheme();

  const waitingResponseFragment = useCallback(() => {
    return (
      <>
        {isWaitingResponse && !responseTimeout && (
          <motion.div
            initial={{ opacity: 0, x: '-40px' }}
            animate={{
              opacity: 1,
              x: 0,
              transition: {
                delay: 0.1,
                duration: 0.6,
                bounce: 0.4,
                type: 'spring',
              },
            }}
          >
            <Container maxWidth={false} sx={{ paddingTop: '16px' }}>
              <Stack spacing={4} flexDirection='row'>
                <Box display={'flex'} flexDirection='column' margin='8px' width='100%'>
                  <Box display={'flex'} alignItems='center' justifyContent={defaultJustifyContent}>
                    <Card
                      raised={true}
                      elevation={1}
                      sx={{
                        borderRadius: '20px 20px 20px 0px',
                        width: 'fit-content',
                        background:
                          theme.palette.mode === 'dark'
                            ? 'rgba(100, 100, 100, 0.7)'
                            : 'rgba(52, 52, 52, 0.8)',
                      }}
                    >
                      <CardContent
                        sx={{
                          padding: '24px 32px',
                          gap: '16px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <LoadingContainer className='dot-pulse' />
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              </Stack>
            </Container>
          </motion.div>
        )}
      </>
    );
  }, [isWaitingResponse, responseTimeout]);

  const arbitrumWaitingResponseFragment = useCallback(() => {
    return (
      <Container maxWidth={false} sx={{ paddingTop: '16px', opacity: '0.8' }}>
        {isWaitingResponse && !responseTimeout && (
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
  }, [isWaitingResponse, responseTimeout]);

  const showDayDivider = useCallback(
    (el: IMessage, index: number) => {
      const daysDiffer =
        index < messages.length - 1 &&
        new Date(el.timestamp * secondInMS).getDay() !==
          new Date(messages[index + 1].timestamp * secondInMS).getDay();
      return (
        <Box sx={{ mt: '8px' }}>
          {daysDiffer && (
            <Divider
              textAlign='center'
              sx={{
                '&::before, &::after': {
                  borderTop: forArbitrum
                    ? 'thin solid #9ecced'
                    : `thin solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <Typography
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: forArbitrum ? '#9ecced' : theme.palette.primary.main,
                }}
              >
                {new Date(messages[index + 1].timestamp * secondInMS).toLocaleDateString()}
              </Typography>
            </Divider>
          )}
        </Box>
      );
    },
    [messages],
  );

  const showResponseTimeoutFragment = useCallback(() => {
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
                  consider retrying with a new operator.
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Container>
      );
    } else {
      return <></>;
    }
  }, [responseTimeout, isWaitingResponse]);

  if (showError) {
    return (
      <Typography alignItems='center' display='flex' flexDirection='column-reverse' height={'100%'}>
        Could not Fetch Conversation History.
      </Typography>
    );
  } else if (messages.length > 0) {
    return (
      <>
        <Divider
          textAlign='center'
          sx={{
            ml: '24px',
            mr: '24px',
            '&::before, &::after': {
              borderTop: forArbitrum
                ? 'thin solid #9ecced'
                : `thin solid ${theme.palette.primary.main}`,
            },
          }}
        >
          <Typography
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: forArbitrum ? '#9ecced' : theme.palette.primary.main,
            }}
          >
            {new Date(messages[0].timestamp * secondInMS).toLocaleDateString()}
          </Typography>
        </Divider>
        {messages.map((el: IMessage, index: number) => (
          <Container
            key={el.id}
            maxWidth={false}
            sx={{ paddingTop: '16px' }}
            className='message-container'
          >
            {!forArbitrum && copySettings && (
              <Message message={el} index={index} copySettings={copySettings} />
            )}
            {forArbitrum && (
              <div
                key={el.id}
                className={`flex w-full gap-4 md:flex-nowrap items-end ${
                  el.type === 'request'
                    ? 'justify-end flex-wrap'
                    : 'justify-start flex-wrap-reverse'
                }`}
              >
                <Card
                  raised={true}
                  className={
                    'transition-all rounded-lg py-2 px-4 w-fit min-w-[30%] max-w-full md:max-w-[80%] whitespace-pre-wrap'
                  }
                >
                  <MessageDisplay message={el} />
                  <div className='flex justify-end w-full opacity-30 text-xs'>
                    {new Date(el.timestamp * 1000).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                </Card>
              </div>
            )}
            {showDayDivider(el, index)}
          </Container>
        ))}
        {forArbitrum ? arbitrumWaitingResponseFragment() : waitingResponseFragment()}
        {showResponseTimeoutFragment()}
      </>
    );
  } else {
    return (
      <Typography
        display='flex'
        justifyContent={'center'}
        alignItems='center'
        gap={1}
        height={'100%'}
        padding={'0px 15px'}
        fontWeight={500}
      >
        <StarRoundedIcon />
        This is the start of your conversation. Type in your first prompt to get started.
      </Typography>
    );
  }
};

export default ChatContent;
