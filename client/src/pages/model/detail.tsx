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
import BasicTable from '@/components/basic-table';
import Stamp from '@/components/stamp';
import { useLocation, useRouteLoaderData } from 'react-router-dom';
import { NetworkStatus, useQuery } from '@apollo/client';
import { QUERY_REGISTERED_OPERATORS } from '@/queries/graphql';
import {
  APP_VERSION,
  DEFAULT_TAGS,
  MARKETPLACE_ADDRESS,
  REGISTER_OPERATION_TAG,
} from '@/constants';
import { IEdge, ITag } from '@/interfaces/arweave';
import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import arweave from '@/utils/arweave';
import { WalletContext } from '@/context/wallet';
import { NumericFormat } from 'react-number-format';

const Detail = () => {
  const updatedFee = useRouteLoaderData('model') as string;
  const { state } = useLocation();
  const [operatorsData, setOperatorsData] = useState<IEdge[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [feeValue, setFeeValue] = useState(0);
  const [feeDirty, setFeeDirty] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { currentAddress: owner } = useContext(WalletContext);
  const elementsPerPage = 5;

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
    networkStatus,
    refetch,
    fetchMore,
  } = useQuery(QUERY_REGISTERED_OPERATORS, {
    variables: { tags, first: elementsPerPage },
  });

  const handleRetry = () => {
    refetch({ tags });
  };

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
      tx.addTag('Unix-Time', (Date.now() / 1000).toString());
      await arweave.transactions.sign(tx);
      const payRes = await arweave.transactions.post(tx);
      if (payRes.status === 200) {
        enqueueSnackbar(
          <>
            Updated Model Fee
            <br></br>
            <a href={`https://viewblock.io/arweave/tx/${tx.id}`} target={'_blank'} rel='noreferrer'>
              <u>View Transaction in Explorer</u>
            </a>
          </>,
          {
            variant: 'success',
          },
        );
        setFeeDirty(false);
      } else {
        enqueueSnackbar(payRes.statusText, { variant: 'error' });
      }
    } catch (err) {
      enqueueSnackbar('Something Went Wrong', { variant: 'error' });
    }
  };

  useEffect(() => {
    // check has paid correct registration fee
    if (queryData && networkStatus === NetworkStatus.ready) {
      setHasNextPage(queryData.transactions.pageInfo.hasNextPage);
      const uniqueOperators = Array.from(
        new Set(queryData.transactions.edges.map((el: IEdge) => el.node.owner.address)),
      );
      setOperatorsData(
        queryData.transactions.edges.filter(
          (el: IEdge) => !!uniqueOperators.find((unique) => unique === el.node.owner.address),
        ),
      );
    }
  }, [queryData]);

  return (
    <Container>
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
                  <NumericFormat
                    value={feeValue}
                    onChange={handleFeeChange}
                    customInput={TextField}
                    decimalScale={4}
                    label='Fee'
                    variant='outlined'
                    decimalSeparator={'.'}
                    sx={{ width: '25%' }}
                  />
                ) : (
                  <NumericFormat
                    value={feeValue}
                    onChange={handleFeeChange}
                    customInput={TextField}
                    decimalScale={4}
                    label='Fee'
                    variant='outlined'
                    decimalSeparator={'.'}
                    sx={{ width: '25%' }}
                    inputProps={{ readOnly: true }}
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
              operators={operatorsData}
              loading={loading}
              error={error}
              state={state}
              retry={handleRetry}
              hasNextPage={hasNextPage}
              fetchMore={fetchMore}
            ></BasicTable>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Detail;
