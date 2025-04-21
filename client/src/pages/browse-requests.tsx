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
  databaseConfigType,
  needsAppConfig,
  paymentPlanBrowseTag,
  paymentPlanType,
} from '@/utils/requestsPipeFunctions';
import { PROTOCOL_NAME_TEST, PROTOCOL_VERSION_TEST, TAG_NAMES } from '@/constants';
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
  CircularProgress,
  Switch,
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
import {
  AddRounded,
  ChatBubbleRounded,
  CheckCircleRounded,
  CloseRounded,
  InfoRounded,
  ReplyRounded,
  StarRounded,
} from '@mui/icons-material';
import { NumericFormat } from 'react-number-format';
import { DateField, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { IRequestSolution } from '@/interfaces/common';
import dayjs from 'dayjs';
import MakeRequestBanner from '@/components/make-request-banner';
import { ITag } from '@/interfaces/arweave';

interface IrysTx {
  id: string;
  tags: {
    name: string;
    value: string;
  }[];
  address: string;
}

interface RequestData extends IRequestSolution {
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
  id: string;
  owner: string;
  timestamp: string;
  content: string;
  commentType: 'text' | 'suggestion';
  showReplyInput?: boolean;
  showMakeSuggestionInputs?: boolean;
  replies?: Comment[];
  tags: ITag[];
}

const CommentElement = ({
  comment,
  request,
  refetchComments,
  isReply,
  replyToUserAddress,
  commentType,
  replyChainMainParentId,
}: {
  comment: Comment;
  request: RequestData;
  isReply: boolean;
  replyToUserAddress: string;
  replyChainMainParentId: string;
  commentType: 'text' | 'suggestion';
  refetchComments: () => void;
}) => {
  const handleAddressClick = useCallback(() => {
    window.open(`https://arbiscan.io/address/${comment.owner}`, '_blank');
  }, [comment]);

  const [changedComment, setChangedComment] = useState(comment);
  const [replyingToCommentId, setReplyingToCommentId] = useState('');
  const [replyingToUserAddress, setReplyingToUserAddress] = useState('');
  const [reply, setReply] = useState('');

  const handleShowSuggestionInputsReply = (commentToChange: Comment) => {
    if (commentToChange.showReplyInput) {
      // reply is open, open the suggestion inputs
      commentToChange.showMakeSuggestionInputs = !commentToChange.showMakeSuggestionInputs;
    } else {
      // reply is closed
      commentToChange.showMakeSuggestionInputs = false;
    }

    if (commentToChange.showMakeSuggestionInputs) {
      commentToChange.commentType = 'suggestion';
    } else {
      commentToChange.commentType = 'text';
    }

    setChangedComment((prev) => ({ ...prev, ...commentToChange }));
  };

  const handleSetShowAddReply = (
    commentToChange: Comment,
    replyToCommentId: string,
    replyToCommentOwnerAddress: string,
  ) => {
    if (reply && commentToChange.showReplyInput) {
      // reply is open, we are closing it now
      setReply(''); // clear the reply input
      setReplyingToCommentId('');
      setReplyingToUserAddress('');
    } else {
      // reply is closed, initiate new reply
      setReplyingToCommentId(replyToCommentId);
      setReplyingToUserAddress(replyToCommentOwnerAddress);
    }

    commentToChange.showReplyInput = !commentToChange.showReplyInput;
    setChangedComment((prev) => ({ ...prev, ...commentToChange }));
  };

  const handlePostReplyToComment = async (
    commentToChange: Comment,
    reply: string,
    isSuggestion: boolean = false,
  ) => {
    const tags = [
      { name: TAG_NAMES.protocolName, value: PROTOCOL_NAME_TEST },
      { name: TAG_NAMES.protocolVersion, value: PROTOCOL_VERSION_TEST },
      { name: TAG_NAMES.operationName, value: 'Comment' },
      { name: 'Comment-For', value: request.id },
      { name: 'Replying-To-Comment-Id', value: replyingToCommentId },
      { name: 'Replying-To-User-Address', value: replyingToUserAddress },
      { name: 'Reply-Chain-Main-Parent-Id', value: replyChainMainParentId },
      { name: 'Comment-Type', value: isSuggestion ? 'suggestion' : 'text' },
      { name: TAG_NAMES.unixTime, value: (Date.now() / 1000).toString() },
    ];

    await postOnArweave(reply, tags);

    refetchComments();

    handleSetShowAddReply(commentToChange, '', '');
  };

  return (
    <div className='w-100 flex flex-nowrap gap-2 my-1' key={changedComment.timestamp}>
      {isReply && <div className='w-[5px] bg-[#c0e9e9] rounded-xl h-100 flex-grow-0'></div>}

      <div
        className={
          'rounded-xl bg-neutral-100 py-5 px-6 w-100 flex-grow ' +
          (commentType === 'suggestion' ? 'bg-[#fdf4e4]' : '')
        }
      >
        <div className='flex flex-col gap-4'>
          <div className='flex gap-2 items-center'>
            {commentType === 'text' && (
              <img src='./icons/comment_icon_fill_primarycolor.svg' style={{ width: '16px' }} />
            )}

            {commentType === 'suggestion' && <StarRounded className='text-[#f7ad22]' />}

            <Typography variant='caption'>
              {!isReply ? 'Comment by ' : 'Reply by '}
              <a style={{ cursor: 'pointer', color: '#3aaaaa' }} onClick={handleAddressClick}>
                <u>
                  {changedComment.owner.slice(0, 6)}...{changedComment.owner.slice(-4)}
                </u>
              </a>
              {isReply && replyToUserAddress && (
                <>
                  {' to '}
                  <a style={{ cursor: 'pointer', color: '#3aaaaa' }} onClick={handleAddressClick}>
                    <u>
                      {replyToUserAddress.slice(0, 6)}...{replyToUserAddress.slice(-4)}
                    </u>
                  </a>
                </>
              )}
              {` on ${new Date(Number(changedComment.timestamp) * 1000).toLocaleString()}`}
            </Typography>
            {changedComment.owner === request.owner && (
              <Tooltip title={'User that created this request.'}>
                <div className='rounded-xl bg-[#3aaaaa] px-2 py-1 text-white font-bold text-xs max-fit mx-1'>
                  Request Creator
                </div>
              </Tooltip>
            )}
            {commentType === 'suggestion' && (
              <div className='rounded-xl bg-[#ffca1b] px-2 py-1 font-bold text-xs max-fit mx-1'>
                Suggestion
              </div>
            )}
          </div>

          {commentType === 'suggestion' && (
            <div className='w-100 flex flex-col gap-1'>
              <div className='flex gap-2 flex-wrap mt-2'>
                <div className='bg-white rounded-xl px-3 py-1'>
                  <strong>Budget suggestion: </strong> US$ 6,000.00
                </div>
                <div className='bg-white rounded-xl px-3 py-1'>
                  <strong>Time suggestion: </strong> 6 month(s)
                </div>
                <div className='bg-white rounded-xl px-3 py-1'>
                  <strong>Payment / Deliveries: </strong> All at once, right at the start
                </div>
              </div>
              <div className='flex gap-2 flex-wrap mt-2'>
                <div className='bg-white rounded-xl px-3 py-1'>
                  <strong>X / Twitter: </strong>
                  <a
                    href='https://www.x.com/@getfairai'
                    target='_blank'
                    rel='noreferrer'
                    className='primary-text-color underline'
                  >
                    @getfairai
                  </a>
                </div>
                <div className='bg-white rounded-xl px-3 py-1'>
                  <strong>LinkedIn: </strong>
                  <a
                    href='https://www.linkedin.com/'
                    target='_blank'
                    rel='noreferrer'
                    className='primary-text-color underline'
                  >
                    @getfairai
                  </a>
                </div>
                <div className='bg-white rounded-xl px-3 py-1'>
                  <strong>Website: </strong>
                  <a
                    href='https://getfair.ai'
                    target='_blank'
                    rel='noreferrer'
                    className='primary-text-color underline'
                  >
                    getfair.ai
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className='font-medium text-sm sm:text-base px-2'>{changedComment.content}</div>

          {!changedComment?.showReplyInput && (
            <div className='w-full flex justify-end gap-2 flex-wrap mt-2 animate-slide-right'>
              <StyledMuiButton
                className='outlined-secondary'
                onClick={() =>
                  handleSetShowAddReply(changedComment, changedComment.id, changedComment.owner)
                }
              >
                <ReplyRounded /> Reply
              </StyledMuiButton>
            </div>
          )}

          {changedComment?.showReplyInput && (
            <>
              <div className='w-full font-bold text-sm mt-3 animate-slide-left pl-11 flex justify-between flex-wrap items-center'>
                <div className='flex-grow flex items-center gap-1'>
                  Replying to
                  <span className='primary-text-color'>
                    {replyingToUserAddress.slice(0, 6)}...{replyingToUserAddress.slice(-4)}
                  </span>
                  :
                </div>

                <div className='flex-grow-0 flex justify-end items-center'>
                  <Switch
                    checked={changedComment.showMakeSuggestionInputs ?? false}
                    onClick={() => handleShowSuggestionInputsReply(changedComment)}
                  />
                  Suggest different budgets
                </div>
              </div>

              {changedComment?.showMakeSuggestionInputs && (
                <>
                  <div className='pl-4 w-100 flex flex-col'>
                    <strong className='flex items-center gap-2'>
                      <StarRounded className='primary-text-color' /> Suggesting new budgets and/or
                      targets
                    </strong>
                    <p className='pl-8'>
                      Fill any field as needed. All fields are optional. <br />
                      These will be added to your comment and will be publicly visible.
                    </p>
                  </div>
                  <div className='w-full mt-3 animate-slide-left pl-11 flex flex-col gap-2'>
                    <strong>Budgets and date targets suggestion</strong>

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
                        <TextField
                          label='Payments plan suggestion'
                          placeholder='(optional)'
                          className='w-full'
                          select
                        >
                          <MenuItem value={1}>Daily deliveries and payments</MenuItem>
                          <MenuItem value={2}>Weekly deliveries and payments</MenuItem>
                          <MenuItem value={3}>Monthly deliveries and payments</MenuItem>
                          <MenuItem value={4}>Yearly deliveries and payments</MenuItem>
                          <MenuItem value={5}>All at once, right at the start</MenuItem>
                          <MenuItem value={6}>All at once, when project ends</MenuItem>
                        </TextField>
                      </FormControl>

                      <div className='flex-grow flex flex-col gap-1 mt-2'>
                        <div className='flex items-center flex-wrap gap-3'>
                          <LocalizationProvider dateAdapter={AdapterMoment}>
                            <DateField className='flex-grow max-w-[150px]' label='Date target' />
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

                    <strong className='mt-2'>Ways to contact you</strong>

                    <div className='flex gap-3 items-end flex-wrap'>
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
                        <TextField
                          label='Your LinkedIn handle'
                          placeholder='(optional)'
                          variant='outlined'
                          className='w-full max-w-[300px]'
                          InputProps={{ startAdornment: <>@ </> }}
                        />
                      </div>
                    </div>

                    <strong className='mt-2'>Anything else?</strong>
                  </div>
                </>
              )}

              <div className='w-full flex gap-3 items-center animate-slide-left'>
                <StyledMuiButton
                  className='secondary fully-rounded mini mt-1'
                  onClick={() =>
                    handleSetShowAddReply(changedComment, changedComment.id, changedComment.owner)
                  }
                >
                  <CloseRounded />
                </StyledMuiButton>
                <TextField
                  placeholder='Type your comment here'
                  variant='outlined'
                  fullWidth
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <StyledMuiButton
                  onClick={() => handlePostReplyToComment(changedComment, reply, false)}
                  className='primary plausible-event-name=Request+Reply+Post+Click'
                >
                  <SendIcon /> Send
                </StyledMuiButton>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const RequestElement = ({ request }: { request: RequestData }) => {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoadingAnim, setCommentsLoadingAnim] = useState<boolean>(false);
  const [commentsAmountTotal, setCommentsAmountTotal] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [showAddComment, setShowAddComment] = useState(false);
  const [showAcceptAsDev, setShowAcceptAsDev] = useState(false);
  const { currentAddress } = useContext(EVMWalletContext);

  const handleOpen = useCallback(() => setOpen(true), [setOpen]);
  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  const handleShowNewComment = () => setShowAddComment(!showAddComment);
  const handleShowAcceptAsDev = () => setShowAcceptAsDev(!showAcceptAsDev);

  const {
    data: commentsData,
    refetch,
    loading: loadingQuery,
  } = useQuery(irysQuery, {
    variables: {
      tags: [
        { name: TAG_NAMES.protocolName, values: [PROTOCOL_NAME_TEST] },
        { name: TAG_NAMES.protocolVersion, values: [PROTOCOL_VERSION_TEST] },
        { name: TAG_NAMES.operationName, values: ['Comment'] },
        { name: 'Comment-For', values: [request.id] },
      ],
    },
    skip: !request.id,
    context: {
      clientName: 'irys',
    },
    notifyOnNetworkStatusChange: true,
  });

  const handleCommentChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setNewComment(e.target.value),
    [setNewComment],
  );

  const handleNewComment = useCallback(async () => {
    const tags = [
      { name: TAG_NAMES.protocolName, value: PROTOCOL_NAME_TEST },
      { name: TAG_NAMES.protocolVersion, value: PROTOCOL_VERSION_TEST },
      { name: TAG_NAMES.operationName, value: 'Comment' },
      { name: 'Comment-For', value: request.id },
      { name: TAG_NAMES.unixTime, value: (Date.now() / 1000).toString() },
    ];

    await postOnArweave(newComment, tags);

    refetch();
    setNewComment('');
  }, [request, newComment, currentAddress, setComments, setNewComment]);

  useEffect(() => {
    if (commentsData && commentsData.transactions.edges) {
      (async () => {
        const allComments: Comment[] = [];
        setCommentsLoadingAnim(true);
        for (const tx of commentsData.transactions.edges) {
          const res = await fetch(`https://arweave.net/${tx.node.id}`);
          const data = await res.text();

          allComments.push({
            id: tx.node.id,
            owner: tx.node.address,
            commentType:
              tx.node.tags.find(
                (tag: { name: string; value: string }) => tag.name === 'Comment-Type',
              )?.value ?? 'text',
            timestamp:
              tx.node.tags.find(
                (tag: { name: string; value: string }) => tag.name === TAG_NAMES.unixTime,
              )?.value ?? '',
            content: data,
            tags: tx.node.tags,
          });
        }

        const allCommentsWithReplies: Comment[] = [];

        // check and organize comment replies
        allComments.forEach((comment: Comment) => {
          if (allCommentsWithReplies.find((parent) => parent.id === comment.id)) {
            // if this comment is already added, skip it
            return;
          }
          // lets use the main parent Id for now ... (only 1 level of replies)
          const foundId = comment.tags.find(
            (tag) => tag.name === 'Reply-Chain-Main-Parent-Id',
          )?.value;
          if (foundId) {
            // its a reply
            const foundParentIndex = allCommentsWithReplies.findIndex(
              (parent) => parent.id === foundId,
            );
            if (foundParentIndex >= 0) {
              if (!allCommentsWithReplies[foundParentIndex]?.replies) {
                allCommentsWithReplies[foundParentIndex].replies = [];
              }

              allCommentsWithReplies[foundParentIndex].replies.push(comment);
            } else {
              const foundParentInAllComments = allComments.find(
                (allComment) => allComment.id === foundId,
              );
              if (foundParentInAllComments) {
                allCommentsWithReplies.push({
                  ...foundParentInAllComments,
                  ...{
                    replies: [comment],
                  },
                });
              }
            }
          } else {
            // if its reply and no parent was found, show it as a parent anyway
            allCommentsWithReplies.push(comment);
          }
        });

        const totalComments = allCommentsWithReplies.reduce((acc: number, comment: Comment) => {
          if (comment.replies) {
            acc += comment.replies.length + 1;
          } else {
            acc += 1;
          }
          return acc;
        }, 0);

        setCommentsAmountTotal(totalComments);
        setComments(allCommentsWithReplies);
        setCommentsLoadingAnim(false);
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
              <Paper sx={{ padding: '10px', width: '100%', bgcolor: 'white' }}>
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
                            <strong> Planned budget:</strong>
                            {request.budget}
                          </div>
                          <div className='flex items-center gap-1 rounded-xl bg-white w-fit px-3 py-1 mb-2'>
                            <strong> Payment / Deliveries:</strong>
                            {paymentPlanType(request.paymentPlan)}
                          </div>
                          <div className='flex items-center gap-1 rounded-xl bg-white w-fit px-3 py-1 mb-2'>
                            <strong> Date target:</strong>
                            {dayjs(request.targetUnixTimestamp * 1000).format('MM/YYYY')}
                          </div>
                          <div className='flex items-center gap-1 rounded-xl bg-white w-fit px-3 py-1 mb-2'>
                            <strong> Application Development:</strong>
                            {needsAppConfig(request.needsApp)}
                          </div>
                          <div className='flex items-center gap-1 rounded-xl bg-white w-fit px-3 py-1 mb-2'>
                            <strong> Database:</strong>
                            {databaseConfigType(request.needsDb)}
                          </div>
                        </div>
                      </div>

                      <div className='w-full px-2 font-semibold text-sm sm:text-base'>
                        {commentsAmountTotal} {commentsAmountTotal === 1 ? ' comment' : 'comments'}
                      </div>
                      {commentsAmountTotal === 0 && (
                        <Typography
                          width={'100%'}
                          display={'flex'}
                          justifyContent={'center'}
                          fontWeight={600}
                          className='bg-neutral-100 rounded-lg py-3'
                        >
                          {'No comments yet.'}
                        </Typography>
                      )}

                      {(loadingQuery || commentsLoadingAnim) && (
                        <div className='w-100 flex justify-center items-center my-3 px-2 gap-3'>
                          <CircularProgress size={'18px'} />
                          <span className='font-semibold'>Loading comments ...</span>
                        </div>
                      )}

                      {!loadingQuery && !commentsLoadingAnim && (
                        <>
                          {comments.map((comment) => (
                            <div className='flex flex-col' key={comment.timestamp}>
                              <CommentElement
                                isReply={false}
                                key={comment.timestamp}
                                comment={comment}
                                request={request}
                                refetchComments={refetch}
                                commentType='text'
                                replyToUserAddress=''
                                replyChainMainParentId={comment.id}
                              />

                              {comment?.replies?.length && (
                                <>
                                  {comment.replies.map((reply) => (
                                    <div key={reply.timestamp} className='pl-2'>
                                      <CommentElement
                                        replyChainMainParentId={comment.id}
                                        isReply={true}
                                        comment={reply}
                                        request={request}
                                        refetchComments={refetch}
                                        commentType='text'
                                        replyToUserAddress={
                                          reply.tags.find(
                                            (tag) => tag.name === 'Replying-To-User-Address',
                                          )?.value ?? ''
                                        }
                                      />
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          ))}
                        </>
                      )}
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

                          <Tooltip title='Show your interest into becoming the developer or one of the developers for this request.'>
                            <StyledMuiButton className='secondary' onClick={handleShowAcceptAsDev}>
                              <CheckCircleRounded />I am interested in developing this request
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
                            <SendIcon /> Submit
                          </StyledMuiButton>
                        </div>
                      )}

                      {showAcceptAsDev && (
                        <div className='w-full flex flex-col gap-3 animate-slide-down'>
                          <strong className='flex items-center gap-1'>
                            <AddRounded className='primary-text-color' /> Request to be a developer
                            for this request
                          </strong>
                          <span className='font-medium rounded-xl bg-slate-300 px-3 py-2'>
                            You are about to suggest yourself as a developer or one of the
                            developers for this request.
                            <br />
                            Everything you fill here will be publicly visible in this request
                            comments!
                            <br />
                            You can accept everything as is, or suggest a different budget,
                            different target date, time needed or a different payment plan.
                            <br />
                            The request creator will be able to make a response to your request and
                            let you know more details.
                            <br /> You can also leave any additional info or comments in the
                            &quot;Anything else?&quot; box, as needed.
                          </span>

                          <strong className='mt-4'>You suggestion / proposal</strong>

                          <div className='flex gap-3'>
                            <FormGroup>
                              <FormControlLabel
                                control={<Checkbox defaultChecked />}
                                label='I accept the request as is and am ready to start right away.'
                              />
                            </FormGroup>
                          </div>

                          <strong>Budgets and date targets suggestion</strong>

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

                            <div className='flex-grow flex flex-col gap-1 mt-2'>
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

                          <strong className='mt-2'>Ways to contact you</strong>

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
                            <TextField
                              label='Your LinkedIn handle'
                              placeholder='(optional)'
                              variant='outlined'
                              className='w-full max-w-[300px]'
                              InputProps={{ startAdornment: <>@ </> }}
                            />
                          </div>

                          <strong className='mt-2'>Anything else?</strong>

                          <TextField
                            label='Add a comment or additional info'
                            placeholder='Add any details you find important or a comment. This will be publicly visible.'
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
                    icon={
                      <>
                        {commentsLoadingAnim && <CircularProgress size='18px' className='ml-2' />}
                      </>
                    }
                    label={`${commentsAmountTotal} ${
                      commentsAmountTotal === 1 ? ' comment' : ' comments'
                    }`}
                    color='secondary'
                  />
                  <Chip
                    variant='outlined'
                    label={paymentPlanBrowseTag(request.paymentPlan)}
                    color='primary'
                  />
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
        { name: TAG_NAMES.protocolName, values: [PROTOCOL_NAME_TEST] },
        { name: TAG_NAMES.protocolVersion, values: [PROTOCOL_VERSION_TEST] },
        { name: TAG_NAMES.operationName, values: ['Request-Solution'] },
      ],
      first: 10,
    },
    context: {
      clientName: 'irys',
    },
    notifyOnNetworkStatusChange: true,
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

        {!isLoading && <MakeRequestBanner smallScreen={isSmallScreen} />}

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
