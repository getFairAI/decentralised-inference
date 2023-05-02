import { Stack, Box, Tooltip, Card, CardContent, Typography, useTheme } from '@mui/material';
import { IMessage } from '@/interfaces/common';
import Transaction from 'arweave/node/lib/transaction';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import MessageFooter from './message-footer';

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
                }}
                gutterBottom
                component={'pre'}
              >
                {message.msg}
              </Typography>
              <MessageFooter message={message} index={index} />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Stack>
  );
};

export default Message;
