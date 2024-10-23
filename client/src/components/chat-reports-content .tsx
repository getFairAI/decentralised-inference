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
  FormControl,
  TextField,
  Tooltip,
} from '@mui/material';
// import { useCallback } from 'react';
// import { motion } from 'framer-motion';

import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { StyledMuiButton } from '@/styles/components';
import {
  ArticleRounded,
  ChatRounded,
  CloseRounded,
  NoteAddRounded,
  SendRounded,
} from '@mui/icons-material';
import { useState } from 'react';

const ChatReportsContent = ({
  showError,
}: // isWaitingResponse,
// responseTimeout,
{
  showError: boolean;
  messages: IMessage[];
  isWaitingResponse: boolean;
  responseTimeout: boolean;
}) => {
  // const defaultJustifyContent = 'flex-start';
  const theme = useTheme();

  const [reportIsGenerated, setReportIsGenerated] = useState(false);
  const handleSetReportGenerated = () => {
    setReportIsGenerated(!reportIsGenerated);
  };

  const [showLearnMoreChat, setShowLearnMoreChat] = useState(false);
  const handleSetShowChat = () => {
    setShowLearnMoreChat(!showLearnMoreChat);
  };

  // const waitingResponseFragment = useCallback(() => {
  //   return (
  //     <>
  //       {isWaitingResponse && !responseTimeout && (
  //         <motion.div
  //           initial={{ opacity: 0, x: '-40px' }}
  //           animate={{
  //             opacity: 1,
  //             x: 0,
  //             transition: {
  //               delay: 0.1,
  //               duration: 0.6,
  //               bounce: 0.4,
  //               type: 'spring',
  //             },
  //           }}
  //         >
  //           <Container maxWidth={false} sx={{ paddingTop: '16px' }}>
  //             <Stack spacing={4} flexDirection='row'>
  //               <Box display={'flex'} flexDirection='column' margin='8px' width='100%'>
  //                 <Box display={'flex'} alignItems='center' justifyContent={defaultJustifyContent}>
  //                   <Card
  //                     raised={true}
  //                     elevation={1}
  //                     sx={{
  //                       borderRadius: '20px 20px 20px 0px',
  //                       width: 'fit-content',
  //                       background:
  //                         theme.palette.mode === 'dark'
  //                           ? 'rgba(100, 100, 100, 0.7)'
  //                           : 'rgba(52, 52, 52, 0.8)',
  //                     }}
  //                   >
  //                     <CardContent
  //                       sx={{
  //                         padding: '24px 32px',
  //                         gap: '16px',
  //                         display: 'flex',
  //                         alignItems: 'center',
  //                       }}
  //                     >
  //                       <LoadingContainer className='dot-pulse' />
  //                     </CardContent>
  //                   </Card>
  //                 </Box>
  //               </Box>
  //             </Stack>
  //           </Container>
  //         </motion.div>
  //       )}
  //     </>
  //   );
  // }, [isWaitingResponse, responseTimeout]);

  // const showResponseTimeoutFragment = useCallback(() => {
  //   if (responseTimeout && !isWaitingResponse) {
  //     return (
  //       <Container maxWidth={false} sx={{ paddingTop: '16px' }}>
  //         <Stack spacing={4} flexDirection='row'>
  //           <Box display={'flex'} flexDirection='column' margin='8px' width='100%'>
  //             <Box display={'flex'} alignItems='center' justifyContent={'center'}>
  //               <Typography
  //                 sx={{
  //                   fontStyle: 'normal',
  //                   fontWeight: 600,
  //                   fontSize: '30px',
  //                   lineHeight: '41px',
  //                   display: 'block',
  //                   textAlign: 'center',
  //                   color: '#F4BA61',
  //                 }}
  //               >
  //                 The last request has not received a response in the defined amount of time, please
  //                 consider retrying with a new operator.
  //               </Typography>
  //             </Box>
  //           </Box>
  //         </Stack>
  //       </Container>
  //     );
  //   } else {
  //     return <></>;
  //   }
  // }, [responseTimeout, isWaitingResponse]);

  if (showError) {
    return (
      <Typography
        alignItems='center'
        display='flex'
        fontWeight={700}
        flexDirection='column-reverse'
        height={'100%'}
      >
        Error: Could not fetch this report history. Try again later.
      </Typography>
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
              <strong>Report - {new Date().toLocaleString()}</strong>
            </p>
          </div>
        </Divider>

        <div className='flex flex-col gap-3 p-5 m-4 lg:m-10 bg-slate-200 rounded-xl'>
          <p>
            <strong>1. How many times did reports get generated?</strong>
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque dictum mauris tellus,
            tristique malesuada diam placerat id. Sed eu facilisis ipsum. Nulla tempus eu lorem quis
            pharetra. Quisque vitae turpis id eros vehicula convallis. Morbi commodo efficitur
            massa. Nullam quis tellus efficitur, vulputate velit eget, vulputate neque.
          </p>
          <p>
            <strong>2. How many times did the report got downloaded?</strong>
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque dictum mauris tellus,
            tristique malesuada diam placerat id. Sed eu facilisis ipsum. Nulla tempus eu lorem quis
            pharetra. Quisque vitae turpis id eros vehicula convallis. Morbi commodo efficitur
            massa.
          </p>
          <p>
            <strong>3. How much revenue did Google get last week?</strong>
          </p>
          <p>
            Quisque dictum mauris tellus, tristique malesuada diam placerat id. Sed eu facilisis
            ipsum. Nulla tempus eu lorem quis pharetra. Quisque vitae turpis id eros vehicula
            convallis. Morbi commodo efficitur massa. Nullam quis tellus efficitur, vulputate velit
            eget, vulputate neque.
          </p>
        </div>

        {!showLearnMoreChat && (
          <div className='flex justify-center p-2 mb-6 animate-scale-in animation-delay-200ms'>
            <StyledMuiButton className='primary' onClick={handleSetShowChat}>
              <ChatRounded style={{ width: '20px' }} />
              Learn or ask more about this report
            </StyledMuiButton>
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
                disabled={false}
                placeholder='Type any question about this report'
                multiline
                minRows={1}
                maxRows={3}
              ></TextField>
            </FormControl>
            <StyledMuiButton className='primary animate-slide-right animation-delay-300ms'>
              Send <SendRounded />
            </StyledMuiButton>
          </div>
        )}

        {/* {waitingResponseFragment()}
        {showResponseTimeoutFragment()} */}
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
          <StyledMuiButton className='primary' onClick={handleSetReportGenerated}>
            <NoteAddRounded style={{ width: '20px' }} />
            Generate Report
          </StyledMuiButton>
        </div>
      </>
    );
  }
};

export default ChatReportsContent;
