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
import { genLoadingArray } from '@/utils/common';
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

const BasicTableContent = ({
  data,
  type,
  state,
  loading,
  error,
  selectedIdx,
  handleSelected,
  retry,
}: {
  type: tableType;
  data: IEdge[];
  loading: boolean;
  error?: ApolloError;
  state: IEdge;
  retry: () => void;
  selectedIdx: number;
  handleSelected: (index: number) => void;
}) => {
  const mockArray = genLoadingArray(5);

  if (loading) {
    return (
      <>
        {mockArray.map((val) => (
          <TableRow key={val} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell align='right' colSpan={6} scope='row'>
              <Typography>
                <Skeleton
                  variant='rounded'
                  animation={'wave'}
                  data-testid={'loading-skeleton'}
                ></Skeleton>
              </Typography>
            </TableCell>
          </TableRow>
        ))}
      </>
    );
  }

  if (error) {
    return (
      <>
        <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
          <TableCell colSpan={6}>
            <Typography
              alignItems='center'
              display='flex'
              flexDirection='column'
              data-testid='table-error'
            >
              {type === 'operators'
                ? 'Could not Fetch Registered Operators for this Model.'
                : 'Could not Fetch Scripts for this Model.'}
              <Button sx={{ width: 'fit-content' }} endIcon={<ReplayIcon />} onClick={retry}>
                Retry
              </Button>
            </Typography>
          </TableCell>
        </TableRow>
      </>
    );
  }

  if (data.length === 0) {
    return (
      <>
        <TableRow>
          <TableCell
            colSpan={type === 'operators' ? operatorHeaders.length : scriptHeaders.length}
            align='center'
          >
            <Typography data-testid={'table-empty'}>
              {type === 'operators'
                ? 'Could not find available Operators.'
                : 'Could not find available Scripts'}
            </Typography>
          </TableCell>
        </TableRow>
      </>
    );
  }

  return (
    <>
      {data.map((row, idx) =>
        type === 'operators' ? (
          <OperatorRow
            key={row.node.id}
            operatorTx={row}
            state={state}
            index={idx}
            isSelected={selectedIdx === idx}
            setSelected={handleSelected}
          />
        ) : (
          <ScriptRow
            key={row.node.id}
            scriptTx={row}
            index={idx}
            isSelected={selectedIdx === idx}
            setSelected={handleSelected}
          />
        ),
      )}
    </>
  );
};

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

  useEffect(() => {
    if (isOnScreen && props.hasNextPage) {
      (async () =>
        props.fetchMore({
          variables: {
            after: props.data[props.data.length - 1].cursor,
          },
          updateQuery: (prev: { transactions: ITransactions }, { fetchMoreResult }) => {
            if (!fetchMoreResult) {
              return prev;
            }

            return Object.assign({}, prev, {
              transactions: {
                edges: [...prev.transactions.edges, ...fetchMoreResult.transactions.edges],
                pageInfo: fetchMoreResult.transactions.pageInfo,
              },
            });
          },
        }))();
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
            <BasicTableContent {...props} />
          </TableBody>
        </Table>
        <Box ref={target} sx={{ paddingBottom: '8px' }}></Box>
      </TableContainer>
    </Box>
  );
}
