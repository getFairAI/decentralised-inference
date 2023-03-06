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
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useLocation, useParams } from 'react-router-dom';
import useArweave, { getActiveAddress, getData } from '@/context/arweave';
import { useLazyQuery } from '@apollo/client';
import { ChangeEvent, useEffect, useState } from 'react';
import {
  APP_VERSION,
  DEFAULT_TAGS,
  DEV_BUNDLR_URL,
  MODEL_INFERENCE_REQUEST_TAG,
  MODEL_INFERENCE_RESULT_TAG,
} from '@/constants';
import { QUERY_CHAT_HISTORY } from '@/queries/graphql';
import { IEdge } from '@/interfaces/arweave';
import Transaction from 'arweave/node/lib/transaction';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import _ from 'lodash';
import { useSnackbar } from 'notistack';
import { WebBundlr } from 'bundlr-custom';

interface Message {
  msg: string;
  type: 'response' | 'request';
  timestamp: number;
  txidModel: string;
}

const Chat = () => {
  const { txid:txidModel, address } = useParams();
  const { state } = useLocation();
  const [userAddr, setUserAddr] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [pendingTxs] = useState<Transaction[]>([]);
  const [conversationIds, setConversationIds] = useState<string[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>('C-1');

  const { enqueueSnackbar } = useSnackbar();
  const { arweave } = useArweave();

  const [getConversationHistory, { data, loading, previousData }] =
    useLazyQuery(QUERY_CHAT_HISTORY);

  useEffect(() => {
    const reqAddr = async () => setUserAddr(await getActiveAddress());

    reqAddr();
  }, []); // run only once

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
        { name: 'Conversation-Identifier', values: [currentConversationId] },
      ];
      const tagsResults = [
        ...commonTags,
        MODEL_INFERENCE_RESULT_TAG,
        { name: 'Conversation-Identifier', values: [currentConversationId] },
      ];
      getConversationHistory({
        variables: {
          tagsRequests,
          tagsResults,
          address: userAddr,
        },
        pollInterval: 5000,
      });
    }
  }, [txidModel, userAddr]);

  const reqData = async (argData: { results: IEdge[]; requests: IEdge[] }) => {
    const allData = [...argData.results, ...argData.requests];
    const cids = [
      ...new Set(
        allData.map(
          (x: IEdge) => x.node.tags.find((tag) => tag.name === 'Conversation-Identifier')?.value,
        ),
      ),
    ].filter((el) => el !== undefined) as string[];
    setConversationIds(
      cids.length > 0
        ? cids
        : conversationIds.length > 0
        ? conversationIds
        : [currentConversationId],
    );
    allData.sort((a: IEdge, b: IEdge) => {
      if (!a.node.block?.timestamp) return 1;
      if (!b.node.block?.timestamp) return -1;
      return new Date(a.node.block.timestamp) < new Date(b.node.block.timestamp) ? 1 : -1;
    });
    const temp: Message[] = [];
    await Promise.all(
      allData.map(async (el: IEdge) =>
        el.node.owner.address === userAddr
          ? temp.push({
              msg: (await getData(el.node.id)) as string,
              type: 'request',
              timestamp: el.node.block?.timestamp || 0,
              txidModel: el.node.id,
            })
          : temp.push({
              msg: (await getData(el.node.id)) as string,
              type: 'response',
              timestamp: el.node.block?.timestamp || 0,
              txidModel: el.node.id,
            }),
      ),
    );
    setMessages(temp);
  };

  useEffect(() => {
    if ((data && !previousData) || (data && previousData && !_.isEqual(data, previousData))) {
      reqData(data);
    }
  }, [data]);

  useEffect(() => {
    const commonTags = [
      ...DEFAULT_TAGS,
      { name: 'Model-Name', values: [state.modelName] },
      { name: 'Model-Creator', values: [state.modelCreator] },
    ];
    const tagsRequests = [
      ...commonTags,
      MODEL_INFERENCE_REQUEST_TAG,
      { name: 'Conversation-Identifier', values: [currentConversationId] },
    ];
    const tagsResults = [
      ...commonTags,
      MODEL_INFERENCE_RESULT_TAG,
      { name: 'Conversation-Identifier', values: [currentConversationId] },
    ];
    getConversationHistory({
      variables: { tagsRequests, tagsResults, address },
      pollInterval: 5000,
    });
  }, [currentConversationId]);

  const handleMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewMessage(event.target.value);
  };

  const handleSend = async () => {
    const bundlr = new WebBundlr(DEV_BUNDLR_URL, 'arweave', window.arweaveWallet);
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
    const tx = await arweave.createTransaction({
      target: address,
      quantity: state.fee,
    });

    tx.addTag('App-Name', 'Fair Protocol');
    tx.addTag('App-Version', APP_VERSION);
    tx.addTag('Operation-Name', 'Inference Payment');
    tx.addTag('Model-Name', state.modelName);
    tx.addTag('Model-Creator', state.modelCreator);
    tx.addTag('Conversation-Identifier', currentConversationId);

    await arweave.transactions.sign(tx);
    const res = await arweave.transactions.post(tx);
    if (res.status === 200) {
      enqueueSnackbar(
        `Paid Operator Fee ${arweave.ar.winstonToAr(state.fee)} AR, TxId: https://arweave.net/${
          tx.id
        }`,
        { variant: 'success' },
      );
    } else {
      enqueueSnackbar(res.statusText, { variant: 'error' });
    }

    const tags = [];
    tags.push({ name: 'App-Name', value: 'Fair Protocol' });
    tags.push({ name: 'App-Version', value: APP_VERSION });
    tags.push({ name: 'Model-Name', value: state.modelName });
    tags.push({ name: 'Model-Creator', value: state.modelCreator });
    tags.push({ name: 'Operation-Name', value: 'Model Inference Request' });
    tags.push({ name: 'Conversation-Identifier', value: currentConversationId });
    try {
      const bundlrRes = await bundlr.upload(newMessage, { tags });

      const temp = [...messages];
      temp.push({
        msg: newMessage,
        type: 'request',
        timestamp: bundlrRes.timestamp || 0,
        txidModel: bundlrRes.id,
      });
      setMessages(temp);
      setNewMessage('');
      enqueueSnackbar(`Inference Request, TxId: https://arweave.net/${bundlrRes.id}`, {
        variant: 'success',
      });
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
            {loading || !data ? (
              <p>Loading...</p>
            ) : messages.length > 0 ? (
              <Divider textAlign='center'>
                {new Date(messages[0].timestamp * 1000).toLocaleDateString()}
              </Divider>
            ) : (
              <p>You Are Starting a conversation</p>
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
                      {!!pendingTxs.find((pending) => el.txidModel === pending.id) && (
                        <Tooltip
                          title='This transaction is still not ocnfirmed by the network'
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
                      {el.timestamp === 0
                        ? 'pending'
                        : new Date(el.timestamp * 1000).toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Stack>
                {index < messages.length - 1 &&
                  new Date(
                    el.timestamp !== 0 ? el.timestamp * 1000 : new Date().getTime(),
                  ).getDay() !==
                    new Date(
                      messages[index + 1].timestamp !== 0
                        ? messages[index + 1].timestamp * 1000
                        : new Date().getTime(),
                    ).getDay() && (
                    <Divider textAlign='center'>
                      {new Date(
                        messages[index + 1].timestamp !== 0
                          ? messages[index + 1].timestamp * 1000
                          : new Date().getTime(),
                      ).toLocaleDateString()}
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
