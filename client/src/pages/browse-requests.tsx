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
  CardHeader,
  CardContent,
  Chip,
  Typography,
  CardActionArea,
  DialogTitle,
  IconButton,
  DialogContent,
  Divider,
  Modal,
  Paper,
  TextField,
  Fab,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import SendIcon from '@mui/icons-material/Send';
import { ChangeEvent, useCallback, useContext, useEffect, useState } from 'react';
import { EVMWalletContext } from '@/context/evm-wallet';
import { postOnArweave } from '@fairai/evm-sdk';

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

const CommentElement = ({ comment }: { comment: Comment }) => {
  const handleAddressClick = useCallback(() => {
    window.open(`https://arbiscan.io/address/${comment.owner}`, '_blank');
  }, [comment]);

  return (
    <Box key={comment.timestamp} display={'flex'} flexDirection={'column'} gap={'8px'}>
      <Typography variant='caption'>
        {'By '}
        <a style={{ cursor: 'pointer' }} onClick={handleAddressClick}>
          <u>
            {comment.owner.slice(0, 6)}...{comment.owner.slice(-4)}
          </u>
        </a>
        {` on ${new Date(Number(comment.timestamp) * 1000).toLocaleString()}`}
      </Typography>
      <Typography>{comment.content}</Typography>
    </Box>
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
      <Modal open={open}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Paper>
            <Box>
              <DialogTitle
                display='flex'
                justifyContent={'flex-end'}
                alignItems='flex-start'
                lineHeight={0}
              >
                <Box display={'flex'} flexDirection={'column'} width={'100%'}>
                  <Typography fontWeight={600}>{request.title}</Typography>
                  <Typography variant='caption'>
                    {`Created ${new Date(Number(request.timestamp) * 1000).toLocaleString()} By `}
                    <a style={{ cursor: 'pointer' }} onClick={handleAddressClick}>
                      <u>
                        {request.owner.slice(0, 6)}...{request.owner.slice(-4)}
                      </u>
                    </a>
                  </Typography>
                </Box>

                <IconButton
                  onClick={handleClose}
                  size='small'
                  sx={{
                    borderRadius: '10px',
                  }}
                  className='plausible-event-name=Close+Model+Click'
                >
                  <Close />
                </IconButton>
              </DialogTitle>
              <DialogContent>
                <Box display={'flex'} flexDirection={'column'} gap={'16px'}>
                  <Typography component={'pre'}>{request.description}</Typography>
                  <Box display={'flex'} justifyContent={'flex-end'} gap={'8px'}>
                    {request.keywords.map((keyword) => (
                      <Chip key={keyword} label={keyword} variant='outlined' />
                    ))}
                  </Box>
                  <Divider textAlign='left'>
                    <Typography>{'Comments'}</Typography>
                  </Divider>
                  {comments.length === 0 && (
                    <Typography width={'100%'} display={'flex'} justifyContent={'center'}>
                      {'No Comments Yet'}
                    </Typography>
                  )}
                  {comments.map((comment) => (
                    <CommentElement key={comment.timestamp} comment={comment} />
                  ))}
                </Box>
              </DialogContent>
            </Box>
          </Paper>
          {currentAddress && (
            <Paper sx={{ width: '100%', padding: '8px 16px 8px 32px' }}>
              <TextField
                placeholder='New Comment'
                variant='standard'
                fullWidth
                value={newComment}
                onChange={handleCommentChange}
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
                      <SendIcon />
                    </DebounceIconButton>
                  ),
                }}
              />
            </Paper>
          )}
        </Box>
      </Modal>
      <Grid xs={12} md={6} lg={4} key={request.id} sx={{ display: 'flex', alignItems: 'center' }}>
        <Card raised={true}>
          <CardActionArea onClick={handleOpen}>
            <CardHeader title={request.title} />
            <CardContent>
              <Typography
                sx={{
                  WebkitLineClamp: 3,
                }}
              >
                {request.description}
              </Typography>
              <Box display={'flex'} justifyContent={'flex-end'} gap={'8px'}>
                {request.keywords.map((keyword) => (
                  <Chip key={keyword} label={keyword} variant='outlined' />
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
  const { data } = useQuery(irysQuery, {
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

  if (requests.length === 0) {
    return (
      <Box display={'flex'} justifyContent={'center'} alignItems={'center'} height={'20%'}>
        <Typography>{'No Requests Found'}</Typography>
      </Box>
    );
  }

  return (
    <Box margin={'16px'}>
      <Grid container spacing={8}>
        {requests.map((req) => (
          <RequestElement key={req.id} request={req} />
        ))}
        <Fab sx={{ /* widht: '20px', height: '20px', */ position: 'absolute', bottom: '30px', right: '30px' }}>
          <img src='./chevron-bottom.svg'/>
        </Fab>
      </Grid>
    </Box>
  );
};

export default BrowseRequests;
