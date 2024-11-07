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
  useTheme,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormControl,
  MenuItem,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import SendIcon from '@mui/icons-material/Send';
import { ChangeEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { EVMWalletContext } from '@/context/evm-wallet';
import { postOnArweave } from '@fairai/evm-sdk';
import { motion } from 'framer-motion';
import { StyledMuiButton } from '@/styles/components';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import useScroll from '@/hooks/useScroll';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import LibraryAddRoundedIcon from '@mui/icons-material/LibraryAddRounded';
import {
  AddRounded,
  ChatBubbleRounded,
  CheckCircleRounded,
  CloseRounded,
  InfoRounded,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { NumericFormat } from 'react-number-format';
import { DateField, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

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
  const [showAddComment, setShowAddComment] = useState(false);
  const [showAcceptAsDev, setShowAcceptAsDev] = useState(false);
  const { currentAddress } = useContext(EVMWalletContext);

  const handleOpen = useCallback(() => setOpen(true), [setOpen]);
  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  const handleShowNewComment = () => setShowAddComment(!showAddComment);
  const handleShowAcceptAsDev = () => setShowAcceptAsDev(!showAcceptAsDev);

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
                    <Box
                      display={'flex'}
                      flexDirection={'column'}
                      gap={'16px'}
                      flexWrap={'wrap'}
                      maxWidth={'100%'}
                    >
                      <span className='whitespace-pre-wrap text-base sm:text-lg font-medium break-words w-full'>
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
                            className='font-bold saturate-50 brightness-105'
                          />
                        ))}
                      </Box>
                      <div className='w-full p-4 text-sm sm:text-base rounded-xl bg-slate-300 flex flex-col'>
                        <strong className='flex items-center gap-2 mb-4'>
                          <InfoRounded style={{ fontSize: '18px' }} /> Request details
                        </strong>
                        <div className='w-full flex flex-wrap gap-2'>
                          <div className='flex items-center gap-1 rounded-xl bg-white w-fit px-3 py-1 mb-2'>
                            <strong> Planned budget:</strong> US$ 5,000.00
                          </div>
                          <div className='flex items-center gap-1 rounded-xl bg-white w-fit px-3 py-1 mb-2'>
                            <strong> Payment / Deliveries:</strong> Monthly
                          </div>
                          <div className='flex items-center gap-1 rounded-xl bg-white w-fit px-3 py-1 mb-2'>
                            <strong> Date target:</strong> 02/28/2025
                          </div>
                          <div className='flex items-center gap-1 rounded-xl bg-white w-fit px-3 py-1 mb-2'>
                            <strong> Time budget:</strong> 4 months
                          </div>
                        </div>
                      </div>

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
                      {!showAddComment && !showAcceptAsDev && (
                        <div className='animate-slide-down w-full flex flex-wrap gap-3 justify-center'>
                          <Tooltip title='Add a simple text comment.'>
                            <StyledMuiButton className='primary' onClick={handleShowNewComment}>
                              <ChatBubbleRounded />
                              Add a comment
                            </StyledMuiButton>
                          </Tooltip>

                          <Tooltip title='Assign yourself as a developer for this request. You can suggest different budgets, time or solutions.'>
                            <StyledMuiButton className='secondary' onClick={handleShowAcceptAsDev}>
                              <CheckCircleRounded />
                              Accept and develop this request
                            </StyledMuiButton>
                          </Tooltip>
                        </div>
                      )}

                      {showAddComment && (
                        <div className='w-full flex gap-3 items-center animate-slide-down'>
                          <StyledMuiButton
                            className='secondary fully-rounded mini mt-1'
                            onClick={handleShowNewComment}
                          >
                            <CloseRounded />
                          </StyledMuiButton>
                          <TextField
                            placeholder='Add a new comment'
                            variant='outlined'
                            fullWidth
                            value={newComment}
                            onChange={handleCommentChange}
                          />
                          <StyledMuiButton
                            onClick={handleNewComment}
                            className='primary plausible-event-name=Request+Comment+Click'
                          >
                            <SendIcon /> Add
                          </StyledMuiButton>
                        </div>
                      )}

                      {showAcceptAsDev && (
                        <div className='w-full flex flex-col gap-3 animate-slide-down'>
                          <strong className='flex items-center gap-1'>
                            <AddRounded className='primary-text-color' /> Assign yourself as a
                            developer for this request
                          </strong>
                          <span className='font-medium rounded-xl bg-slate-300 px-3 py-2'>
                            You are about to suggest yourself as a developer of this request.
                            <br />
                            Everything you fill here will be publicly visible in this request!
                            <br />
                            You can accept everything as is, or suggest a different budget,
                            different target date, time needed or a different payment plan.
                            <br />
                            The request creator will be able to counter your offer with a different
                            one, or accept it.
                            <br /> You can also leave any additional info or comments in the comment
                            box, as needed.
                          </span>

                          <strong className='mt-4'>You suggestion / proposal</strong>

                          <div className='flex gap-3'>
                            <FormGroup>
                              <FormControlLabel
                                control={<Checkbox defaultChecked />}
                                label='I accept the request as is and want to start right away.'
                              />
                            </FormGroup>
                          </div>

                          <div className='flex gap-3 items-end flex-wrap'>
                            <NumericFormat
                              label='Budget suggestion'
                              customInput={TextField}
                              thousandSeparator
                              prefix='US$ '
                              placeholder='(optional)'
                              className='w-full max-w-[170px]'
                            ></NumericFormat>
                            <FormControl className='w-full max-w-[250px]'>
                              <TextField label='Payments plan suggestion' className='w-full' select>
                                <MenuItem value={1}>Daily deliveries and payments</MenuItem>
                                <MenuItem value={2}>Weekly deliveries and payments</MenuItem>
                                <MenuItem value={3}>Monthly deliveries and payments</MenuItem>
                                <MenuItem value={4}>Yearly deliveries and payments</MenuItem>
                                <MenuItem value={5}>All at once, right at the start</MenuItem>
                                <MenuItem value={6}>All at once, when project ends</MenuItem>
                              </TextField>
                            </FormControl>

                            <div className='flex-grow flex flex-col gap-1'>
                              <strong>Time budget / date target suggestion</strong>

                              <div className='flex items-center flex-wrap gap-3'>
                                <LocalizationProvider dateAdapter={AdapterMoment}>
                                  <DateField
                                    className='flex-grow max-w-[150px]'
                                    label='Date target'
                                  />
                                </LocalizationProvider>
                                <strong>or</strong>
                                <div className='flex-grow flex gap-3 flex-nowrap'>
                                  <NumericFormat
                                    className='w-full max-w-[100px]'
                                    customInput={TextField}
                                    thousandSeparator
                                    placeholder='00'
                                  ></NumericFormat>
                                  <TextField
                                    label='Type'
                                    className='w-full max-w-[150px]'
                                    required
                                    select
                                  >
                                    <MenuItem value={1}>Day(s)</MenuItem>
                                    <MenuItem value={2}>Week(s)</MenuItem>
                                    <MenuItem value={3}>Month(s)</MenuItem>
                                    <MenuItem value={4}>Year(s)</MenuItem>
                                  </TextField>
                                </div>
                              </div>
                            </div>
                          </div>

                          <strong>Ways to contact you</strong>

                          <div className='flex gap-3'>
                            <TextField
                              label='Your website URL'
                              placeholder='(optional)'
                              variant='outlined'
                              className='w-full max-w-[300px]'
                            />
                            <TextField
                              label='Your X (twitter) handle'
                              placeholder='(optional)'
                              variant='outlined'
                              className='w-full max-w-[300px]'
                              InputProps={{ startAdornment: <>@ </> }}
                            />
                          </div>

                          <strong>Anything else?</strong>

                          <TextField
                            label='Add a comment'
                            placeholder='Optional. This comment will be publicly visible.'
                            variant='outlined'
                            fullWidth
                            value={newComment}
                            onChange={handleCommentChange}
                          />

                          <div className='flex gap-3 flex-wrap justify-center mt-3'>
                            <StyledMuiButton className='secondary ' onClick={handleShowAcceptAsDev}>
                              <CloseRounded /> Cancel
                            </StyledMuiButton>
                            <StyledMuiButton className='primary'>
                              <SendIcon /> Submit
                            </StyledMuiButton>
                          </div>
                        </div>
                      )}
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
              {request.title.substring(0, 200) + (request.title.length > 200 ? ' (...)' : '')}

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
                  textWrap: 'wrap',
                  wordBreak: 'break-word',
                  fontWeight: 400,
                }}
              >
                {request.description.substring(0, 500) +
                  (request.description.length > 500 ? ' (...)' : '')}
              </Typography>
              <Box
                display={'flex'}
                justifyContent={'flex-end'}
                alignItems={'center'}
                gap={'5px'}
                flexWrap={'wrap'}
              >
                <div
                  className='font-bold mr-2 flex-auto flex gap-2 flex-wrap'
                  style={{ fontSize: '14px' }}
                >
                  <Chip
                    variant='outlined'
                    label={`${comments.length} ${comments.length === 1 ? ' comment' : ' comments'}`}
                    color='secondary'
                  />
                  <Chip variant='outlined' label={'Monthly payments'} color='primary' />
                </div>
                {request.keywords.map((keyword) => (
                  <Chip
                    key={keyword}
                    label={keyword}
                    variant='filled'
                    color='primary'
                    className='font-bold saturate-50 brightness-105'
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

const MakeRequestMessage = ({ smallScreen }: { smallScreen: boolean }) => {
  const navigate = useNavigate();
  const openRequestsRoute = useCallback(() => navigate('/request'), [navigate]);

  return (
    <div className='flex justify-center w-full animate-slide-down'>
      <div
        style={{
          opacity: 1,
          height: 'fit-content',
          minHeight: '40px',
          width: 'fit-content',
          maxWidth: '100%',
          marginTop: !smallScreen ? '30px' : '20px',
          padding: !smallScreen ? '20px' : '10px',
          borderRadius: '20px',
          background: 'linear-gradient(200deg, #bfe3e0, #a9c9d4)',
          color: '#003030',
          marginLeft: '20px',
          marginRight: '20px',
        }}
        className='w-full flex flex-wrap justify-center xl:justify-between items-center gap-3 shadow-sm font-medium overflow-hidden text-xs md:text-base'
      >
        <span className='px-2 flex flex-nowrap gap-3 items-center'>
          <InfoRounded className='mr-2' />
          Are you looking for custom made, tailored solutions for your own projects?
          <br />
          Create your request listing, define your budget and quickly get amazing solutions tailored
          for you by the trusted FairAI community members.
        </span>

        <StyledMuiButton
          style={{
            display: 'flex',
            gap: '5px',
            alignItems: 'center',
          }}
          className='plausible-event-name=HomeScreen-Info-Message-Access-Requests primary'
          onClick={openRequestsRoute}
        >
          <LibraryAddRoundedIcon style={{ width: '20px', marginRight: '4px' }} />
          Create a request
        </StyledMuiButton>
      </div>
    </div>
  );
};

const BrowseRequests = () => {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [filtering, setFiltering] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { isAtBottom, isScrolled } = useScroll(ref);
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const md = theme.breakpoints.values.md;
    setIsSmallScreen(width < md);
  }, [width, theme, setIsSmallScreen]);

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
  const isLoading = useMemo(() => loading || filtering, [loading, filtering]);

  useEffect(() => {
    (async () => {
      setFiltering(true);
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
      setFiltering(false);
    })();
  }, [data]);

  const handleScrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [bottomRef]);

  useEffect(() => {
    // remove scroll from main element
    const mainEl = document.getElementById('main');
    if (mainEl) {
      mainEl.style.overflowY = 'visible';
    }

    // on unmount re-add scroll to main ot not break other parts of app
    return () => {
      if (mainEl) {
        mainEl.style.overflowY = 'auto';
      }
    };
  }, []); // run only on first load

  return (
    <div className='flex justify-center w-full'>
      <div
        className='max-h-[100vh] overflow-y-auto pb-[56px] w-full max-w-[1600px] animate-slide-down'
        ref={ref}
      >
        <div className='w-full flex justify-center'>
          <div className='w-full max-w-[1600px] px-10 mt-10 flex flex-wrap justify-center sm:justify-between items-center font-bold gap-5'>
            <a href='#/'>
              <StyledMuiButton className='secondary'>
                <ArrowBackIosNewRoundedIcon />
                Back
              </StyledMuiButton>
            </a>
            <div className='gap-3 flex justify-center items-center text-lg lg:text-3xl'>
              <img
                src='./fair-protocol-face-primarycolor.png'
                style={{ width: 40, marginTop: 5 }}
              />
              Current Feature Requests
            </div>
            <div></div>
          </div>
        </div>

        {isLoading && (
          <Box display={'flex'} justifyContent={'center'} alignItems={'center'} marginTop={'30px'}>
            <Typography sx={{ fontWeight: 600, fontSize: '120%' }}>
              {'Loading requests...'}
            </Typography>
          </Box>
        )}

        {!isLoading && <MakeRequestMessage smallScreen={isSmallScreen} />}

        {requests.length === 0 && !isLoading && (
          <Box display={'flex'} justifyContent={'center'} alignItems={'center'} marginTop={'30px'}>
            <Typography sx={{ fontWeight: 600, fontSize: '120%' }}>
              {'No requests found.'}
            </Typography>
          </Box>
        )}

        {requests.length > 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: '-40px' }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.1, type: 'smooth' } }}
          >
            <Box>
              <div className='flex justify-center items-center'>
                <div className='flex flex-wrap gap-10 w-full max-w-[1600px] p-10'>
                  {requests.map((req) => (
                    <div style={{ flex: '1 1 500px' }} key={req.id}>
                      <RequestElement request={req} />
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              </div>
            </Box>
          </motion.div>
        )}
      </div>
      <motion.div
        initial={{ opacity: 0, y: '-40px' }}
        animate={{
          opacity: !isScrolled || !isAtBottom ? 1 : 0,
          y: 0,
          transition: { duration: 0.1, type: 'smooth' },
        }}
        className={'absolute bottom-[20px] right-[20px]'}
      >
        <Fab onClick={handleScrollToBottom}>
          <img src='./chevron-bottom.svg' />
        </Fab>
      </motion.div>
    </div>
  );
};

export default BrowseRequests;
