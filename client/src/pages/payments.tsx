import PendingCard from '@/components/pending-card';
import {
  DEFAULT_TAGS,
  TAG_NAMES,
  MODEL_CREATION,
  SAVE_REGISTER_OPERATION,
  MODEL_FEE_PAYMENT_SAVE,
  SCRIPT_INFERENCE_REQUEST,
  SCRIPT_INFERENCE_RESPONSE,
  N_PREVIOUS_BLOCKS,
  SCRIPT_CREATION,
  SCRIPT_FEE_PAYMENT_SAVE,
} from '@/constants';
import { WalletContext } from '@/context/wallet';
import useOnScreen from '@/hooks/useOnScreen';
import { IEdge } from '@/interfaces/arweave';
import { QUERY_USER_INTERACTIONS } from '@/queries/graphql';
import arweave from '@/utils/arweave';
import { useQuery } from '@apollo/client';
import {
  Box,
  Typography,
  Button,
  Backdrop,
  CircularProgress,
  useTheme,
  Container,
  Stack,
  InputBase,
  Icon,
} from '@mui/material';
import { useContext, useState, useEffect, useRef, ChangeEvent } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import _ from 'lodash';
import { findTag } from '@/utils/common';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const Payments = () => {
  const elementsPerPage = 10;
  const { currentAddress } = useContext(WalletContext);
  const [minHeight, setMinHeight] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const [filteredValues, setFilteredValues] = useState<IEdge[]>([]);
  const [startDateFilter, setStartDateFilter] = useState<string | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<string | null>(null);
  const theme = useTheme();
  const target = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(target);

  const { data, previousData, error, loading, refetch, fetchMore } = useQuery(
    QUERY_USER_INTERACTIONS,
    {
      variables: {
        address: currentAddress,
        tags: [
          ...DEFAULT_TAGS,
          {
            name: TAG_NAMES.operationName,
            values: [
              MODEL_CREATION,
              SAVE_REGISTER_OPERATION,
              MODEL_FEE_PAYMENT_SAVE,
              SCRIPT_FEE_PAYMENT_SAVE,
              SCRIPT_INFERENCE_REQUEST,
              SCRIPT_INFERENCE_RESPONSE,
              SCRIPT_CREATION,
            ],
          },
        ],
        minBlockHeight: 0,
        first: elementsPerPage,
      },
      skip: !currentAddress || minHeight <= 0,
      notifyOnNetworkStatusChange: true,
    },
  );

  useEffect(() => {
    const asyncWrapper = async () => {
      const currentHeight = (await arweave.blocks.getCurrent()).height;
      setMinHeight(currentHeight - N_PREVIOUS_BLOCKS);
    };
    asyncWrapper();
  });

  useEffect(() => {
    if (data && !_.isEqual(data, previousData)) {
      setHasNextPage(data.transactions.pageInfo.hasNextPage);
    }
  }, [data]);

  useEffect(() => {
    if (isOnScreen && hasNextPage) {
      const txs = data.transactions.edges;
      fetchMore({
        variables: {
          after: txs.length > 0 ? txs[txs.length - 1].cursor : undefined,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          const newData = fetchMoreResult.transactions.edges;

          const merged: IEdge[] =
            prev && prev.transactions?.edges ? prev.transactions.edges.slice(0) : [];
          for (let i = 0; i < newData.length; ++i) {
            if (!merged.find((el: IEdge) => el.node.id === newData[i].node.id)) {
              merged.push(newData[i]);
            }
          }
          const newResult = Object.assign({}, prev, {
            transactions: {
              edges: merged,
              pageInfo: fetchMoreResult.transactions.pageInfo,
            },
          });
          return newResult;
        },
      });
    }
  }, [isOnScreen, hasNextPage]);

  useEffect(() => {
    if (filterValue && data) {
      const filteredData = data.transactions.edges.filter(
        (el: IEdge) =>
          el.node.id.toLowerCase().indexOf(filterValue) !== -1 ||
          el.node.recipient.toLowerCase().indexOf(filterValue) !== -1 ||
          findTag(el, 'operationName')?.toLowerCase().indexOf(filterValue) !== -1,
      );
      setFilteredValues(filteredData);
    } else if (data) {
      setFilteredValues(data.transactions.edges);
    } else {
      setFilteredValues([]);
    }
  }, [filterValue, data]);

  useEffect(() => {
    /* console.log(startDateFilter);
    console.log(endDateFilter); */
  }, [startDateFilter, endDateFilter]);

  const refreshClick = () => {
    refetch();
  };

  return (
    <Container sx={{ paddingTop: '16px' }} maxWidth='lg'>
      {error ? (
        <Box display={'flex'} flexDirection={'column'} alignItems={'center'} padding={'16px'}>
          <Typography textAlign={'center'}>
            There Was a Problem Fetching previous payments...
          </Typography>
        </Box>
      ) : data && data.transactions.edges.length === 0 ? (
        <Box>
          <Typography textAlign={'center'}>You Have No Pending Transactions</Typography>
        </Box>
      ) : (
        <>
          <Box paddingLeft={'8px'}>
            <Button onClick={refreshClick} endIcon={<RefreshIcon />} variant='outlined'>
              <Typography>Refresh</Typography>
            </Button>
          </Box>
          <Box display={'flex'} justifyContent={'space-between'} padding={'16px 8px'}>
            <Box display={'flex'} gap={'8px'}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label='Start Date'
                  value={startDateFilter}
                  disabled
                  onChange={(newValue: string | null) => setStartDateFilter(newValue)}
                />
                <DatePicker
                  label='End Date'
                  value={endDateFilter}
                  disabled
                  onChange={(newValue: string | null) => setEndDateFilter(newValue)}
                />
              </LocalizationProvider>
            </Box>
            <Box
              width={'40%'}
              sx={{
                borderRadius: '30px',
                display: 'flex',
                justifyContent: 'space-between',
                padding: '3px 20px 3px 0px',
                alignItems: 'center',
                background: theme.palette.background.default,
              }}
            >
              <InputBase
                sx={{
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '18px',
                  lineHeight: '16px',
                  width: '100%',
                }}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setFilterValue(event.target.value)
                }
                placeholder='Search By Id, Recipient or Operation Name'
              />
              <Icon
                sx={{
                  height: '30px',
                }}
              >
                <img src='./search-icon.svg'></img>
              </Icon>
            </Box>
          </Box>
          <Stack spacing={2}>
            {filteredValues.map((tx: IEdge) => (
              <PendingCard tx={tx} key={tx.node.id} autoRetry={false} />
            ))}
          </Stack>
        </>
      )}
      {loading && (
        <Backdrop
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            borderRadius: '23px',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
          }}
          open={true}
        >
          <Typography variant='h2' color={theme.palette.primary.main}>
            Fetching Latest Payments...
          </Typography>
          <CircularProgress color='primary' />
        </Backdrop>
      )}
      <Box ref={target} sx={{ paddingBottom: '16px' }}></Box>
    </Container>
  );
};

export default Payments;
