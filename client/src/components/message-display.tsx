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
  Button,
  Box,
} from '@mui/material';
import { useCallback, useContext, useEffect, useState } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import '@/styles/main.css';
import { EthEncryptedData } from '@metamask/eth-sig-util';
import { LockOutlined } from '@mui/icons-material';
import { EVMWalletContext } from '@/context/evm-wallet';

const MessageDisplay = ({ message, forDetails }: { message: IMessage; forDetails?: boolean }) => {
  const theme = useTheme();
  const { decrypt } = useContext(EVMWalletContext);
  const [content, setContent] = useState<string | File | EthEncryptedData>('');
  const [type, setType] = useState<string>('');

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
      try {
        const data = JSON.parse(message.msg as string);
        if (data['ciphertext'] && data['ephemPublicKey'] && data['nonce'] && data['version']) {
          setContent(data as EthEncryptedData);
          setType('encrypted');
        } else {
          setContent(JSON.stringify(data, null, 2));
          setType('text');
        }
      } catch (err) {
        setContent((message.msg as string).trim());
        setType('text');
      }
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
  }, [message]);

  const handleDecrypt = useCallback(async () => {
    if (message?.msg && type === 'encrypted') {
      const decrypted = await decrypt(message.msg as `0x${string}`);
      try {
        atob(decrypted);
        setContent(`data:image/png;base64,${decrypted}`);
        setType('image');
      } catch (err) {   
        setContent(decrypted || 'Failed to decrypt');
        setType('text');
      }
    }
  }, [ message, type ]);

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
          component='img'
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
          fontSize: message.type === 'request' ? '25px' : '18px',
          lineHeight: message.type === 'request' ? '34px' : '25px',
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'pre-wrap',
          textAlign: message.type === 'request' ? 'right' : 'left',
        }}
        gutterBottom
        component={'pre'}
      >
        {content as string}
      </Typography>
    );
  } else if (type === 'encrypted') {
    return (<Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    }}>
      <Typography
        sx={{
          fontStyle: 'normal',
          fontWeight: 400,
          fontSize: '25px',
          lineHeight: '34px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
        gutterBottom
      >
        <LockOutlined />
        {'This content is encrypted.'}
      </Typography>
      <Button variant='outlined' onClick={handleDecrypt}>
        Decrypt
      </Button>
    </Box>);
  } else {
    return (
      <FormControl variant='outlined' fullWidth>
        <TextField
          value={(content as File).name || 'Not Available'}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <IconButton
                  aria-label='download'
                  onClick={handleDownload}
                  className='plausible-event-name=Message+Detail+Download+Click'
                >
                  <DownloadIcon />
                </IconButton>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position='start'>{printSize(content as File)}</InputAdornment>
            ),
            sx: {
              background: theme.palette.background.default,
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '20px',
              lineHeight: '16px',
              width: '100%',
              marginTop: '10px',
              borderRadius: '8px',
            },
            readOnly: true,
          }}
        />
      </FormControl>
    );
  }
};

export default MessageDisplay;
