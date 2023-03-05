import { DEFAULT_TAGS } from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { QUERY_OPERATOR_HISTORY } from '@/queries/graphql';
import { useQuery } from '@apollo/client';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

interface Row {
  txid: string;
  type: string;
  date: string;
  networkFee: number;
  appFee: number;
  destination: string;
  origin: string;
  modelTx: string;
  operation: string;
}
const OperatorDetails = () => {
  const { address } = useParams();
  const navigate = useNavigate();

  const tags = [...DEFAULT_TAGS];
  const { data, loading } = useQuery(QUERY_OPERATOR_HISTORY, { variables: { address, tags } });
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (data) {
      const results = (data.owned as IEdge[]).map((el) => {
        const node = el.node;

        return {
          txid: node.id,
          type: 'Response',
          date: new Date(node.block.timestamp * 1000).toLocaleDateString(),
          networkFee: node.fee.ar,
          appFee: node.quantity.ar,
          destination: node.recipient,
          origin: node.owner.address,
          modelTx: node.tags.find((el) => el.name === 'Model-Transaction')?.value || '',
          operation: node.tags.find((el) => el.name === 'Operation-Name')?.value || '',
        };
      });

      const requests = (data.received as IEdge[]).map((el) => {
        const node = el.node;
        return {
          txid: node.id,
          type: 'Request',
          date: new Date(node.block.timestamp * 1000).toLocaleDateString(),
          networkFee: node.fee.ar,
          appFee: node.quantity.ar,
          destination: node.recipient,
          origin: node.owner.address,
          modelTx: node.tags.find((el) => el.name === 'Model-Transaction')?.value || '',
          operation: node.tags.find((el) => el.name === 'Operation-Name')?.value || '',
        };
      });

      setRows([...requests, ...results]);
    }
  }, [data]);

  return (
    <>
      <Container sx={{ top: '64px', position: 'relative' }}>
        <Box sx={{ margin: '16px' }}>
          <Card>
            <Box display={'flex'} justifyContent={'space-between'}>
              <CardHeader title={'Operator Details'} />
              <Button
                variant='contained'
                startIcon={<ChevronLeftIcon />}
                sx={{ height: '50%', margin: '16px' }}
                onClick={() => navigate(-1)}
              >
                Back
              </Button>
            </Box>

            <CardContent>
              <Box display={'flex'} justifyContent={'space-between'} marginBottom={'16px'}>
                <TextField
                  label='Address'
                  variant='outlined'
                  value={address}
                  sx={{ width: '60%' }}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <IconButton
                        onClick={() => {
                          address && navigator.clipboard.writeText(address);
                        }}
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    ),
                  }}
                />
                <TextField
                  label='Registration Date'
                  variant='outlined'
                  value={new Date().toLocaleDateString()}
                  inputProps={{ readOnly: true }}
                />
              </Box>
              <Divider textAlign='left'>History</Divider>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label='simple table'>
                  <TableHead>
                    <TableRow>
                      <TableCell variant='head'>TxID</TableCell>
                      <TableCell variant='head'>Origin</TableCell>
                      <TableCell variant='head'>Destination</TableCell>
                      <TableCell variant='head'>Type</TableCell>
                      <TableCell variant='head'>Date&nbsp;</TableCell>
                      <TableCell variant='head' align='right'>
                        Network Fee&nbsp;(Ar)
                      </TableCell>
                      <TableCell variant='head' align='right'>
                        Application Fee&nbsp;(Ar)
                      </TableCell>
                      <TableCell variant='head' align='right'>
                        Model Tx
                      </TableCell>
                      <TableCell variant='head' align='right'>
                        Operation
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} align='center'>
                          <Typography>Loading...</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row: Row, idx: number) => (
                        <TableRow
                          key={idx}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell scope='row'>
                            <Tooltip title={row.txid}>
                              <Typography display={'flex'}>
                                {row.txid.slice(0, 5)}...{row.txid.slice(-2)}
                                <IconButton
                                  size='small'
                                  onClick={() => {
                                    navigator.clipboard.writeText(row.txid);
                                  }}
                                >
                                  <ContentCopyIcon fontSize='inherit' />
                                </IconButton>
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell align='right'>
                            <Tooltip title={row.origin}>
                              <Typography display={'flex'}>
                                {row.origin.slice(0, 5)}...{row.origin.slice(-2)}
                                <IconButton
                                  size='small'
                                  onClick={() => {
                                    navigator.clipboard.writeText(row.origin);
                                  }}
                                >
                                  <ContentCopyIcon fontSize='inherit' />
                                </IconButton>
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell align='right'>
                            <Tooltip title={row.destination}>
                              <Typography display={'flex'}>
                                {row.destination.slice(0, 5)}...{row.destination.slice(-2)}
                                <IconButton
                                  size='small'
                                  onClick={() => {
                                    navigator.clipboard.writeText(row.destination);
                                  }}
                                >
                                  <ContentCopyIcon fontSize='inherit' />
                                </IconButton>
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell align='right'>{row.type}</TableCell>
                          <TableCell align='right'>{row.date}</TableCell>
                          <TableCell align='right'>{row.networkFee}</TableCell>
                          <TableCell align='right'>{row.appFee}</TableCell>
                          <TableCell align='right'>
                            <Tooltip title={row.modelTx}>
                              <Typography display={'flex'}>
                                {row.modelTx.slice(0, 5)}...{row.modelTx.slice(-2)}
                                <IconButton
                                  size='small'
                                  onClick={() => {
                                    navigator.clipboard.writeText(row.modelTx);
                                  }}
                                >
                                  <ContentCopyIcon fontSize='inherit' />
                                </IconButton>
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell align='right'>{row.operation}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={props.data.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            /> */}
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
};

export default OperatorDetails;
