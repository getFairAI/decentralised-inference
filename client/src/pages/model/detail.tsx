import {
  Avatar,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SvgIcon,
  TextField,
  Typography,
} from '@mui/material';
import { Box } from '@mui/system';
import BasicTable, { RowData } from '@/components/basic-table';
import Stamp from '@/components/stamp';
import { useLocation, useRouteLoaderData } from 'react-router-dom';
import { useLazyQuery, useQuery } from '@apollo/client';
import { QUERY_OPERATOR_RESULTS_RESPONSES, QUERY_REGISTERED_OPERATORS } from '@/queries/graphql';
import {
  APP_VERSION,
  DEFAULT_TAGS,
  MARKETPLACE_ADDRESS,
  MODEL_INFERENCE_RESULT_TAG,
  REGISTER_OPERATION_TAG,
} from '@/constants';
import { IEdge, ITag } from '@/interfaces/arweave';
import { ChangeEvent, useEffect, useState } from 'react';
import useArweave from '@/context/arweave';
import { useSnackbar } from 'notistack';

const Detail = () => {
  const updatedFee = useRouteLoaderData('model') as string;
  const { state } = useLocation();
  const [operatorsData, setOperatorsData] = useState<RowData[]>([]);
  const [owner, setOwner] = useState('');
  const [feeValue, setFeeValue] = useState(0);
  const [feeDirty, setFeeDirty] = useState(false);
  const { arweave } = useArweave();
  const { enqueueSnackbar } = useSnackbar();

  const tags = [
    ...DEFAULT_TAGS,
    REGISTER_OPERATION_TAG,
    {
      name: 'Model-Creator',
      values: [state.node.owner.address],
    },
    {
      name: 'Model-Name',
      values: [state.node.tags.find((el: ITag) => el.name === 'Model-Name')?.value],
    },
  ];
  const {
    data: queryData,
    loading,
    error,
  } = useQuery(QUERY_REGISTERED_OPERATORS, {
    variables: { tags },
  });

  const [getFollowupQuery, followupResult] = useLazyQuery(QUERY_OPERATOR_RESULTS_RESPONSES);

  useEffect(() => {
    if (queryData) {
      const owners = Array.from(new Set(queryData.map((el: IEdge) => el.node.owner.address)));
      const tagsRequests = [
        ...tags.filter((el) => el.name !== REGISTER_OPERATION_TAG.name), // remove register operation tag
        // MODEL_INFERENCE_REQUEST_TAG,
        { name: 'Operation-Name', values: ['Inference Payment'] }, // filter by inference payment
      ];
      const tagsResults = [
        ...tags.filter((el) => el.name !== REGISTER_OPERATION_TAG.name), // remove register operation tag
        MODEL_INFERENCE_RESULT_TAG,
      ];

      getFollowupQuery({
        variables: {
          owners: owners,
          tagsRequests,
          tagsResults,
        },
      });
    }
  }, [queryData]);

  useEffect(() => {
    const getAddress = async () => {
      setOwner(await window.arweaveWallet.getActiveAddress());
    };

    if (window && window.arweaveWallet) getAddress();
  }, [window.arweaveWallet]);

  useEffect(() => {
    if (followupResult.loading) console.log('loading');
    if (followupResult.error) console.log(error, 'err');
    if (followupResult.data) {
      const requests = followupResult.data.requests as IEdge[];
      const results = followupResult.data.results as IEdge[];
      const uniqueQueryData: IEdge[] = [];
      queryData.map((el: IEdge) =>
        uniqueQueryData.filter((unique) => el.node.owner.address === unique.node.owner.address)
          .length > 0
          ? undefined
          : uniqueQueryData.push(el),
      );
      const parsed: RowData[] = uniqueQueryData.map((el: IEdge) => ({
        address: el.node.owner.address,
        stamps: Math.round(Math.random() * 100),
        fee: el.node.tags.find((el) => el.name === 'Operator-Fee')?.value || '0',
        registrationTimestamp: el.node.block
          ? new Date(el.node.block.timestamp * 1000).toLocaleString()
          : 'Pending',
        availability:
          (results.filter((res) => el.node.owner.address === res.node.owner.address).length /
            requests.filter((req) => el.node.owner.address === req.node.recipient).length) *
            100 || 0,
        modelName: state?.node?.tags?.find((el: ITag) => el.name === 'Model-Name')?.value || '',
        modelCreator: state.node.owner.address,
        modelTransaction:
          state.node.tags.find((el: ITag) => el.name === 'Model-Transaction')?.value || '',
      }));
      setOperatorsData(parsed);
    }
  }, [followupResult]);

  useEffect(() => {
    if (state) {
      if (updatedFee) {
        const arValue = arweave.ar.winstonToAr(updatedFee);
        setFeeValue(parseFloat(arValue));
      } else {
        const arValue = arweave.ar.winstonToAr(
          state.node.tags.find((el: ITag) => el.name === 'Model-Fee')?.value,
        );
        setFeeValue(parseFloat(arValue));
      }
    }
  }, [state]);

  const handleFeeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(event.target.value);
    setFeeValue(val);
    setFeeDirty(true);
  };

  const updateFee = async () => {
    try {
      const tx = await arweave.createTransaction({
        quantity: arweave.ar.arToWinston('0'),
        target: MARKETPLACE_ADDRESS,
      });
      tx.addTag('App-Name', 'Fair Protocol');
      tx.addTag('App-Version', APP_VERSION);
      tx.addTag('Operation-Name', 'Model Fee Update');
      tx.addTag(
        'Model-Transaction',
        state.node.tags.find((el: ITag) => el.name === 'Model-Transaction')?.value,
      );
      tx.addTag('Model-Fee', arweave.ar.arToWinston(`${feeValue}`));
      await arweave.transactions.sign(tx);
      const payRes = await arweave.transactions.post(tx);
      if (payRes.status === 200) {
        enqueueSnackbar(`Updated Model Fee, TxId: https://arweave.net/${tx.id}`, {
          variant: 'success',
        });
        setFeeDirty(false);
      } else {
        enqueueSnackbar(payRes.statusText, { variant: 'error' });
      }
    } catch (err) {
      enqueueSnackbar('Something Went Wrong', { variant: 'error' });
    }
  };

  return (
    <Container sx={{ top: '64px', position: 'relative' }}>
      <Box sx={{ margin: '8px' }}>
        <Card>
          <CardContent>
            <Box display={'flex'} justifyContent={'space-evenly'} marginBottom={'16px'}>
              <Box display={'flex'} flexDirection={'column'} justifyContent={'space-between'}>
                <Avatar
                  sx={{ width: '180px', height: '180px' }}
                  src={state?.node?.tags?.find((el: ITag) => el.name === 'AvatarUrl')?.value}
                />
                {owner === state.node.owner.address ? (
                  <Button variant='outlined' disabled={!feeDirty} onClick={updateFee}>
                    Update
                  </Button>
                ) : (
                  <Button
                    variant='outlined'
                    startIcon={
                      <SvgIcon>
                        <Stamp />
                      </SvgIcon>
                    }
                  >
                    Stamp
                  </Button>
                )}
              </Box>
              <Box>
                <TextField
                  label='Name'
                  variant='outlined'
                  value={state?.node?.tags?.find((el: ITag) => el.name === 'Model-Name')?.value}
                  fullWidth
                  inputProps={{ readOnly: true }}
                  sx={{ width: '70%' }}
                />
                {owner === state.node.owner.address ? (
                  <TextField
                    label='Fee'
                    variant='outlined'
                    type='number'
                    value={feeValue}
                    onChange={handleFeeChange}
                    inputProps={{ step: 0.01, inputMode: 'numeric', min: 0.01 }}
                    sx={{ width: '25%' }}
                  />
                ) : (
                  <TextField
                    label='Fee'
                    variant='outlined'
                    type='number'
                    value={feeValue}
                    inputProps={{ step: 0.01, inputMode: 'numeric', min: 0.01, readOnly: true }}
                    sx={{ width: '25%' }}
                  />
                )}

                <FormControl fullWidth margin='normal'>
                  <InputLabel>Category</InputLabel>
                  <Select
                    data-testid={'category'}
                    value={state?.node?.tags?.find((el: ITag) => el.name === 'Category')?.value}
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
                  value={state?.node?.tags?.find((el: ITag) => el.name === 'Description')?.value}
                  inputProps={{ readOnly: true }}
                  style={{ width: '100%' }}
                  margin='normal'
                  sx={{ marginBottom: 0 }}
                  minRows={2}
                  maxRows={3}
                />
              </Box>
            </Box>
            <Divider textAlign='left'>
              <Typography variant='h6'>Operators</Typography>
            </Divider>
            <BasicTable
              data={operatorsData}
              state={state}
              loading={loading || followupResult.loading}
              error={error || followupResult.error}
            ></BasicTable>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Detail;
