import { CustomStepper } from '@/components/stepper';
import {
  DEFAULT_TAGS,
  REGISTER_OPERATION_TAG,
  MARKETPLACE_ADDRESS,
  APP_VERSION,
} from '@/constants';
import { IEdge, ITag } from '@/interfaces/arweave';
import { QUERY_REGISTERED_OPERATORS } from '@/queries/graphql';
import arweave from '@/utils/arweave';
import { useQuery } from '@apollo/client';
import {
  Container,
  Box,
  Card,
  CardContent,
  Avatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { useState } from 'react';
import { useLocation, useParams, useRouteLoaderData } from 'react-router-dom';

const Register = () => {
  const updatedFee = useRouteLoaderData('model') as string;
  const { state }: { state: IEdge } = useLocation();
  const { txid } = useParams();
  const [error, setError] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [isRegistered, setIsRegistered] = useState(false);

  const tags = [
    ...DEFAULT_TAGS,
    REGISTER_OPERATION_TAG,
    {
      name: 'Model-Transaction',
      values: [txid],
    },
  ];
  const { data: queryData } = useQuery(QUERY_REGISTERED_OPERATORS, { variables: { tags } });

  const handleRegister = async (rate: string, operatorName: string) => {
    try {
      const tx = await arweave.createTransaction({
        target: MARKETPLACE_ADDRESS,
        quantity: arweave.ar.arToWinston('0.05'),
      });
      const tags = [];
      tags.push({ name: 'App-Name', values: 'Fair Protocol' });
      tags.push({ name: 'App-Version', values: APP_VERSION });
      tags.push({
        name: 'Model-Name',
        values: state.node.tags.find((el: ITag) => el.name === 'Model-Name')?.value || '',
      });
      tags.push({ name: 'Model-Creator', values: state.node.owner.address });
      tags.push({ name: 'Operator-Fee', values: arweave.ar.arToWinston(rate) });
      tags.push({ name: 'Operation-Name', values: 'Operator Registration' });
      tags.push({ name: 'Operator-Name', values: operatorName });
      tags.push({ name: 'Unix-Time', values: (Date.now() / 1000).toString() });

      tags.forEach((tag) => tx.addTag(tag.name, tag.values));

      await arweave.transactions.sign(tx);
      const response = await arweave.transactions.post(tx);
      if (response.status === 200) {
        setMessage(`Transaction Successful. View at: ${tx.id}`);
        setIsRegistered(true);
      } else {
        setError('Something went Wrong. Please Try again...');
      }
    } catch (error) {
      setError('Something went Wrong. Please Try again...');
    }
  };

  const handleClose = () => {
    setError(undefined);
    setMessage(undefined);
  };

  if (queryData) {
    console.log(queryData);
  }

  return (
    <Container>
      <Box sx={{ margin: '8px', top: '64px', position: 'relative' }}>
        <Card>
          <CardContent>
            <Box display={'flex'} justifyContent={'space-evenly'}>
              <Box display={'flex'} flexDirection={'column'}>
                <Avatar
                  sx={{ width: '200px', height: '200px' }}
                  src={state.node.tags.find((el) => el.name === 'AvatarUrl')?.value || ''}
                />
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
                <TextField
                  label='Name'
                  variant='outlined'
                  value={state.node.tags.find((el) => el.name === 'Model-Name')?.value}
                  fullWidth
                  inputProps={{ readOnly: true }}
                />
                <TextField
                  label='Fee'
                  variant='outlined'
                  type='number'
                  value={arweave.ar.winstonToAr(
                    updatedFee ||
                      state.node.tags.find((el) => el.name === 'Model-Fee')?.value ||
                      '0',
                  )}
                  inputProps={{ step: 0.01, inputMode: 'numeric', min: 0.01, readOnly: true }}
                  sx={{ width: '25%' }}
                />
                <FormControl fullWidth margin='normal'>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={state.node.tags.find((el) => el.name === 'Category')?.value}
                    label='Category'
                    inputProps={{ readOnly: true }}
                  >
                    <MenuItem value={'text'}>Text</MenuItem>
                    <MenuItem value={'audio'}>Audio</MenuItem>
                    <MenuItem value={'video'}>Video</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label='Description'
                  variant='outlined'
                  multiline
                  value={state.node.tags.find((el) => el.name === 'Description')?.value}
                  inputProps={{ readOnly: true }}
                  style={{ width: '100%' }}
                  margin='normal'
                  minRows={2}
                  maxRows={3}
                />
              </Box>
            </Box>
            <Divider textAlign='left'>
              <Typography variant='h6' gutterBottom>
                Register
              </Typography>
            </Divider>
            <CustomStepper data={state} handleSubmit={handleRegister} isRegistered={isRegistered} />
          </CardContent>
        </Card>
      </Box>
      <Snackbar open={!!error || !!message} autoHideDuration={6000} onClose={handleClose}>
        {error ? (
          <Alert severity='error' sx={{ width: '100%' }}>
            {error}
          </Alert>
        ) : (
          <Alert severity='success' sx={{ width: '100%' }}>
            {message}
          </Alert>
        )}
      </Snackbar>
    </Container>
  );
};

export default Register;
