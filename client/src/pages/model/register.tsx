import { CustomStepper } from '@/components/stepper';
import { MARKETPLACE_ADDRESS, APP_VERSION, TAG_NAMES, APP_NAME, REGISTER_OPERATION } from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { RouteLoaderResult } from '@/interfaces/router';
import arweave from '@/utils/arweave';
import { findTag } from '@/utils/common';
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
} from '@mui/material';
import { toSvg } from 'jdenticon';
import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import { useLocation, useRouteLoaderData } from 'react-router-dom';

const Register = () => {
  const { updatedFee, avatarTxId } = useRouteLoaderData('model-alt') as RouteLoaderResult || {};
  const { state }: { state: IEdge } = useLocation();
  const [isRegistered, setIsRegistered] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const imgUrl = useMemo(() => {
    if (avatarTxId) {
      return `https://arweave.net/${avatarTxId}`;
    }
    const img = toSvg(state.node.id, 100);
    const svg = new Blob([img], { type: 'image/svg+xml' });
    return URL.createObjectURL(svg);
  }, [state, avatarTxId]);

  const handleRegister = async (rate: string, operatorName: string) => {
    try {
      const tx = await arweave.createTransaction({
        target: MARKETPLACE_ADDRESS,
        quantity: arweave.ar.arToWinston('0.05'),
      });
      const tags = [];
      tags.push({ name: TAG_NAMES.appName, values: APP_NAME });
      tags.push({ name: TAG_NAMES.appVersion, values: APP_VERSION });
      tags.push({
        name: TAG_NAMES.modelName,
        values: findTag(state, 'modelName') || '',
      });
      tags.push({ name: TAG_NAMES.modelCreator, values: state.node.owner.address });
      tags.push({ name: TAG_NAMES.operatorFee, values: arweave.ar.arToWinston(rate) });
      tags.push({ name: TAG_NAMES.operationName, values: REGISTER_OPERATION });
      tags.push({ name: TAG_NAMES.operatorName, values: operatorName });
      tags.push({ name: TAG_NAMES.unixTime, values: (Date.now() / 1000).toString() });

      tags.forEach((tag) => tx.addTag(tag.name, tag.values));

      await arweave.transactions.sign(tx);
      const response = await arweave.transactions.post(tx);
      if (response.status === 200) {
        enqueueSnackbar(
          <>
            Operator Registration Submitted.
            <br></br>
            <a href={`https://viewblock.io/arweave/tx/${tx.id}`} target={'_blank'} rel='noreferrer'>
              <u>View Transaction in Explorer</u>
            </a>
          </>,
          { variant: 'success' },
        );
        setIsRegistered(true);
      } else {
        enqueueSnackbar('Something went Wrong. Please Try again...', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Something went Wrong. Please Try again...', { variant: 'error' });
    }
  };

  return (
    <Container>
      <Box sx={{ margin: '8px' }}>
        <Card>
          <CardContent>
            <Box display={'flex'} justifyContent={'space-evenly'}>
              <Box display={'flex'} flexDirection={'column'}>
                <Avatar
                  sx={{ width: '200px', height: '200px' }}
                  src={imgUrl}
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
                  value={findTag(state, 'modelName')}
                  fullWidth
                  inputProps={{ readOnly: true }}
                />
                <NumericFormat
                  value={arweave.ar.winstonToAr(
                    updatedFee ||
                      findTag(state, 'modelFee') ||
                      '0',
                  )}
                  customInput={TextField}
                  decimalScale={4}
                  label='Fee'
                  variant='outlined'
                  decimalSeparator={'.'}
                  inputProps={{ readOnly: true }}
                  sx={{ width: '25%' }}
                />
                <FormControl fullWidth margin='normal'>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={findTag(state, 'category')}
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
                  value={findTag(state, 'description')}
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
    </Container>
  );
};

export default Register;
