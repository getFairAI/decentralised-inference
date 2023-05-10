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

import { NET_ARWEAVE_URL } from '@/constants';
import { IMessage } from '@/interfaces/common';
import { printSize } from '@/utils/common';
import { Typography, FormControl, TextField, InputAdornment, IconButton, useTheme } from '@mui/material';
import { useCallback } from 'react';
import DownloadIcon from '@mui/icons-material/Download';

const MessageDisplay = ({ message }: { message: IMessage}) => {
  const theme = useTheme();

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = `${NET_ARWEAVE_URL}/${message.id}`;
    a.download = message.id;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [ message ]);

  if (message.contentType?.includes('image')) {
    return <img src={`${NET_ARWEAVE_URL}/${message.id}`}></img>;
  } else if (message.contentType?.includes('audio')) {
    return <audio controls src={`${NET_ARWEAVE_URL}/${message.id}`}></audio>;
  } else if (message.contentType?.includes('text') || message.contentType?.includes('json')) {
    return <Typography
      sx={{
        fontStyle: 'normal',
        fontWeight: 400,
        fontSize: '25px',
        lineHeight: '34px',
        display: 'flex',
        alignItems: 'center',
        color:
          message.type === 'response'
            ? theme.palette.secondary.contrastText
            : theme.palette.terciary.contrastText,
        whiteSpace: 'pre-wrap',
      }}
      gutterBottom
      component={'pre'}
    >
      {message.msg as string}
    </Typography>;
  } else {
    return <FormControl variant='outlined' fullWidth>
      <TextField
        value={(message.msg as File).name || 'Not Available'}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <IconButton aria-label='download' onClick={handleDownload}>
                <DownloadIcon />
              </IconButton>
            </InputAdornment>
          ),
          endAdornment: <InputAdornment position='start'>{printSize(message.msg as File)}</InputAdornment>,
          sx: {
            borderWidth: '1px',
            borderColor: theme.palette.text.primary,
            borderRadius: '23px',
          },
          readOnly: true,
        }}
      />
    </FormControl>;
  }
};

export default MessageDisplay;