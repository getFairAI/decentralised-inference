import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Box, Button, Skeleton, Tooltip, Typography } from '@mui/material';
import {
  ApolloError,
  ApolloQueryResult,
  FetchMoreQueryOptions,
  OperationVariables,
} from '@apollo/client';
import ReplayIcon from '@mui/icons-material/Replay';
import { genLoadingArray } from '@/utils/common';
import OperatorRow from './operator-row';
import { IEdge, ITag, ITransactions } from '@/interfaces/arweave';
import { useEffect, useRef } from 'react';
import useOnScreen from '@/hooks/useOnScreen';

type fetchMoreFn = <
  TFetchData = unknown,
  TFetchVars extends OperationVariables = { tags: ITag[]; first: number },
>(
  fetchMoreOptions: FetchMoreQueryOptions<TFetchVars, TFetchData> & {
    updateQuery?: (
      previousQueryResult: TFetchData,
      options: {
        fetchMoreResult: TFetchData;
        variables: TFetchVars;
      },
    ) => TFetchData;
  },
) => Promise<ApolloQueryResult<TFetchData | undefined>>;

export default function BasicTable(props: {
  operators: IEdge[];
  loading: boolean;
  error?: ApolloError;
  state: IEdge;
  retry: () => void;
  hasNextPage: boolean;
  fetchMore: fetchMoreFn;
}) {
  const target = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(target);
  const mockArray = genLoadingArray(10);

  useEffect(() => {
    if (isOnScreen && props.hasNextPage) {
      props.fetchMore({
        variables: {
          after: props.operators[props.operators.length - 1].cursor,
        },
        updateQuery: (prev: { transactions: ITransactions }, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          const newResult = Object.assign({}, prev, {
            transactions: {
              edges: [...prev.transactions.edges, ...fetchMoreResult.transactions.edges],
              pageInfo: fetchMoreResult.transactions.pageInfo,
            },
          });
          return newResult;
        },
      });
    }
  }, [isOnScreen, props.operators]);

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label='simple table'>
          <TableHead>
            <TableRow>
              <TableCell variant='head'>
                <Typography sx={{ fontWeight: 'bold' }}>Address</Typography>
              </TableCell>
              <TableCell variant='head' align='right'>
                <Typography sx={{ fontWeight: 'bold' }}>Registration&nbsp;</Typography>
              </TableCell>
              <TableCell variant='head' align='right'>
                <Typography sx={{ fontWeight: 'bold' }}>Fee&nbsp;(Ar)</Typography>
              </TableCell>
              <TableCell variant='head' align='right'>
                <Tooltip
                  title={'Represents the operator availability in the last 100 transactions'}
                  placement='top'
                >
                  <Typography sx={{ fontWeight: 'bold' }}>Status</Typography>
                </Tooltip>
              </TableCell>
              <TableCell variant='head' align='right'>
                <Typography sx={{ fontWeight: 'bold' }}>Stamps&nbsp;</Typography>
              </TableCell>
              <TableCell variant='head' align='right'>
                <Typography sx={{ fontWeight: 'bold' }}>Actions&nbsp;</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.error ? (
              <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell colSpan={6}>
                  <Typography alignItems='center' display='flex' flexDirection='column'>
                    Could not Fetch Registered Operators for this Model.
                    <Button
                      sx={{ width: 'fit-content' }}
                      endIcon={<ReplayIcon />}
                      onClick={props.retry}
                    >
                      Retry
                    </Button>
                  </Typography>
                </TableCell>
              </TableRow>
            ) : props.loading ? (
              mockArray.map((val) => {
                return (
                  <TableRow key={val} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell align='right' colSpan={6} scope='row'>
                      <Typography>
                        <Skeleton variant='rounded' animation={'wave'}></Skeleton>
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              props.operators.map((row) => (
                <OperatorRow
                  key={row.node.id}
                  operatorTx={row}
                  modelCreator={props.state.node.owner.address}
                  modelName={
                    props.state.node.tags.find((el: ITag) => el.name === 'Model-Name')
                      ?.value as string
                  }
                  state={props.state}
                />
              ))
            )}
          </TableBody>
        </Table>
        <div ref={target}></div>
      </TableContainer>
    </Box>
  );
}
