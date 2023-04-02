import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Box, Button, Skeleton, Tooltip, Typography } from '@mui/material';
import {
  ApolloError,
  ApolloQueryResult,
  FetchMoreQueryOptions,
  OperationVariables,
} from '@apollo/client';
import ReplayIcon from '@mui/icons-material/Replay';
import { findTag, genLoadingArray } from '@/utils/common';
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
  selectedIdx: number;
  handleSelected: (index: number) => void;
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

  useEffect(() => {
    const firstRow = document.querySelector('tbody tr:first-child');
    const tableCells = firstRow?.querySelectorAll('td');
    const tableWidth = document.querySelector('table')?.clientWidth;
    if (tableWidth && tableCells) {
      const cellWidth = tableWidth / tableCells.length;
      tableCells?.forEach((el) => el.setAttribute('width', `${cellWidth}px`));
      const tableHeadCells = document.querySelectorAll('thead tr th');
      tableHeadCells.forEach((el) => el.setAttribute('width', `${cellWidth}px`));
    }
  }, []);

  return (
    <Box>
      <TableContainer>
        <Table
          sx={{
            minWidth: 650,
            background: 'transparent',
            borderBottom: '0.5px solid #FFFFFF',
            width: '100%',
          }}
          aria-label='simple table'
          stickyHeader
        >
          <TableHead sx={{ display: 'block' }}>
            <TableRow>
              <TableCell sx={{ background: 'transparent' }}>
                <Typography sx={{ fontWeight: 'bold' }}>Address</Typography>
              </TableCell>
              <TableCell sx={{ background: 'transparent' }}>
                <Typography sx={{ fontWeight: 'bold' }}>Name</Typography>
              </TableCell>
              <TableCell align='right' sx={{ background: 'transparent' }}>
                <Typography sx={{ fontWeight: 'bold' }}>Registration&nbsp;</Typography>
              </TableCell>
              <TableCell align='right' sx={{ background: 'transparent' }}>
                <Typography sx={{ fontWeight: 'bold' }}>Fee&nbsp;(Ar)</Typography>
              </TableCell>
              <TableCell align='right' sx={{ background: 'transparent' }}>
                <Tooltip
                  title={'Represents the operator availability in the last 100 transactions'}
                  placement='top'
                >
                  <Typography sx={{ fontWeight: 'bold' }}>Status</Typography>
                </Tooltip>
              </TableCell>
              <TableCell align='right' sx={{ background: 'transparent' }}>
                <Typography sx={{ fontWeight: 'bold' }}>Stamps&nbsp;</Typography>
              </TableCell>
              <TableCell align='right' sx={{ background: 'transparent' }}>
                <Typography sx={{ fontWeight: 'bold' }}>Selected&nbsp;</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={{ display: 'block', overflowY: 'auto', overflowX: 'hidden' }}>
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
              props.operators.map((row, idx) => (
                <OperatorRow
                  key={row.node.id}
                  operatorTx={row}
                  modelCreator={props.state.node.owner.address}
                  modelName={findTag(props.state, 'modelName') as string}
                  state={props.state}
                  index={idx}
                  isSelected={props.selectedIdx === idx}
                  setSelected={props.handleSelected}
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
