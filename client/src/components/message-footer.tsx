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
import { Box, Typography, IconButton, Menu, MenuItem, useTheme } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MessageDetail from './message-detail';

const MessageFooter = ({ message, index }: { message: IMessage; index: number }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();
  const { state } = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const updateMessageTime = (timer: NodeJS.Timer, unixTimestamp: number, index: number) => {
    const elements = document.querySelectorAll('.timeLabel');
    const current = elements.item(index);
    if (!current) {
      clearInterval(timer);
      return;
    }
    const newTimestamp = Date.now() / 1000;
    const newSecondsDiff = newTimestamp - unixTimestamp;
    if (newSecondsDiff < 60) {
      current.textContent = `${newSecondsDiff.toFixed(0)} Seconds Ago`;
    } else {
      current.textContent = '1 Minute Ago';
      clearInterval(timer);
    }
  };

  const getTimePassed = (unixTimestamp: number, index: number) => {
    const timestampNow = Date.now() / 1000;
    const secondsDiff = timestampNow - unixTimestamp;

    const min = 60;
    const hour = 60 * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = week * 4;
    const year = day * 365;

    if (secondsDiff < min) {
      const timer: NodeJS.Timer = setInterval(
        () => updateMessageTime(timer, unixTimestamp, index),
        5000,
      );
      return `${secondsDiff.toFixed(0)} Second(s) Ago`;
    } else if (secondsDiff < hour) {
      return `${(secondsDiff / min).toFixed(0)} Minute(s) Ago`;
    } else if (secondsDiff < day) {
      return `${(secondsDiff / hour).toFixed(0)} Hour(s) Ago`;
    } else if (secondsDiff < week) {
      return `${(secondsDiff / day).toFixed(0)} Day(s) Ago`;
    } else if (secondsDiff < month) {
      return `${(secondsDiff / week).toFixed(0)} Week(s) Ago`;
    } else if (secondsDiff < year) {
      return `${(secondsDiff / month).toFixed(0)} Month(s) Ago`;
    } else {
      return secondsDiff >= year && secondsDiff < 2 * year ? '1 Year Ago' : 'Over an Year Ago';
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCopy = async () => {
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
  };

  const handleViewTx = () => {
    setAnchorEl(null);
    window.open(`https://viewblock.io/arweave/tx/${message.id}`, '_blank');
  };

  const handleViewDetails = () => {
    setAnchorEl(null);
    setDialogOpen(true);
  };

  return (
    <>
      <Box
        display={'flex'}
        justifyContent={'space-between'}
        width={'100%'}
        flexDirection={message.type === 'response' ? 'row' : 'row-reverse'}
      >
        <Box display={'flex'}>
          <Typography
            className='timeLabel'
            sx={{
              fontStyle: 'normal',
              fontWeight: 300,
              fontSize: '20px',
              lineHeight: '27px',
              display: 'flex',
              alignItems: 'center',
              color:
                message.type === 'response'
                  ? theme.palette.secondary.contrastText
                  : theme.palette.terciary.contrastText,
            }}
          >
            {getTimePassed(message.timestamp, index)}
          </Typography>
          <Typography
            sx={{
              display: 'flex',
              alignItems: 'center',
              margin: '8px',
              color:
                message.type === 'response'
                  ? theme.palette.secondary.contrastText
                  : theme.palette.terciary.contrastText,
            }}
          >
            {' - '}
          </Typography>
          <Typography
            sx={{
              fontStyle: 'normal',
              fontWeight: 700,
              fontSize: '20px',
              lineHeight: '27px',
              display: 'flex',
              alignItems: 'center',
              color:
                message.type === 'response'
                  ? theme.palette.secondary.contrastText
                  : theme.palette.terciary.contrastText,
            }}
          >
            {message.type === 'response' ? state.scriptName : 'You'}
          </Typography>
        </Box>
        <Box display={'flex'} alignItems='center'>
          <IconButton
            sx={{
              color:
                message.type === 'response'
                  ? theme.palette.secondary.contrastText
                  : theme.palette.terciary.contrastText,
            }}
            onClick={handleClick}
          >
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
      </Box>
      <MessageDetail open={dialogOpen} setOpen={setDialogOpen} message={message} />
    </>
  );
};

export default MessageFooter;
