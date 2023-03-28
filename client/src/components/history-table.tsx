import { DEFAULT_TAGS } from '@/constants';
import useOnScreen from '@/hooks/useOnScreen';
import { IEdge } from '@/interfaces/arweave';
import { QUERY_OPERATOR_RECEIVED_HISTORY, QUERY_OPERATOR_SENT_HISTORY } from '@/queries/graphql';
import { formatNumbers } from '@/utils/common';
import { NetworkStatus, useQuery } from '@apollo/client';
import { Box, Table, TableHead, TableRow, TableCell, Typography, TableContainer, TableBody } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

export interface Row {
  txid: string;
  type: string;
  date: string;
  networkFee: string;
  appFee: string;
  destination: string;
  origin: string;
  modelTx: string;
  operation: string;
  operatorName?: string;
}

const HistoryTable = ({ address }: { address?: string}) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [ sentRows, setSentRows ] = useState<Row[]>([]);
  const [ receivedRows, setReceivedRows ] = useState<Row[]>([]);
  const [ hasSentNextPage, setHasSentNextPage ] = useState(false);
  const [ hasReceivedNextPage, setHasReceivedNextPage ] = useState(false);
  const target = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(target);
  const tags = [...DEFAULT_TAGS];

  const { data: receivedData, networkStatus: receivedNetworkStatus, fetchMore: receivedFetchMore } = useQuery(
    QUERY_OPERATOR_RECEIVED_HISTORY,
    { 
      variables: {
        address,
        tags,
        first: 5
      },
      skip: !address
    },
  );
  const { data: sentData, networkStatus: sentNetwrokStatus, fetchMore: sentFetchMore } = useQuery(
    QUERY_OPERATOR_SENT_HISTORY,
    {
      variables: {
        address,
        tags,
        first: 5
      }
    }
  );

  useEffect(() => {
    if (isOnScreen && hasSentNextPage) {
      const txs = sentData.transactions.edges;
      sentFetchMore({
        variables: {
          after: txs[txs.length -1 ].cursor
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          const newData = fetchMoreResult.transactions.edges;
          
          const merged: IEdge[] = prev && prev.transactions?.edges ? prev.transactions.edges.slice(0) : [];
          for (let i = 0; i < newData.length; ++i) {
            if (!merged.find((el: IEdge) => el.node.id === newData[i].node.id)) {
              merged.push(newData[i]);
            }
          }
          const newResult = Object.assign({}, prev, {
            transactions: {
              edges: merged,
              pageInfo: fetchMoreResult.transactions.pageInfo,
            }
          });
          return newResult;
        }
      });
    }
  }, [isOnScreen, sentRows]);

  useEffect(() => {
    if (isOnScreen && hasReceivedNextPage) {
      const txs = receivedData.transactions.edges;
      receivedFetchMore({
        variables: {
          after: txs[txs.length -1 ].cursor
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          const newData = fetchMoreResult.transactions.edges;
          
          const merged: IEdge[] = prev && prev.transactions?.edges ? prev.transactions.edges.slice(0) : [];
          for (let i = 0; i < newData.length; ++i) {
            if (!merged.find((el: IEdge) => el.node.id === newData[i].node.id)) {
              merged.push(newData[i]);
            }
          }
          const newResult = Object.assign({}, prev, {
            transactions: {
              edges: merged,
              pageInfo: fetchMoreResult.transactions.pageInfo,
            }
          });
          return newResult;
        }
      });
    }
  }, [isOnScreen, receivedRows]);

  useEffect(() => {
    if (sentData && sentNetwrokStatus === NetworkStatus.ready) {
      const txs = sentData.transactions.edges;
      setHasSentNextPage(sentData.transactions.pageInfo.hasNextPage);
      const registrations = ((txs as IEdge[]).filter(el => el.node.tags.find(tag => tag.name === 'Operation-Name')?.value === 'Operator Registration'))
        .map((el => {
          const node = el.node;
          const timestamp = parseInt(node.tags.find(tag => tag.name === 'Unix-Time')?.value || '') || node.block.timestamp;
          return {
            txid: node.id,
            type: 'Registration',
            date: new Date(timestamp * 1000).toLocaleDateString(),
            networkFee: formatNumbers(node.fee.ar),
            appFee: formatNumbers(node.quantity.ar),
            destination: node.recipient,
            origin: node.owner.address,
            modelTx: node.tags.find((el) => el.name === 'Model-Transaction')?.value || '',
            operation: node.tags.find((el) => el.name === 'Operation-Name')?.value || '',
            operatorName: node.tags.find((el) => el.name === 'Operator-Name')?.value,
          };
        }));
      
      const results = (txs as IEdge[])
        .filter(el => !registrations.find(reg => reg.txid === el.node.id))
        .map((el) => {
          const node = el.node;
          const timestamp = parseInt(node.tags.find(tag => tag.name === 'Unix-Time')?.value || '') || node.block.timestamp;
          return {
            txid: node.id,
            type: 'Response',
            date: new Date(timestamp * 1000).toLocaleDateString(),
            networkFee: formatNumbers(node.fee.ar),
            appFee: formatNumbers(node.quantity.ar),
            destination: node.recipient,
            origin: node.owner.address,
            modelTx: node.tags.find((el) => el.name === 'Model-Transaction')?.value || '',
            operation: node.tags.find((el) => el.name === 'Operation-Name')?.value || '',
          };
        });

      setSentRows([...registrations, ...results]);
    }
  }, [sentData]);

  useEffect(() => {
    if (receivedData && receivedNetworkStatus === NetworkStatus.ready) {
      const txs = receivedData.transactions.edges;
      setHasReceivedNextPage(receivedData.transactions.pageInfo.hasNextPage);
      const requests = (txs as IEdge[]).map((el) => {
        const node = el.node;
        const timestamp = parseInt(node.tags.find(tag => tag.name === 'Unix-Time')?.value || '') || node.block.timestamp;
        return {
          txid: node.id,
          type: 'Request',
          date: new Date(timestamp * 1000).toLocaleDateString(),
          networkFee: formatNumbers(node.fee.ar),
          appFee: formatNumbers(node.quantity.ar),
          destination: node.recipient,
          origin: node.owner.address,
          modelTx: node.tags.find((el) => el.name === 'Model-Transaction')?.value || '',
          operation: node.tags.find((el) => el.name === 'Operation-Name')?.value || '',
        };
      });
      setReceivedRows([ ...requests ]);
    }
  }, [ receivedData ]);

  useEffect(() => {
    if (receivedRows && sentRows) {
      const allRows = [ ...receivedRows, ...sentRows ];

      setRows(allRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    }
  }, [ receivedRows, sentRows ]);

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

  return <Box>
    <Table sx={{ minWidth: 650, background: 'transparent', borderBottom: '0.5px solid #FFFFFF' }} aria-label='simple table' stickyHeader> 
      <TableHead>
        <TableRow>
          <TableCell sx={{ background: 'transparent'}}>
            <Typography sx={{ fontWeight: 'bold' }}>Tx Id</Typography>
          </TableCell>
          <TableCell sx={{ background: 'transparent'}}>
            <Typography sx={{ fontWeight: 'bold' }}>Type</Typography>
          </TableCell>
          <TableCell sx={{ background: 'transparent'}}>
            <Typography sx={{ fontWeight: 'bold' }}>Operation</Typography>
          </TableCell>
          <TableCell align='right' sx={{ background: 'transparent'}}>
            <Typography sx={{ fontWeight: 'bold' }}>Date&nbsp;</Typography>
          </TableCell>
          <TableCell align='right' sx={{ background: 'transparent'}}>
            <Typography sx={{ fontWeight: 'bold' }}>Network Fee&nbsp;(Ar)</Typography>
          </TableCell>
          <TableCell align='right' sx={{ background: 'transparent'}}>
            <Typography sx={{ fontWeight: 'bold' }}>App Fee</Typography>
          </TableCell>
          <TableCell align='right' sx={{ background: 'transparent'}}>
            <Typography sx={{ fontWeight: 'bold' }}>Destination&nbsp;</Typography>
          </TableCell>
          <TableCell align='right' sx={{ background: 'transparent'}}>
            <Typography sx={{ fontWeight: 'bold' }}>Origin&nbsp;</Typography>
          </TableCell>
        </TableRow>
      </TableHead>
    </Table>
    <TableContainer sx={{
      maxHeight: '300px'
    }}>
      <Table aria-label='simple table'>
        <TableBody>
          {
            rows.map((row) => (
              <TableRow key={row.txid}>
                <TableCell sx={{ background: 'transparent'}}>
                  <Typography sx={{ fontWeight: 'bold' }}>{row.txid}</Typography>
                </TableCell>
                <TableCell sx={{ background: 'transparent'}}>
                  <Typography sx={{ fontWeight: 'bold' }}>{row.type}</Typography>
                </TableCell>
                <TableCell sx={{ background: 'transparent'}}>
                  <Typography sx={{ fontWeight: 'bold' }}>{row.operation}</Typography>
                </TableCell>
                <TableCell align='right' sx={{ background: 'transparent'}}>
                  <Typography sx={{ fontWeight: 'bold' }}>{row.date}</Typography>
                </TableCell>
                <TableCell align='right' sx={{ background: 'transparent'}}>
                  <Typography sx={{ fontWeight: 'bold' }}>{row.networkFee}</Typography>
                </TableCell>
                <TableCell align='right' sx={{ background: 'transparent'}}>
                  <Typography sx={{ fontWeight: 'bold' }}>{row.appFee}</Typography>
                </TableCell>
                <TableCell align='right' sx={{ background: 'transparent'}}>
                  <Typography sx={{ fontWeight: 'bold' }}>{row.destination}</Typography>
                </TableCell>
                <TableCell align='right' sx={{ background: 'transparent'}}>
                  <Typography sx={{ fontWeight: 'bold' }}>{row.origin}</Typography>
                </TableCell>
              </TableRow>
            ))
          }
          <TableRow><TableCell><div ref={target}></div></TableCell></TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  </Box>;
};

export default HistoryTable;