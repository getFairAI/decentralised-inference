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
  Stack,
  Box,
  Tooltip,
  Card,
  CardContent,
  useTheme,
  Button,
  Avatar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { IMessage } from '@/interfaces/common';
import Transaction from 'arweave/node/lib/transaction';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import MessageFooter from './message-footer';
import MessageDisplay from './message-display';
import { TradeContext } from '@/context/trade';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toSvg } from 'jdenticon';
import { useLazyQuery } from '@apollo/client';
import {
  AVATAR_ATTACHMENT,
  DEFAULT_TAGS,
  IRYS_TXS_EXPLORER,
  MODEL_ATTACHMENT,
  NET_ARWEAVE_URL,
  RAREWEAVE_ASSET_LIST_LINK,
  TAG_NAMES,
  WARP_ASSETS_EXPLORER,
} from '@/constants';
import { GET_LATEST_MODEL_ATTACHMENTS } from '@/queries/graphql';
import { enqueueSnackbar } from 'notistack';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { findTag } from '@/utils/common';
import MessageDetail from './message-detail';
import FairSDKWeb from 'fair-protocol-sdk/web';

const MessageHeader = ({ message }: { message: IMessage }) => {
  const { state } = useLocation();
  const theme = useTheme();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    },
    [setAnchorEl],
  );

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, [setAnchorEl]);

  const handleCopy = useCallback(async () => {
    setAnchorEl(null);
    try {
      if (typeof message.msg === 'string') {
        await navigator.clipboard.writeText(message.msg);
        enqueueSnackbar('Copied to clipboard', { variant: 'info' });
      } else {
        await navigator.clipboard.write([
          new ClipboardItem({
            [message.contentType as string]: message.msg,
          }),
        ]);
        enqueueSnackbar('Copied to clipboard', { variant: 'info' });
        // copy file
      }
    } catch (error) {
      enqueueSnackbar('Cannot copy this message', { variant: 'error' });
    }
  }, [message, navigator, enqueueSnackbar, setAnchorEl]);

  const handleViewTx = useCallback(() => {
    setAnchorEl(null);
    if (message.tags.find((tag) => tag.name === TAG_NAMES.contractSrc)?.value !== undefined) {
      window.open(`${WARP_ASSETS_EXPLORER}/${message.id}`, '_blank');
    } else {
      window.open(`${IRYS_TXS_EXPLORER}/${message.id}`, '_blank');
    }
  }, [message, window, setAnchorEl]);

  const handleViewDetails = useCallback(() => {
    setAnchorEl(null);
    setDialogOpen(true);
  }, [setAnchorEl, setDialogOpen]);

  const [getAvatar, { data: avatarData }] = useLazyQuery(GET_LATEST_MODEL_ATTACHMENTS);

  const { setOpenWithId } = useContext(TradeContext);

  const imgUrl = useMemo(() => {
    const avatarTxId = avatarData?.transactions?.edges[0]?.node?.id;
    if (avatarTxId) {
      return `${NET_ARWEAVE_URL}/${avatarTxId}`;
    } else {
      const imgSize = 100;
      const scriptId = state?.scriptTransaction;
      const img = toSvg(scriptId, imgSize);
      const svg = new Blob([img], { type: 'image/svg+xml' });
      return URL.createObjectURL(svg);
    }
  }, [avatarData, state]);

  useEffect(() => {
    (async () => {
      const currentScriptTx = state?.scriptTransaction;
      let firstScriptVersionTx;
      try {
        firstScriptVersionTx = (
          JSON.parse(findTag(state?.fullState, 'previousVersions') as string) as string[]
        )[0];
      } catch (err) {
        firstScriptVersionTx = state?.scriptTransaction;
      }
      const attachmentAvatarTags = [
        ...DEFAULT_TAGS, // filter from previous app versions as well
        { name: TAG_NAMES.operationName, values: [MODEL_ATTACHMENT] },
        { name: TAG_NAMES.attachmentRole, values: [AVATAR_ATTACHMENT] },
        { name: TAG_NAMES.scriptTransaction, values: [firstScriptVersionTx, currentScriptTx] },
      ];

      await getAvatar({
        variables: {
          tags: attachmentAvatarTags,
          owner: state?.scriptCurator,
        },
      });
    })();
  }, [state]);

  const handleBazarTradeClick = useCallback(() => setOpenWithId(message.id, true), [message]);
  const handleRareweaveTradeClick = useCallback(
    () => window.open(`${RAREWEAVE_ASSET_LIST_LINK}/${message.id}`, '_blank'),
    [message],
  );

  const showTradeOnBazar = useMemo(
    () =>
      message.type === 'response' &&
      message.tags.find((tag) => tag.name === FairSDKWeb.utils.TAG_NAMES.contractSrc)?.value ===
        FairSDKWeb.utils.ATOMIC_ASSET_CONTRACT_SOURCE_ID,
    [message],
  );
  const showTradeOnRareweave = useMemo(
    () =>
      message.type === 'response' &&
      message.tags.find((tag) => tag.name === FairSDKWeb.utils.TAG_NAMES.contractSrc)?.value ===
        FairSDKWeb.utils.RAREWEAVE_CONTRACT_ID,
    [message],
  );
  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    if (message.msg instanceof File) {
      a.href = URL.createObjectURL(message.msg as File);
      a.download = `${message.id}.${message.contentType?.split('/')[1]}`;
    } else {
      const file = new Blob([message.msg], { type: 'text/plain' });
      a.href = URL.createObjectURL(file);
      a.download = `${message.id}.txt`;
    }

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [message]);

  return (
    <Box display={'flex'} gap={'8px'} width={'100%'}>
      {message.type === 'response' && (
        <Avatar variant='rounded' src={imgUrl} sx={{ width: 56, height: 56 }} />
      )}
      <Box display={'flex'} justifyContent={'space-between'} width={'100%'}>
        {message.type === 'response' && (
          <Box display={'flex'} flexDirection={'column'}>
            <Typography
              sx={{
                fontSize: '20px',
                fontWeight: 400,
              }}
            >
              {state.scriptName}
            </Typography>
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 300,
                color: theme.palette.neutral.main,
              }}
            >
              {state.scriptTransaction}
            </Typography>
          </Box>
        )}
        <Box display={'flex'} alignItems='center' gap={'8px'}>
          {showTradeOnBazar && (
            <Button variant='outlined' onClick={handleBazarTradeClick}>
              Trade on Bazar
            </Button>
          )}
          {showTradeOnRareweave && (
            <Button variant='outlined' onClick={handleRareweaveTradeClick}>
              Trade on Rareweave
            </Button>
          )}
          {message.type === 'response' && (
            <IconButton onClick={handleDownload} sx={{ padding: '8px 0px' }} disableRipple>
              <FileDownloadOutlinedIcon fontSize='large' />
            </IconButton>
          )}
          <IconButton onClick={handleClick} sx={{ padding: '8px 0px' }} disableRipple>
            <MoreHorizIcon fontSize='large' />
          </IconButton>
          <Menu
            id='demo-positioned-menu'
            aria-labelledby='demo-positioned-button'
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <MenuItem onClick={handleCopy}>Copy Content</MenuItem>
            <MenuItem onClick={handleViewTx}>View Transaction</MenuItem>
            <MenuItem onClick={handleViewDetails}>View Details</MenuItem>
          </Menu>
        </Box>
        <MessageDetail open={dialogOpen} setOpen={setDialogOpen} message={message} />
      </Box>
    </Box>
  );
};

const Message = ({
  message,
  index,
  pendingTxs,
}: {
  message: IMessage;
  index: number;
  pendingTxs: Transaction[];
}) => {
  const theme = useTheme();

  return (
    <Stack spacing={4} flexDirection='row'>
      <Box display={'flex'} flexDirection='column' margin='8px' width='100%'>
        <Box
          display={'flex'}
          alignItems='center'
          justifyContent={message.type === 'response' ? 'flex-start' : 'flex-end'}
        >
          {!!pendingTxs.find((pending) => message.id === pending.id) && (
            <Tooltip
              title='This transaction is still not confirmed by the network'
              sx={{ margin: '8px' }}
            >
              <PendingActionsIcon />
            </Tooltip>
          )}
          <Card
            elevation={8}
            raised={true}
            sx={{
              width: '100%',
              maxWidth: '100%',
              border: '0.5px solid',
              borderColor: theme.palette.neutral.main,
              backgroundColor: '#F2F2F2',
              borderRadius: '8px',
            }}
          >
            <CardContent
              sx={{
                padding: '24px 32px',
                gap: '16px',
                display: 'flex',
                flexDirection: 'column',

                alignItems: message.type === 'response' ? 'center' : 'flex-end',
              }}
            >
              <MessageHeader message={message} />
              <MessageDisplay message={message} />
              <MessageFooter message={message} index={index} />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Stack>
  );
};

export default Message;
