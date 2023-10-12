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
import {
  Typography,
  FormControl,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
  Card,
  CardMedia,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import '@/styles/main.css';

const MessageDisplay = ({ message, forDetails }: { message: IMessage; forDetails?: boolean }) => {
  const theme = useTheme();
  const [ content, setContent ] = useState<string | File>('');
  const [ type, setType ] = useState<string>('');

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = `${NET_ARWEAVE_URL}/${message.id}`;
    a.download = message.id;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [message]);

  useEffect(() => {
    if (message.contentType?.includes('text') || message.contentType?.includes('json')) {
      setContent(message.msg as string);
      setType('text');
    } else if (message.contentType?.includes('image')) {
      setContent(`${NET_ARWEAVE_URL}/${message.id}`);
      setType('image');
    } else if (message.contentType?.includes('audio')) {
      const fileUrl = URL.createObjectURL(message.msg as File);
      setContent(fileUrl);
      setType('audio');
    } else {
      setContent(message.msg as File);
      setType('file');
    }

    return () => {
      if (message.contentType?.includes('audio')) {
        URL.revokeObjectURL(content as string);
      }
    };
  }, [ message ]);

  if (type === 'image') {
    return (
      <Card
        sx={{
          boxShadow: 'none',
          backgroundColor: 'transparent',
          width: forDetails ? undefined : '512px',
          height: forDetails ? undefined : '512px',
        }}
      >
        <CardMedia
          component="img"
          image={content as string}
          title={content as string}
          sx={{ objectFit: 'contain', width: '100%', height: '100%' }}
        />
      </Card>
    );
  } else if (type === 'audio') {
    return <audio controls src={content as string}></audio>;
  } else if (type === 'text') {
    return (
      <Typography
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
          overflow: 'hidden' /* Ensures the content is not revealed until the animation */,
          animation: {
            typing: '3.5s steps(40, end)',
            blinkCaret: '.75s step-end infinite',
          },
        }}
        gutterBottom
        component={'pre'}
      >
        {content as string}
      </Typography>
    );
  } else {
    return (
      <FormControl variant='outlined' fullWidth>
        <TextField
          value={(content as File).name || 'Not Available'}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <IconButton aria-label='download' onClick={handleDownload}>
                  <DownloadIcon />
                </IconButton>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position='start'>{printSize(content as File)}</InputAdornment>
            ),
            sx: {
              borderWidth: '1px',
              borderColor: theme.palette.text.primary,
              borderRadius: '23px',
            },
            readOnly: true,
          }}
        />
      </FormControl>
    );
  }
};

export default MessageDisplay;
