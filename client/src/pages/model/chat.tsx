import {
  Box,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useLazyQuery } from '@apollo/client';
import { ChangeEvent, useContext, useEffect, useState } from 'react';
import {
  APP_VERSION,
  DEFAULT_TAGS,
  NODE1_BUNDLR_URL,
  MODEL_INFERENCE_REQUEST_TAG,
  MODEL_INFERENCE_RESULT_TAG,
  INFERENCE_PERCENTAGE_FEE,
} from '@/constants';
import { QUERY_CHAT_REQUESTS, QUERY_CHAT_RESPONSES } from '@/queries/graphql';
import { IEdge, ITag } from '@/interfaces/arweave';
import Transaction from 'arweave/node/lib/transaction';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import _ from 'lodash';
import { useSnackbar } from 'notistack';
import { WebBundlr } from 'bundlr-custom';
import { WalletContext } from '@/context/wallet';
import usePrevious from '@/hooks/usePrevious';
import arweave, { getData } from '@/utils/arweave';
import { genLoadingArray } from '@/utils/common';

interface Message {
  id: string;
  msg: string;
  type: 'response' | 'request';
  timestamp: number;
  cid?: string;
}

const Chat = () => {
  const { txid: txidModel, address } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { currentAddress: userAddr } = useContext(WalletContext);
  const previousAddr = usePrevious<string>(userAddr);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [pendingTxs] = useState<Transaction[]>([]);
  const [conversationIds, setConversationIds] = useState<string[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>('C-1');
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const mockArray = genLoadingArray(5);

  const { enqueueSnackbar } = useSnackbar();

  const [getChatRequests, { data: requestsData }] = useLazyQuery(QUERY_CHAT_REQUESTS);
  const [getChatResponses, { data: responsesData, previousData: responsesPreviousData }] =
    useLazyQuery(QUERY_CHAT_RESPONSES);

  useEffect(() => {
    if (previousAddr && previousAddr !== userAddr) {
      navigate(0);
    }
  }, [userAddr]);

  useEffect(() => {
    if (txidModel && userAddr) {
      const commonTags = [
        ...DEFAULT_TAGS,
        { name: 'Model-Name', values: [state.modelName] },
        { name: 'Model-Creator', values: [state.modelCreator] },
      ];
      const tagsRequests = [
        ...commonTags,
        MODEL_INFERENCE_REQUEST_TAG,
        // { name: 'Conversation-Identifier', values: [currentConversationId] },
      ];
      getChatRequests({
        variables: {
          tagsRequests,
          address: userAddr,
        },
        pollInterval: 5000,
      });
      setMessagesLoading(true);
    }
  }, []); // run only first time

  useEffect(() => {
    setMessages(allMessages.filter((el) => el.cid === currentConversationId));
  }, [currentConversationId]);

  useEffect(() => {
    if (requestsData) {
      const commonTags = [
        ...DEFAULT_TAGS,
        { name: 'Model-Name', values: [state.modelName] },
        { name: 'Model-Creator', values: [state.modelCreator] },
      ];
      const tagsResponses = [
        ...commonTags,
        MODEL_INFERENCE_RESULT_TAG,
        // { name: 'Conversation-Identifier', values: [currentConversationId] },
        { name: 'Model-User', values: [userAddr] },
        { name: 'Request-Transaction', values: requestsData.map((el: IEdge) => el.node.id) },
      ];
      const owners = Array.from(
        new Set(
          requestsData.map(
            (el: IEdge) => el.node.tags.find((el) => el.name === 'Model-Operator')?.value,
          ),
        ),
      );

      getChatResponses({
        variables: {
          tagsResponses,
          owners,
        },
      });
    }
  }, [requestsData]);

  const reqData = async () => {
    const allData = [...requestsData, ...responsesData];

    const temp: Message[] = [];
    await Promise.all(
      allData.map(async (el: IEdge) => {
        const msgIdx = messages.findIndex((msg) => msg.id === el.node.id);
        const data = msgIdx < 0 ? await getData(el.node.id) : messages[msgIdx].msg;
        const timestamp =
          parseInt(el.node.tags.find((el: ITag) => el.name === 'Unix-Time')?.value || '') ||
          el.node.block?.timestamp ||
          Date.now() / 1000;
        const cid = el.node.tags.find((el) => el.name === 'Conversation-Identifier')?.value;
        if (el.node.owner.address === userAddr) {
          temp.push({
            id: el.node.id,
            msg: data,
            type: 'request',
            timestamp: timestamp,
            cid,
          });
        } else {
          temp.push({
            id: el.node.id,
            msg: data,
            type: 'response',
            timestamp: timestamp,
            cid,
          });
        }
      }),
    );

    temp.sort(function (a, b) {
      return a.timestamp - b.timestamp;
    });
    setAllMessages(temp);

    const cids = [...new Set(temp.map((x: Message) => x.cid))].filter(
      (el) => el !== undefined,
    ) as string[];

    setConversationIds(
      cids.length > 0
        ? cids
        : conversationIds.length > 0
        ? conversationIds
        : [currentConversationId],
    );

    setMessages(temp.filter((el) => el.cid === currentConversationId));
    setMessagesLoading(false);
  };

  useEffect(() => {
    if (responsesData !== undefined && !_.isEqual(responsesData, responsesPreviousData)) {
      reqData();
    }
  }, [responsesData]);

  const handleMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewMessage(event.target.value);
  };

  const handleSend = async () => {
    const bundlr = new WebBundlr(NODE1_BUNDLR_URL, 'arweave', window.arweaveWallet);
    await bundlr.ready();
    const atomicBalance = await bundlr.getLoadedBalance();

    // Convert balance to an easier to read format
    const convertedBalance = bundlr.utils.unitConverter(atomicBalance).toNumber();
    const dataSize = new TextEncoder().encode(newMessage).length;
    const dataPrice = (await bundlr.getPrice(dataSize)).toNumber();
    if (dataPrice < convertedBalance) {
      // bundlr does not have enough funds
      enqueueSnackbar('Bundlr Node does not have enough funds for upload', { variant: 'error' });
      return;
    }
    const tags = [];
    tags.push({ name: 'App-Name', value: 'Fair Protocol' });
    tags.push({ name: 'App-Version', value: APP_VERSION });
    tags.push({ name: 'Model-Name', value: state.modelName });
    tags.push({ name: 'Model-Creator', value: state.modelCreator });
    tags.push({ name: 'Model-Transaction', value: state.modelTransaction });
    tags.push({ name: 'Model-Operator', value: address });
    tags.push({ name: 'Operation-Name', value: 'Model Inference Request' });
    tags.push({ name: 'Conversation-Identifier', value: currentConversationId });
    tags.push({ name: 'Unix-Time', value: (Date.now() / 1000).toString() });
    try {
      const bundlrRes = await bundlr.upload(newMessage, { tags });

      const temp = [...messages];
      temp.push({
        msg: newMessage,
        type: 'request',
        timestamp: bundlrRes.timestamp || 0,
        id: bundlrRes.id,
      });
      setMessages(temp);
      setNewMessage('');
      enqueueSnackbar(`Inference Request, TxId: https://arweave.net/${bundlrRes.id}`, {
        variant: 'success',
      });

      const inferenceFee = (
        parseFloat(state.fee) +
        parseFloat(state.fee) * INFERENCE_PERCENTAGE_FEE
      ).toString();

      const tx = await arweave.createTransaction({
        target: address,
        quantity: inferenceFee,
      });

      tx.addTag('App-Name', 'Fair Protocol');
      tx.addTag('App-Version', APP_VERSION);
      tx.addTag('Operation-Name', 'Inference Payment');
      tx.addTag('Model-Name', state.modelName);
      tx.addTag('Model-Creator', state.modelCreator);
      tx.addTag('Model-Transaction', state.modelTransaction);
      tx.addTag('Model-Operator', address || '');
      tx.addTag('Conversation-Identifier', currentConversationId);
      tx.addTag('Inference-Transaction', bundlrRes.id);
      tx.addTag('Unix-Time', (Date.now() / 1000).toString());

      await arweave.transactions.sign(tx);
      const res = await arweave.transactions.post(tx);
      if (res.status === 200) {
        enqueueSnackbar(
          `Paid Operator Fee ${arweave.ar.winstonToAr(
            inferenceFee,
          )} AR, TxId: https://arweave.net/${tx.id}`,
          { variant: 'success' },
        );
      } else {
        enqueueSnackbar(res.statusText, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar(JSON.stringify(error), { variant: 'error' });
    }
  };

  const handleListItemClick = (cid: string) => {
    setCurrentConversationId(cid);
  };

  const handleAddConversation = () => {
    const lastConversation = conversationIds[conversationIds.length - 1];
    const number = lastConversation?.split('-')[1];
    const newConversationId = `C-${+number + 1}`;
    setConversationIds([...conversationIds, newConversationId]);
    setCurrentConversationId(newConversationId);
  };

  return (
    <Grid container spacing={0} sx={{ height: '100%' }}>
      <Grid
        item
        xs
        sx={{
          width: '100%',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <Paper
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            height: '100%',
          }}
          elevation={4}
        >
          <Box marginTop={'72px'} display='flex'>
            <TextField
              placeholder='Search...'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title='Start a new Conversation'>
              <IconButton onClick={handleAddConversation}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <List>
            {conversationIds.map((cid, idx) => (
              <ListItemButton
                key={idx}
                alignItems='flex-start'
                selected={cid === currentConversationId}
                onClick={() => handleListItemClick(cid)}
              >
                <ListItemText primary={cid} />
              </ListItemButton>
            ))}
          </List>
          <Box flexGrow={1}></Box>
        </Paper>
      </Grid>
      <Grid
        item
        xs={10}
        sx={{
          width: '100%',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <Box flexGrow={1}>
          <Paper
            elevation={1}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              height: '100%',
            }}
          >
            {messagesLoading ? (
              mockArray.map((el: number) => {
                return (
                  <Container key={el}>
                    <Stack
                      spacing={4}
                      flexDirection='row'
                      justifyContent={el % 2 === 0 ? 'flex-end' : 'flex-start'}
                    >
                      <Skeleton animation={'wave'} width={'40%'}>
                        <Box
                          display={'flex'}
                          justifyContent={el % 2 === 0 ? 'flex-end' : 'flex-start'}
                          flexDirection='column'
                          margin='8px'
                        >
                          <Box display={'flex'} alignItems='center'>
                            <Card
                              elevation={8}
                              raised={true}
                              sx={{ width: 'fit-content', paddingBottom: 0 }}
                            >
                              <CardContent>
                                <Typography></Typography>
                              </CardContent>
                            </Card>
                          </Box>
                        </Box>
                      </Skeleton>
                    </Stack>
                  </Container>
                );
              })
            ) : messages.length > 0 ? (
              <Divider textAlign='center'>
                {new Date(messages[0].timestamp * 1000).toLocaleDateString()}
              </Divider>
            ) : (
              <Typography alignItems='center' display='flex' flexDirection='column'>
                Could not Fetch Conversation History.
              </Typography>
            )}
            {messages.map((el: Message, index: number) => (
              <Container key={index}>
                <Stack
                  spacing={4}
                  flexDirection='row'
                  justifyContent={el.type === 'request' ? 'flex-end' : 'flex-start'}
                >
                  <Box
                    display={'flex'}
                    justifyContent={el.type === 'request' ? 'flex -end' : 'flex-start'}
                    flexDirection='column'
                    margin='8px'
                  >
                    <Box display={'flex'} alignItems='center'>
                      {!!pendingTxs.find((pending) => el.id === pending.id) && (
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
                        sx={{ width: 'fit-content', paddingBottom: 0 }}
                      >
                        <CardContent>
                          <Typography>{el.msg}</Typography>
                        </CardContent>
                      </Card>
                    </Box>

                    <Typography
                      variant='caption'
                      textAlign={el.type === 'request' ? 'right' : 'left'}
                    >
                      {new Date(el.timestamp * 1000).toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Stack>
                {index < messages.length - 1 &&
                  new Date(el.timestamp * 1000).getDay() !==
                    new Date(messages[index + 1].timestamp * 1000).getDay() && (
                    <Divider textAlign='center'>
                      {new Date(messages[index + 1].timestamp * 1000).toLocaleDateString()}
                    </Divider>
                  )}
              </Container>
            ))}
          </Paper>
        </Box>
        <TextField
          variant='outlined'
          value={newMessage}
          onChange={handleMessageChange}
          fullWidth
          InputProps={{
            endAdornment: (
              <IconButton onClick={handleSend}>
                <SendIcon />
              </IconButton>
            ),
          }}
        />
      </Grid>
    </Grid>
  );
};

export default Chat;
