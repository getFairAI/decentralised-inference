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

import DebounceIconButton from '@/components/debounce-icon-button';
import { PROTOCOL_NAME, PROTOCOL_VERSION, TAG_NAMES } from '@/constants';
import { gql, useQuery } from '@apollo/client';
import Close from '@mui/icons-material/Close';
import {
  Card,
  Box,
  CardContent,
  Chip,
  Typography,
  CardActionArea,
  DialogTitle,
  DialogContent,
  Modal,
  Paper,
  TextField,
  Fab,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import SendIcon from '@mui/icons-material/Send';
import { ChangeEvent, useCallback, useContext, useEffect, useState } from 'react';
import { EVMWalletContext } from '@/context/evm-wallet';
import { postOnArweave } from '@fairai/evm-sdk';
import { motion } from 'framer-motion';
import { StyledMuiButton } from '@/styles/components';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';

interface IrysTx {
  id: string;
  tags: {
    name: string;
    value: string;
  }[];
  address: string;
}

interface RequestData {
  title: string;
  description: string;
  keywords: string[];
  id: string;
  owner: string;
  timestamp: string;
}

const irysQuery = gql`
  query requestsOnIrys($tags: [TagFilter!], $first: Int, $after: String) {
    transactions(tags: $tags, first: $first, after: $after, order: DESC) {
      edges {
        node {
          id
          tags {
            name
            value
          }
          address
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

interface Comment {
  owner: string;
  timestamp: string;
  content: string;
}

const CommentElement = ({ comment, request }: { comment: Comment; request: RequestData }) => {
  const handleAddressClick = useCallback(() => {
    window.open(`https://arbiscan.io/address/${comment.owner}`, '_blank');
  }, [comment]);

  return (
    <div className='rounded-xl bg-white py-5 px-6'>
      <Box key={comment.timestamp} display={'flex'} flexDirection={'column'} gap={'8px'}>
        <div className='flex gap-2 items-center'>
          <img src='./icons/comment_icon_fill_primarycolor.svg' style={{ width: '16px' }} />{' '}
          <Typography variant='caption'>
            {'Commented by '}
            <a style={{ cursor: 'pointer', color: '#3aaaaa' }} onClick={handleAddressClick}>
              <u>
                {comment.owner.slice(0, 6)}...{comment.owner.slice(-4)}
              </u>
            </a>
            {` on ${new Date(Number(comment.timestamp) * 1000).toLocaleString()}`}
          </Typography>
          {comment.owner === request.owner && (
            <Tooltip title={'User that created this request.'}>
              <div className='rounded-xl bg-[#3aaaaa] px-2 py-1 text-white font-bold text-xs max-fit'>
                Request Creator
              </div>
            </Tooltip>
          )}
        </div>
        <div className='font-medium text-sm sm:text-base'>{comment.content}</div>
      </Box>
    </div>
  );
};

const RequestElement = ({ request }: { request: RequestData }) => {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const { currentAddress } = useContext(EVMWalletContext);

  const handleOpen = useCallback(() => setOpen(true), [setOpen]);
  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  const { data: commentsData } = useQuery(irysQuery, {
    variables: {
      tags: [
        { name: TAG_NAMES.protocolName, values: [PROTOCOL_NAME] },
        { name: TAG_NAMES.protocolVersion, values: [PROTOCOL_VERSION] },
        { name: TAG_NAMES.operationName, values: ['Comment'] },
        { name: 'Comment-For', values: [request.id] },
      ],
    },
    skip: !request.id,
    context: {
      clientName: 'irys',
    },
  });

  const handleCommentChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setNewComment(e.target.value),
    [setNewComment],
  );

  const handleNewComment = useCallback(async () => {
    const comment = {
      owner: currentAddress,
      timestamp: (Date.now() / 1000).toString(),
      content: newComment,
    };

    const tags = [
      { name: TAG_NAMES.protocolName, value: PROTOCOL_NAME },
      { name: TAG_NAMES.protocolVersion, value: PROTOCOL_VERSION },
      { name: TAG_NAMES.operationName, value: 'Comment' },
      { name: 'Comment-For', value: request.id },
      { name: TAG_NAMES.unixTime, value: (Date.now() / 1000).toString() },
    ];

    await postOnArweave(newComment, tags);

    setComments((prev) => [...prev, comment]);
    setNewComment('');
  }, [request, newComment, currentAddress, setComments, setNewComment]);

  useEffect(() => {
    if (commentsData && commentsData.transactions.edges) {
      (async () => {
        const allComments = [];
        for (const tx of commentsData.transactions.edges) {
          const res = await fetch(`https://arweave.net/${tx.node.id}`);
          const data = await res.text();

          allComments.push({
            owner: tx.node.address,
            timestamp:
              tx.node.tags.find(
                (tag: { name: string; value: string }) => tag.name === TAG_NAMES.unixTime,
              )?.value ?? '',
            content: data,
          });
        }

        setComments(allComments);
      })();
    }
  }, [commentsData, setComments]);

  const handleAddressClick = useCallback(() => {
    window.open(`https://arbiscan.io/address/${request.owner}`, '_blank');
  }, [request]);

  return (
    <>
      <Modal
        open={open}
        sx={{
          backdropFilter: 'blur(10px)',
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            maxHeight: '100vh',
            overflow: 'auto',
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: '1200px',
              gap: '12px',
              padding: '20px',
              boxSizing: 'border-box',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: '-40px' }}
              animate={{ opacity: 1, y: 0 }}
              className='w-full'
            >
              <Paper sx={{ padding: '10px', width: '100%' }}>
                <Box>
                  <DialogTitle display='flex' justifyContent={'flex-end'} gap={'5px'}>
                    <Box display={'flex'} flexDirection={'column'} width={'100%'}>
                      <div className='font-semibold text-lg sm:text-2xl'>{request.title}</div>
                      <Typography variant='caption'>
                        {`Created on ${new Date(
                          Number(request.timestamp) * 1000,
                        ).toLocaleString()} by `}
                        <a
                          style={{ cursor: 'pointer', color: '#3aaaaa' }}
                          onClick={handleAddressClick}
                        >
                          <u>
                            {request.owner.slice(0, 6)}...{request.owner.slice(-4)}
                          </u>
                        </a>
                      </Typography>
                    </Box>

                    <div className=' relative translate-x-4'>
                      <StyledMuiButton
                        onClick={handleClose}
                        className='plausible-event-name=Close+Model+Click secondary fully-rounded smaller'
                      >
                        <Close />
                      </StyledMuiButton>
                    </div>
                  </DialogTitle>
                  <DialogContent>
                    <Box display={'flex'} flexDirection={'column'} gap={'16px'} flexWrap={'wrap'}>
                      <span className='whitespace-pre-wrap text-base sm:text-lg font-medium'>
                        {request.description}
                      </span>
                      <Box
                        display={'flex'}
                        justifyContent={'flex-end'}
                        gap={'8px'}
                        flexWrap={'wrap'}
                      >
                        {request.keywords.map((keyword) => (
                          <Chip
                            key={keyword}
                            label={keyword}
                            variant='filled'
                            color='primary'
                            className='font-bold saturate-50'
                          />
                        ))}
                      </Box>
                      <div className='w-full px-2 font-semibold text-sm sm:text-base'>
                        {comments.length} {comments.length === 1 ? ' comment' : 'comments'}
                      </div>
                      {comments.length === 0 && (
                        <Typography
                          width={'100%'}
                          display={'flex'}
                          justifyContent={'center'}
                          fontWeight={600}
                          className='bg-white rounded-lg py-3'
                        >
                          {'No comments yet.'}
                        </Typography>
                      )}
                      {comments.map((comment) => (
                        <CommentElement
                          key={comment.timestamp}
                          comment={comment}
                          request={request}
                        />
                      ))}
                    </Box>
                  </DialogContent>
                </Box>

                {currentAddress && (
                  <motion.div
                    className='w-full justify-center'
                    initial={{ opacity: 0, y: '-40px' }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
                  >
                    <div className='w-full px-6 pt-3 pb-6'>
                      <TextField
                        placeholder='Add a new comment'
                        variant='outlined'
                        fullWidth
                        value={newComment}
                        onChange={handleCommentChange}
                        sx={{
                          bgcolor: 'white',
                          borderRadius: '8px',
                        }}
                        InputProps={{
                          sx: {
                            ':before': {
                              borderBottom: 'none',
                            },
                            ':after': {
                              borderBottom: 'none',
                            },
                            ':hover:not(.Mui-disabled .Mui-error):before': {
                              borderBottom: 'none',
                            },
                          },
                          endAdornment: (
                            <DebounceIconButton
                              onClick={handleNewComment}
                              className='plausible-event-name=Request+Comment+Click'
                            >
                              <SendIcon style={{ color: '#3aaaaa' }} />
                            </DebounceIconButton>
                          ),
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </Paper>
            </motion.div>
          </Box>
        </div>
      </Modal>

      <Grid xs={12} md={6} lg={4} key={request.id} sx={{ display: 'flex', alignItems: 'center' }}>
        <Card raised={true} elevation={1} sx={{ backgroundColor: '#ffffff !important' }}>
          <CardActionArea onClick={handleOpen}>
            <div
              className='flex flex-col gap-1'
              style={{ fontWeight: 600, padding: '10px 15px', fontSize: '18px', marginTop: '5px' }}
            >
              {request.title}

              <Typography variant='caption'>
                {`${new Date(Number(request.timestamp) * 1000).toLocaleString()} by `}
                <a style={{ cursor: 'pointer', color: '#3aaaaa' }} onClick={handleAddressClick}>
                  <u>
                    {request.owner.slice(0, 6)}...{request.owner.slice(-4)}
                  </u>
                </a>
              </Typography>
            </div>
            <CardContent>
              <Typography
                sx={{
                  WebkitLineClamp: 3,
                  paddingBottom: '20px',
                  fontWeight: 400,
                }}
              >
                {request.description}
              </Typography>
              <Box
                display={'flex'}
                justifyContent={'flex-end'}
                alignItems={'center'}
                gap={'5px'}
                flexWrap={'wrap'}
              >
                <span className='font-bold mr-2 flex-auto' style={{ fontSize: '14px' }}>
                  {comments.length} {comments.length === 1 ? ' comment' : ' comments'}
                </span>
                {request.keywords.map((keyword) => (
                  <Chip
                    key={keyword}
                    label={keyword}
                    variant='filled'
                    color='primary'
                    className='font-bold saturate-50'
                  />
                ))}
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
    </>
  );
};

const BrowseRequests = () => {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const { data, loading } = useQuery(irysQuery, {
    variables: {
      tags: [
        { name: TAG_NAMES.protocolName, values: [PROTOCOL_NAME] },
        { name: TAG_NAMES.protocolVersion, values: [PROTOCOL_VERSION] },
        { name: TAG_NAMES.operationName, values: ['Request-Solution'] },
      ],
      first: 10,
    },
    context: {
      clientName: 'irys',
    },
  });

  useEffect(() => {
    (async () => {
      const txs: { node: IrysTx }[] = data?.transactions?.edges ?? [];

      const txsData: RequestData[] = [];
      for (const tx of txs) {
        const response = await fetch(`https://arweave.net/${tx.node.id}`);
        const json = await response.json();

        txsData.push({
          ...json,
          id: tx.node.id,
          owner: tx.node.address,
          timestamp: tx.node.tags.find((tag) => tag.name === TAG_NAMES.unixTime)?.value ?? '',
        } as RequestData);
      }

      setRequests(txsData);
    })();
  }, [data]);

  return (
    <>
      <div className='bg-[#EDEDED] h-full w-full fixed -z-10'></div>

      <motion.div
        initial={{ opacity: 0, y: '-40px' }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.3, type: 'smooth' } }}
      >
        <div className='w-full flex justify-center'>
          <div className='w-full max-w-[1600px] px-10 mt-10 flex flex-wrap-reverse justify-center sm:justify-between items-center font-bold gap-5'>
            <div className='gap-3 flex justify-center items-center text-lg lg:text-3xl'>
              <img
                src='./fair-protocol-face-primarycolor.png'
                style={{ width: 40, marginTop: 5 }}
              />
              Current Feature Requests
            </div>
            <a href='#/'>
              <StyledMuiButton className='secondary whitespace-nowrap'>
                <ArrowBackIosNewRoundedIcon />
                Go Back
              </StyledMuiButton>
            </a>
          </div>
        </div>

        {loading && (
          <Box display={'flex'} justifyContent={'center'} alignItems={'center'} marginTop={'30px'}>
            <Typography sx={{ fontWeight: 600, fontSize: '120%' }}>
              {'Loading requests...'}
            </Typography>
          </Box>
        )}

        {requests.length === 0 && !loading && (
          <Box display={'flex'} justifyContent={'center'} alignItems={'center'} marginTop={'30px'}>
            <Typography sx={{ fontWeight: 600, fontSize: '120%' }}>
              {'No requests found.'}
            </Typography>
          </Box>
        )}

        {requests.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: '-40px' }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3, type: 'smooth' } }}
          >
            <Box>
              <div className='flex justify-center items-center'>
                <div className='flex flex-wrap gap-10 w-full max-w-[1600px] p-10'>
                  {requests.map((req) => (
                    <div style={{ flex: '1 1 500px' }} key={req.id}>
                      <RequestElement request={req} />
                    </div>
                  ))}
                  <Fab
                    sx={{
                      /* widht: '20px', height: '20px', */ position: 'absolute',
                      bottom: '30px',
                      right: '30px',
                    }}
                  >
                    <img src='./chevron-bottom.svg' />
                  </Fab>
                </div>
              </div>
            </Box>
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

export default BrowseRequests;
