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

import { Stack, Box, Tooltip, Card, CardContent, useTheme } from '@mui/material';
import { IMessage } from '@/interfaces/common';
import Transaction from 'arweave/node/lib/transaction';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import MessageFooter from './message-footer';
import MessageDisplay from './message-display';

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
              width: 'fit-content',
              maxWidth: '75%',
              // background: message.type === 'response' ? 'rgba(96, 96, 96, 0.7);' : 'rgba(52, 52, 52, 0.7);',
              border: '4px solid transparent',
              background:
                message.type !== 'response'
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(204, 204, 204, 0.8)'
                    : theme.palette.terciary.main
                  : theme.palette.mode === 'dark'
                  ? 'rgba(52, 52, 52, 0.7)'
                  : theme.palette.secondary.main,
              // opacity: '0.4',
              borderRadius: '40px',
            }}
          >
            <CardContent
              sx={{
                padding: '24px 32px',
                gap: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.type === 'response' ? 'flex-start' : 'flex-end',
              }}
            >
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
