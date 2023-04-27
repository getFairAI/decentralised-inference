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
import { operatorHeaders, scriptHeaders } from '@/constants';
import ScriptRow from './script-row';

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

type tableType = 'operators' | 'scripts';

export default function BasicTable(props: {
  type: tableType;
  data: IEdge[];
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
  const mockArray = genLoadingArray(5);

  useEffect(() => {
    if (isOnScreen && props.hasNextPage) {
      props.fetchMore({
        variables: {
          after: props.data[props.data.length - 1].cursor,
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
  }, [isOnScreen, props.data]);

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
  }, [props.data]);

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
              {props.type === 'operators'
                ? operatorHeaders.map((header, idx) => (
                    <TableCell
                      sx={{ background: 'transparent' }}
                      key={header}
                      align={idx > 0 ? 'right' : 'left'}
                    >
                      {header === 'Status' ? (
                        <Tooltip
                          title={
                            'Represents the operator availability in the last 100 transactions'
                          }
                          placement='top'
                        >
                          <Typography sx={{ fontWeight: 'bold' }}>{header}</Typography>
                        </Tooltip>
                      ) : (
                        <Typography sx={{ fontWeight: 'bold' }}>{header}</Typography>
                      )}
                    </TableCell>
                  ))
                : scriptHeaders.map((header, idx) => (
                    <TableCell
                      sx={{ background: 'transparent' }}
                      key={header}
                      align={idx > 0 ? 'right' : 'left'}
                    >
                      <Typography sx={{ fontWeight: 'bold' }}>{header}</Typography>
                    </TableCell>
                  ))}
            </TableRow>
          </TableHead>
          <TableBody sx={{ display: 'block', overflowY: 'auto', overflowX: 'hidden' }}>
            {props.error ? (
              <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell colSpan={6}>
                  <Typography alignItems='center' display='flex' flexDirection='column'>
                    {props.type === 'operators'
                      ? 'Could not Fetch Registered Operators for this Model.'
                      : 'Could not Fetch Scripts for this Model.'}
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
            ) : props.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    props.type === 'operators' ? operatorHeaders.length : scriptHeaders.length
                  }
                  align='center'
                >
                  <Typography>
                    {props.type === 'operators'
                      ? 'Could not find available Operators.'
                      : 'Could not find available Scripts'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              props.data.map((row, idx) =>
                props.type === 'operators' ? (
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
                ) : (
                  <ScriptRow
                    key={row.node.id}
                    scriptTx={row}
                    index={idx}
                    isSelected={props.selectedIdx === idx}
                    setSelected={props.handleSelected}
                  />
                ),
              )
            )}
          </TableBody>
        </Table>
        <Box ref={target} sx={{ paddingBottom: '8px' }}></Box>
      </TableContainer>
    </Box>
  );
}
