import { Box, Card, CardActionArea, CardContent, Container, Divider, Grid, IconButton, List, ListItem, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import { Params, useParams } from "react-router-dom";
import useArweave, { getActiveAddress, getData } from "@/context/arweave";
import { useQuery } from "@apollo/client";
import { ChangeEvent, useEffect, useState } from "react";
import { DEFAULT_TAGS, MODEL_INFERENCE_REQUEST_TAG, MODEL_INFERENCE_RESULT_TAG } from "@/constants";
import { QUERY_CHAT_HISTORY } from "@/queries/graphql";
import { IEdge } from "@/interfaces/arweave";
import Transaction from "arweave/node/lib/transaction";
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { padding } from "@mui/system";

interface Message {
  msg: string,
  type: 'response' | 'request',
  timestamp: number,
  txid: string;
}

const Chat = () => {
  const { txid, address } = useParams();
  const [ userAddr, setUserAddr ] = useState<string | undefined>(undefined);
  const [ messages, setMessages ] = useState<Message[]>([]);
  const [ newMessage, setNewMessage ] = useState<string>('');
  const [ pendingTxs, setPendingTxs ] = useState<Transaction[]>([]);
  const { arweave } = useArweave();

  const commonTags = [
    ...DEFAULT_TAGS,
    {
      name: "Model-Transaction",
      values: [ txid ]
    },
  ];
  const tagsRequests = [
    ...commonTags,
    MODEL_INFERENCE_REQUEST_TAG,
  ];
  const tagsResults = [
    ...commonTags,
    MODEL_INFERENCE_RESULT_TAG
  ];

  const { data, loading, error } = useQuery(
    QUERY_CHAT_HISTORY,
    {
      variables: {
        tagsRequests,
        tagsResults,
        address: userAddr
      },
      skip: !txid || !userAddr
    }
  );

  useEffect(() => {
    const reqAddr = async () => setUserAddr(await getActiveAddress());

    reqAddr();
  }, []); // run only once

  useEffect(() => {
    const reqData = async () => {
      const allData = [ ...data.results, ...data.requests ];
      allData.sort((a: IEdge, b: IEdge) => {
        if (!a.node.block?.timestamp) return 1;
        if (!b.node.block?.timestamp) return -1;
        return new Date(a.node.block.timestamp) < new Date(b.node.block.timestamp) ? 1 : -1;
      })
      const temp: Message[] = [];
      await Promise.all(allData.map( async (el: IEdge) => (
        el.node.owner.address === userAddr ?
          temp.push({ msg: await getData(el.node.id) as string, type: 'request', timestamp: el.node.block?.timestamp || 0, txid: el.node.id }) :
            temp.push({ msg: await getData(el.node.id) as string, type: 'response', timestamp: el.node.block?.timestamp || 0, txid: el.node.id })
      )))
      setMessages(temp);
    }
    if (data) {
      reqData();
    }
  }, [ data ]);

  const handleMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewMessage(event.target.value);
  }

  const handleSend = async () => {
    const tx = await arweave.createTransaction({
      target: address,
      quantity: arweave.ar.arToWinston('0.01'),
      data: newMessage
    });
  
    tx.addTag("App-Name", "Fair Protocol");
    tx.addTag("App-Version", "v0.01");
    tx.addTag('Model-Transaction', txid!);
    tx.addTag('Operation-Name', 'Model Inference Request');
  
    await arweave.transactions.sign(tx);
    const res = await arweave.transactions.post(tx);
    const temp = [ ...messages]
    temp.push({ msg: newMessage, type: 'request', timestamp: new Date().getTime(), txid: tx.id});
    setMessages(temp);
    setPendingTxs([ ...pendingTxs, tx]);
    setNewMessage('');
  }

  return (
    <Grid container spacing={0} sx={{ height: '100%'}}>
      <Grid item xs sx={{ width: '100%', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <Paper sx={{display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%'}} elevation={4}>
          <Box flexGrow={1}></Box>
          <List>
            <ListItem alignItems="flex-start">
              <Paper variant="elevation" elevation={1} sx={{ height: '100%', width: '100%'}}>
                Conversation 1
              </Paper>
            </ListItem>
            <ListItem alignItems="flex-start">
              2
            </ListItem>
            <ListItem alignItems="flex-start">
              3
            </ListItem>
          </List>
        </Paper>
      </Grid>
      <Grid item xs={10} sx={{ width: '100%', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <Box flexGrow={1}>
          <Paper elevation={1} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%'}}>
            {
              loading || !data ? <p>Loading...</p>
                : <Divider textAlign='center'>{new Date([ ...data.results, ...data.requests ][0].node.block?.timestamp * 1000).toLocaleDateString()}</Divider>
            }
            {
              messages.map((el: Message, index: number) => (
                <Container key={index}>
                  <Stack spacing={4}  flexDirection='row' justifyContent={el.type === 'request' ? 'flex-end' : 'flex-start'}>
                    <Box display={'flex'} justifyContent={el.type === 'request' ? 'flex-end' : 'flex-start'} flexDirection='column' margin='8px'>
                      <Box display={'flex'} alignItems='center'>
                        { !!pendingTxs.find(pending => el.txid === pending.id) &&
                          <Tooltip title='This transaction is still not ocnfirmed by the network' sx={{ margin: '8px'}}>
                            <PendingActionsIcon />
                          </Tooltip>
                        }
                        <Card elevation={8} raised={true} sx={{ width: 'fit-content', paddingBottom: 0 }}>
                          <CardContent><Typography>{el.msg}</Typography></CardContent>
                        </Card>
                      </Box>
                      
                      <Typography variant='caption' textAlign={el.type === 'request' ? 'right' : 'left' }>{ el.timestamp === 0 ? 'pending' : new Date(el.timestamp * 1000).toLocaleTimeString()}</Typography>
                    </Box>
                  </Stack>
                  {  index < messages.length -1 && new Date(el.timestamp !== 0 ? el.timestamp * 1000 : new Date().getTime()).getDay() !== new Date(messages[index + 1].timestamp !== 0 ? messages[index + 1].timestamp * 1000 : new Date().getTime()).getDay() &&
                    <Divider textAlign='center'>{new Date(messages[index + 1].timestamp !== 0 ? messages[index + 1].timestamp * 1000 : new Date().getTime()).toLocaleDateString()}</Divider>
                  }
                </Container>
              ))
            }
          </Paper>
        </Box>
        <TextField
          variant='outlined'
          value={newMessage}
          onChange={handleMessageChange}
          fullWidth
          InputProps={{
            endAdornment: <IconButton onClick={handleSend}><SendIcon /></IconButton>
          }}
        />
      </Grid>
    </Grid>
  );
}

export default Chat;