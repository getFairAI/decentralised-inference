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
import { Box, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useTimeInterval from '@/hooks/useTimeInterval';
import { secondInMS } from '@/constants';

const MessageFooter = ({ message, index }: { message: IMessage; index: number }) => {
  const { state } = useLocation();
  const min = 60;
  const time = useTimeInterval(secondInMS * min);

  useEffect(() => {
    // every time 1 min passes update time
    const elements = document.querySelectorAll('.timeLabel');
    const current = elements.item(index);
    if (!current) {
      return;
    }
    const newTimestamp = time / secondInMS;
    current.textContent = getTimePassed(message.timestamp, newTimestamp);
  }, [time]);

  const getTimePassed = (unixTimestamp: number, currentTime?: number) => {
    const timestampNow = currentTime ?? Date.now() / secondInMS;
    const secondsDiff = timestampNow - unixTimestamp;

    const hour = 60 * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = week * 4;
    const year = day * 365;

    if (secondsDiff < min) {
      return 'A Few Seconds Ago';
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
            }}
          >
            {getTimePassed(message.timestamp)}
          </Typography>
          <Typography
            sx={{
              display: 'flex',
              alignItems: 'center',
              margin: '8px',
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
            }}
          >
            {message.type === 'response' ? state.scriptName : 'You'}
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default MessageFooter;
