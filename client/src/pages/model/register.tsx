import { CustomStepper } from "@/components/stepper";
import { DEFAULT_TAGS, REGISTER_OPERATION_TAG, STATIC_ADDRESS } from "@/constants";
import useArweave from "@/context/arweave";
import { QUERY_REGISTERED_OPERATORS } from "@/queries/graphql";
import { useQuery } from "@apollo/client";
import { Container, Box, Card, CardContent, Avatar, SvgIcon, TextField, FormControl, InputLabel, Select, MenuItem, Divider, Typography, Snackbar, Alert } from "@mui/material";
import { useState } from "react";
import { useParams, useRouteLoaderData, useSearchParams } from "react-router-dom";

const Register = () => {
  const { data }: any = useRouteLoaderData('model');
  const { txid } = useParams();
  
  const { arweave } = useArweave();
  const [ error, setError ] = useState<string | undefined>(undefined);
  const [ message, setMessage ] = useState<string | undefined>(undefined);
  const [ isRegistered, setIsRegistered ] = useState(false);

  const tags = [
    ...DEFAULT_TAGS,
    REGISTER_OPERATION_TAG,
    {
      name: "Model-Transaction",
      values: [ txid ]
    },
  ];
  const { data: queryData, loading, error: queryError } = useQuery(QUERY_REGISTERED_OPERATORS, { variables: { tags }});


  const handleRegister = async (rate: string) => {
    try {
      const tx = await arweave.createTransaction({
        target: STATIC_ADDRESS,
        quantity: arweave.ar.arToWinston('0.05'),
      });
      const tags = [];
      tags.push({ name: 'App-Name', values: 'Fair Protocol'});
      tags.push({ name: 'App-Version', values: 'v0.01'});
      tags.push({ name: 'Model-Transaction', values: txid as string});
      tags.push({ name: 'Model-Fee', values:  arweave.ar.arToWinston(rate) });
      tags.push({ name: 'Operation-Name', values: 'Operator Registration'});

      tags.map((tag) => tx.addTag(tag.name, tag.values));
     
      await arweave.transactions.sign(tx);
      const response = await arweave.transactions.post(tx);
      setMessage(`Transaction Successful. View at: ${tx.id}`);
      setIsRegistered(true);
    } catch (error) {
      setError('Something went Wrong. Please Try again...');
    }
  }

  const handleClose = () => {
    setError(undefined);
    setMessage(undefined);
  }

  if (queryData) {
    console.log(queryData);
  }

  return (<Container>
      <Box sx={{ margin: '8px' }}>
        <Card>
          <CardContent>
            <Box display={'flex'} justifyContent={'space-evenly'}>
              <Box display={'flex'} flexDirection={'column'}>
                <Avatar sx={ { width: '200px', height: '200px' }}/>
                {/* <Box marginTop={'8px'} display={'flex'} justifyContent={'flex-start'}>
                  <Button startIcon={<DownloadIcon />}>
                    <a href={`http://localhost:1984/${txid}`} download>download</a>
                  </Button>
                  <Button endIcon={<OpenInNewIcon />} onClick={openDialog}>Usage Notes</Button>
                </Box> */}
                <Box>
                  {/* <SvgIcon>
                    <Stamp />
                  </SvgIcon> */}
                  {/* <IconButton aria-label="upvote">
                    <ThumbUpIcon />
                  </IconButton>
                  38
                  <IconButton aria-label="downvote">
                    <ThumbDownIcon />
                  </IconButton> */}
                </Box>
                
              </Box>
              <Box>
                <TextField label="Name" variant="outlined" value={''} fullWidth inputProps={{ readOnly: true }}/>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={'text'}
                    label="Category"
                    inputProps={{ readOnly: true }}
                  >
                    <MenuItem value={'text'}>Text</MenuItem>
                    <MenuItem value={'audio'}>Audio</MenuItem>
                    <MenuItem value={'video'}>Video</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Description"
                  variant="outlined"
                  multiline
                  value={''}
                  inputProps={{ readOnly: true }}
                  style={{ width: '100%' }}
                  margin="normal"
                  minRows={2}
                  maxRows={3}
                />
              </Box>
            </Box>
            <Divider textAlign='left'>
              <Typography variant="h6" gutterBottom>Register</Typography>
            </Divider>
            <CustomStepper data={data} handleSubmit={handleRegister} isRegistered={isRegistered}/>
          </CardContent>
        </Card>
      </Box>
      <Snackbar open={!!error || !!message} autoHideDuration={6000} onClose={handleClose}>
        {
          error ? <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>
            : <Alert severity="success" sx={{ width: '100%' }}>{message}</Alert>
        }
      </Snackbar>
    </Container>);
}

export default Register;