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
  Avatar,
  Backdrop,
  CircularProgress,
  Drawer,
  Paper,
  Tooltip,
  Typography,
  useTheme,
  Box,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLazyQuery } from '@apollo/client';
import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TAG_NAMES, NET_ARWEAVE_URL, MODEL_ATTACHMENT, AVATAR_ATTACHMENT } from '@/constants';
import usePrevious from '@/hooks/usePrevious';
import { findTag } from '@/utils/common';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import '@/styles/main.css';
import Conversations from '@/components/conversations';
import { IMessage, OperatorData } from '@/interfaces/common';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import useComponentDimensions from '@/hooks/useComponentDimensions';
import { FolderCopyRounded } from '@mui/icons-material';
import { EVMWalletContext } from '@/context/evm-wallet';
import { findByTagsQuery } from '@fairai/evm-sdk';
import { motion } from 'framer-motion';
import { StyledMuiButton } from '@/styles/components';
import { GET_LATEST_MODEL_ATTACHMENTS } from '@/queries/graphql';
import { toSvg } from 'jdenticon';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { ThrowawayContext } from '@/context/throwaway';
import RequestAllowance from '@/components/request-allowance';
import ChatReportsContent from '@/components/chat-reports-content ';

const boxSizing = 'border-box';

const ReportsChat = () => {
  const [currentConversationId, setCurrentConversationId] = useState(0);
  const navigate = useNavigate();
  const { currentAddress: userAddr } = useContext(EVMWalletContext);
  const { throwawayAddr } = useContext(ThrowawayContext);
  const {
    state,
  }: {
    state: {
      defaultOperator?: OperatorData;
      solution: findByTagsQuery['transactions']['edges'][0];
      availableOperators: OperatorData[];
    };
  } = useLocation();
  const previousAddr = usePrevious<string>(userAddr);
  const [messages] = useState<IMessage[]>([]);
  const [messagesLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const { width, height } = useWindowDimensions();
  const [chatMaxHeight, setChatMaxHeight] = useState('100%');
  const scrollableRef = useRef<HTMLDivElement>(null);
  const [isWaitingResponse] = useState(false);
  const [responseTimeout] = useState(false);
  const theme = useTheme();
  const target = useRef<HTMLDivElement>(null);
  const [currentEl] = useState<HTMLDivElement | undefined>(undefined);
  const { scrollHeight } = useComponentDimensions(scrollableRef);
  const [inputHeight, setInputHeight] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState('64px');
  const [isLayoverOpen, setLayoverOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState('');

  const [getAvatar, { data: avatarData }] = useLazyQuery(GET_LATEST_MODEL_ATTACHMENTS);
  useEffect(() => {
    const avatarTxId = avatarData?.transactions?.edges[0]?.node?.id;
    if (avatarTxId) {
      setImgUrl(`${NET_ARWEAVE_URL}/${avatarTxId}`);
    } else {
      const imgSize = 100;
      const solutionId = state?.solution.node.id;
      const img = toSvg(solutionId, imgSize);
      const svg = new Blob([img], { type: 'image/svg+xml' });
      setImgUrl(URL.createObjectURL(svg));
    }
  }, [avatarData, state]);

  /**
   * If there is a save element (currentEl) scroll to it to mantain user in same place after load more
   */
  useEffect(() => {
    if (currentEl) {
      currentEl?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scrollHeight, currentEl, messagesEndRef]);

  useEffect(() => {
    (async () => {
      const currentSoludionId = state?.solution.node.id;
      let firstSolutionVersionId;
      try {
        firstSolutionVersionId = (
          JSON.parse(findTag(state?.solution, 'previousVersions') as string) as string[]
        )[0];
      } catch (err) {
        firstSolutionVersionId = state?.solution.node.id;
      }
      const attachmentAvatarTags = [
        { name: TAG_NAMES.operationName, values: [MODEL_ATTACHMENT] },
        { name: TAG_NAMES.attachmentRole, values: [AVATAR_ATTACHMENT] },
        {
          name: TAG_NAMES.solutionTransaction,
          values: [firstSolutionVersionId, currentSoludionId],
        },
      ];

      await getAvatar({
        variables: {
          tags: attachmentAvatarTags,
          owner: state.solution.node.owner.address,
        },
      });
    })();
  }, [state]);

  useEffect(() => {
    const currHeaderHeight = document.querySelector('header')?.clientHeight as number;
    setChatMaxHeight(`${height - currHeaderHeight}px`);
  }, [height]);

  useEffect(() => {
    if (previousAddr && previousAddr !== userAddr) {
      navigate(0);
    } else if (!localStorage.getItem('evmProvider') && !userAddr) {
      navigate('/');
    } else {
      // ignore
    }
  }, [previousAddr, userAddr, throwawayAddr]);

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

    if (width > 1500) {
      setDrawerOpen(true);
    } else {
      setDrawerOpen(false);
    }
  }, [width, height]);

  const handleShowConversations = useCallback(() => {
    setDrawerOpen(true);
  }, [setDrawerOpen]);

  const [isMiniScreen, setIsMiniScreen] = useState(false);
  useEffect(() => {
    const md = theme.breakpoints.values.md;
    setIsMiniScreen(width < md);
  }, [width, theme, setIsMiniScreen]);

  const [isSmallScreen, setIsSmallScreen] = useState(false);
  useEffect(() => {
    const md = theme.breakpoints.values.md;
    setIsSmallScreen(width < 1400 && width > md);
  }, [width, theme, setIsSmallScreen]);

  const conversationsDrawerOpenedWidth = '260px';

  return (
    <>
      <Drawer
        variant='persistent'
        anchor='left'
        open={drawerOpen}
        sx={{
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: conversationsDrawerOpenedWidth,
            height: '100%',
            position: 'absolute',
            left: 0,
            top: '10px',
            border: 'none',
            boxSizing,
            ...(isSmallScreen && {
              width: '30vw',
              position: 'absolute',
              left: '10px',
              top: '10px',
              boxShadow: '0px 0px 10px rgba(0,0,0,0.3)',
              borderRadius: '20px',
              height: '98%',
            }),
            ...(isMiniScreen && { position: 'absolute', left: 0, width: '100%', top: '10px' }),
          },
        }}
      >
        <Conversations
          currentConversationId={currentConversationId}
          setCurrentConversationId={setCurrentConversationId}
          userAddr={userAddr}
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          setLayoverOpen={setLayoverOpen}
          isReportsChat={true}
        />
      </Drawer>

      <Box
        sx={{
          height: '100%',
          display: 'flex',
          ...(isMiniScreen && { height: `calc(100% - ${headerHeight})` }),
          ...(isSmallScreen && drawerOpen && { filter: 'blur(10px)' }),
        }}
      >
        <Box
          id='chat'
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexGrow: 1,
            marginRight: 0,
            marginLeft: 0,
            ...(drawerOpen &&
              !isMiniScreen &&
              !isSmallScreen && {
                marginLeft: conversationsDrawerOpenedWidth,
              }),
            ...(!isMiniScreen &&
              !isSmallScreen && {
                marginRight: '3%', // changed while we dont have configurations on reports - was 30% before
              }),
            alignItems: 'center',
            padding: '20px 10px',
            boxSizing,
          }}
        >
          {!drawerOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{
                opacity: 1,
                x: 0,
                transition: { delay: 0.3, duration: 0.5, type: 'spring' },
              }}
              className='w-full flex max-w-[120px] pl-1 pr-6 justify-center mt-[40px]'
              style={{
                position: 'static',
                height: '100%',
                ...(isMiniScreen && {
                  position: 'absolute',
                  left: '18px',
                  top: 0,
                  zIndex: 100,
                  height: 'fit-content',
                }),
              }}
            >
              <Tooltip title={'Open the reports drawer'}>
                <StyledMuiButton
                  onClick={handleShowConversations}
                  disableRipple={true}
                  className='plausible-event-name=Show+Reports+Click secondary w-fit mb-5'
                >
                  <FolderCopyRounded />
                  <ChevronRightIcon />
                </StyledMuiButton>
              </Tooltip>
            </motion.div>
          )}
          <Box
            ref={chatRef}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              width: '100%',
              height: '100%',
              backgroundColor: '#fff',
              borderRadius: '20px',
              boxShadow: '0px 0px 8px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              position: 'relative',
              boxSizing,
            }}
          >
            {messagesLoading && (
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
                  Loading messages...
                </Typography>
              </Backdrop>
            )}
            <div
              className='absolute top-0 left-0 w-full  bg-[rgba(240,240,240,0.8)] backdrop-blur-lg z-10 '
              style={{
                height: '80px',
                boxShadow: '0px 0px 6px rgba(0,0,0,0.15)',
              }}
            >
              <div
                className='px-4 flex justify-between items-center gap-2 h-full'
                style={{
                  margin: 0,
                  ...(isMiniScreen && { margin: '0px 5px 0px 100px' }),
                }}
              >
                <div className='flex items-center gap-4'>
                  {imgUrl && (
                    <div className='hidden sm:inline-block'>
                      <Avatar
                        variant='rounded'
                        src={imgUrl}
                        sx={{
                          width: 56,
                          height: 56,
                          border: '3px solid white',
                          boxShadow: '0px 0px 4px rgba(0,0,0,0.2)',
                        }}
                      />
                    </div>
                  )}
                  <div className='flex flex-col'>
                    <span className='font-bold text-sm sm:text-lg lg:text-xl'>
                      {findTag(state.solution, 'solutionName')}
                    </span>
                    <span className='text-xs lg:text-base hidden sm:inline-block text-gray-500'>
                      {state.solution.node.id}
                    </span>
                  </div>
                </div>
                <a href='#/'>
                  <>
                    <div className='inline-block lg:hidden'>
                      <Tooltip title={'Close this solution and go back to the homepage'}>
                        <StyledMuiButton className='outlined-secondary fully-rounded smaller mt-[2px]'>
                          <CloseRoundedIcon />
                        </StyledMuiButton>
                      </Tooltip>
                    </div>
                    <div className='hidden lg:inline-block'>
                      <Tooltip title={'Close this solution and go back to the homepage'}>
                        <StyledMuiButton className='outlined-secondary'>
                          <CloseRoundedIcon />
                          Close Solution
                        </StyledMuiButton>
                      </Tooltip>
                    </div>
                  </>
                </a>
              </div>
            </div>
            <Box flexGrow={1}>
              <Paper
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  backgroundColor: 'transparent !important',
                  boxShadow: 'none !important',
                  boxSizing,
                }}
              >
                <Box
                  sx={{
                    overflow: messagesLoading ? 'hidden' : 'auto',
                    maxHeight: chatMaxHeight,
                    paddingBottom: `${inputHeight}px`,
                    paddingTop: '120px',
                  }}
                  ref={scrollableRef}
                >
                  <Box ref={target} sx={{ padding: '8px' }} />
                  <ChatReportsContent
                    messages={messages}
                    isWaitingResponse={isWaitingResponse}
                    responseTimeout={responseTimeout}
                    currentConversationId={currentConversationId}
                  />
                  <Box ref={messagesEndRef} sx={{ padding: '1px' }} />
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Box>
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: theme.zIndex.drawer + 1,
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(0,0,0,0.15)',
        }}
        open={isLayoverOpen}
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { delay: 0.1, duration: 0.4 } }}
          className='w-full max-w-[600px]'
        >
          <Typography
            variant='h3'
            className='flex items-center gap-3 bg-[#3aaaaa] rounded-2xl py-3 px-6'
          >
            <img src='./fair-protocol-face-transp-eyes.png' style={{ width: '40px' }} />
            {'Please continue on your wallet extension.'}
          </Typography>
          <div className='mt-2 rounded-2xl py-3 px-6 bg-slate-500 font-semibold text-lg'>
            Our chat has some special encryption features that require access to your wallet&apos;s
            public key.
            <br />
            This is optional, but if you do not accept, these features will be temporarily disabled.
          </div>
        </motion.div>
      </Backdrop>
      <RequestAllowance />
    </>
  );
};

export default ReportsChat;
